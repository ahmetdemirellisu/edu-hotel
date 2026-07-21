<?php
/**
 * Production Redis Sentinel Session Injector (phpredis 6.0+)
 * Hardened for min-replicas-to-write constraints
 * Executed via PHP-FPM auto_prepend_file
 */
(function () {
    try {
        // 1. Fetch Configuration
        $sentinelHostsStr = getenv("REDIS_SENTINEL_HOSTS") ?: "127.0.0.1";
        $sentinels = explode(",", $sentinelHostsStr);
        $serviceName = getenv("REDIS_SENTINEL_SERVICE") ?: "mymaster";
        $prefix = getenv("REDIS_SESSION_PREFIX") ?: "php_sessions:";
        $timeout = getenv("REDIS_TIMEOUT") ?: "0.5";

        // 2. Parse Credentials
        $sentinelCredsStr = getenv("REDIS_SENTINEL_CREDS") ?: "default,";
        $sentinelCreds = explode(",", $sentinelCredsStr, 2);
        $sentinelAuth = [
            $sentinelCreds[0] ?? "default",
            $sentinelCreds[1] ?? "",
        ];

        $masterCredsStr = getenv("REDIS_MASTER_CREDS") ?: "default,";
        $masterCreds = explode(",", $masterCredsStr, 2);
        $masterUser = $masterCreds[0] ?? "default";
        $masterPass = $masterCreds[1] ?? "";
        $masterAuthString =
            "auth[]=" .
            urlencode($masterUser) .
            "&auth[]=" .
            urlencode($masterPass);

        // 3. Secure Micro-cache setup (Assumes /run/nginx/phptmp is a tmpfs mount)
        $cacheDir = "/run/nginx/phptmp";
        $cacheFile =
            $cacheDir . "/php_redis_master_" . md5($serviceName) . ".txt";
        $cacheTTL = 30;

        $masterIp = null;
        $masterPort = null;

        // 4. Helper Function: Validate Master using native phpredis
        $isMasterHealthy = function ($ip, $port, $user, $pass) {
            try {
                $redis = new Redis();

                // Lightning-fast 0.2s connection attempt
                if (!$redis->connect($ip, $port, 0.2)) {
                    return false;
                }

                // Authenticate if a password exists
                if ($pass !== "") {
                    if (!$redis->auth([$user, $pass])) {
                        $redis->close();
                        return false;
                    }
                }

                // Ask for the node's role using the native C-extension
                $role = $redis->role();

                // $role[0] = 'master'
                // $role[2] = Array of connected replicas
                if (isset($role[0]) && $role[0] === "master") {
                    // Check if it has at least 1 connected replica (satisfies min-replicas-to-write > 0)
                    if (
                        isset($role[2]) &&
                        is_array($role[2]) &&
                        count($role[2]) > 0
                    ) {
                        $redis->close();
                        return true;
                    }
                }

                $redis->close();
                return false;
            } catch (Throwable $e) {
                // Failsafe: If socket times out or auth rejects, classify as unhealthy
                return false;
            }
        };

        // 5. Check Micro-cache
        if (
            file_exists($cacheFile) &&
            time() - @filemtime($cacheFile) < $cacheTTL
        ) {
            $cachedData = explode(":", trim(@file_get_contents($cacheFile)));
            if (count($cachedData) === 2) {
                $candidateIp = filter_var($cachedData[0], FILTER_VALIDATE_IP);
                $candidatePort = filter_var(
                    $cachedData[1],
                    FILTER_VALIDATE_INT,
                );

                // Pre-Flight Check 1: Is the cached node alive AND are its replication links healthy?
                if (
                    $candidateIp &&
                    $candidatePort &&
                    $isMasterHealthy(
                        $candidateIp,
                        $candidatePort,
                        $masterUser,
                        $masterPass,
                    )
                ) {
                    $masterIp = $candidateIp;
                    $masterPort = $candidatePort;
                } else {
                    @unlink($cacheFile); // Node is dead, demoted, or replication broke. Destroy cache.
                }
            }
        }

        // 6. Discover Master via Sentinel (if cache miss or destroyed)
        if (!$masterIp || !$masterPort) {
            foreach ($sentinels as $host) {
                try {
                    $sentinel = new RedisSentinel([
                        "host" => trim($host),
                        "port" => 26379,
                        "connectTimeout" => (float) $timeout,
                        "auth" => $sentinelAuth,
                    ]);

                    $master = $sentinel->getMasterAddrByName($serviceName);

                    if ($master && is_array($master)) {
                        $candidateIp = filter_var(
                            $master[0],
                            FILTER_VALIDATE_IP,
                        );
                        $candidatePort = filter_var(
                            $master[1],
                            FILTER_VALIDATE_INT,
                        );

                        // Pre-Flight Check 2: Sentinel gave us an IP. Check if its replication stream is healthy!
                        if (
                            $candidateIp &&
                            $candidatePort &&
                            $isMasterHealthy(
                                $candidateIp,
                                $candidatePort,
                                $masterUser,
                                $masterPass,
                            )
                        ) {
                            $masterIp = $candidateIp;
                            $masterPort = $candidatePort;

                            // Atomic Write to Cache (prevents race conditions across PHP-FPM workers)
                            $tmpFile = $cacheFile . uniqid(".tmp", true);
                            if (
                                @file_put_contents(
                                    $tmpFile,
                                    "{$masterIp}:{$masterPort}",
                                )
                            ) {
                                @chmod($tmpFile, 0600);
                                @rename($tmpFile, $cacheFile);
                            }
                            break; // Success! We found a fully healthy master.
                        }
                    }
                } catch (Throwable $e) {
                    continue; // Sentinel node failed, try the next one
                }
            }
        }

        // 7. Inject the Session Configuration
        if ($masterIp && $masterPort) {
            $savePath = "tcp://{$masterIp}:{$masterPort}?{$masterAuthString}&prefix={$prefix}&timeout={$timeout}&read_timeout={$timeout}";
            ini_set("session.save_handler", "redis");
            ini_set("session.save_path", $savePath);
        } else {
            // Force the failsafe block to trigger
            throw new RuntimeException(
                "Valkey Master failsafe: No active master found with healthy replication links.",
            );
        }
    } catch (Throwable $e) {
        // 8. Failsafe: Fallback to local files so the application never crashes
        error_log("CRITICAL (Session Bootstrap): " . $e->getMessage());
        ini_set("session.save_handler", "files");
        ini_set("session.save_path", sys_get_temp_dir());
    }
})();
