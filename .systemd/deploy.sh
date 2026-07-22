#!/bin/bash

# ==============================================================================
# 🚀 PODMAN UNIVERSAL QUADLET DEPLOYER (v1.24.9)
# Per-Container Pull Credentials | Pull=never Fix | Dynamic Backgrounding
# ==============================================================================

set -o pipefail

show_help() {
    echo "=========================================================================="
    echo " 🚀 PODMAN UNIVERSAL QUADLET DEPLOYER"
    echo "=========================================================================="
    echo "Usage: Export variables before running."
    echo "  export SERVICES='main-svc:sidecar1:sidecar2'"
    echo "  export APP_PULL_CREDS='user1:tok1 user2:tok2 user3:tok3'"
    echo "  export APP_PORTS='8080:3000:0'"
    echo "  export ENVIRONMENT_NAME='development'"
    echo "  export APP_CPUS='100%:50%:25%'"
    echo "  export APP_MEMS='1G:512M:256M'"
    echo "  export APP_STOP_TIMEOUT_SEC='3600:15:15'"
    echo "  export CHECK_QUEUES='true'"
    echo "  bash deploy.sh"
    exit 1
}

log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# ==============================================================================
# PHASE 0: STRICT INPUT VALIDATION & PARSING
# ==============================================================================
log_info "🛡️  PHASE 0: Validating Inputs from Environment / CLI..."

INPUT_SERVICES="${SERVICES:-$1}"
INPUT_PORTS="${APP_PORTS:-$2}"
SCALE_ARG="${APP_SCALE:-${3:-1}}"
PORT_OFFSET="${APP_OFFSET:-${4:-0}}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-$5}"
INPUT_CPUS="${APP_CPUS:-${6:-100%}}"
INPUT_MEMS="${APP_MEMS:-${7:-512M}}"

# Parse UIDs and GIDs into arrays separated by colons
IFS=':' read -r -a UID_ARRAY <<< "${APP_UID:-$8}"
IFS=':' read -r -a GID_ARRAY <<< "${APP_GID:-$9}"

CHECK_QUEUES="${CHECK_QUEUES:-false}"
MONITOR_QUEUES="${MONITOR_QUEUES:-redis:default,redis:ldap}"
APP_PULL_CREDS="${APP_PULL_CREDS:-}"

if [[ -z "$INPUT_SERVICES" || -z "$INPUT_PORTS" || -z "$ENVIRONMENT_NAME" ]]; then
    show_help
    log_info "❌ FATAL: Missing core parameters."
    exit 1
fi

if [[ "$INPUT_SERVICES" == *":"* ]]; then
    IFS=':' read -r -a EXPLICIT_SVC_ARRAY <<< "$INPUT_SERVICES"
    SERVICE_NAME="${EXPLICIT_SVC_ARRAY[0]}"
    USE_EXPLICIT_ORDER=true
else
    SERVICE_NAME="$INPUT_SERVICES"
    USE_EXPLICIT_ORDER=false
fi

IFS=':-' read -r -a PORT_ARRAY <<< "$INPUT_PORTS"
FIRST_PORT="${PORT_ARRAY[0]}"

IFS=':-' read -r -a CPU_ARRAY <<< "$INPUT_CPUS"
FIRST_CPU="${CPU_ARRAY[0]}"

IFS=':-' read -r -a MEM_ARRAY <<< "$INPUT_MEMS"
FIRST_MEM="${MEM_ARRAY[0]}"

INPUT_TIMEOUTS="${APP_STOP_TIMEOUT_SEC:-30}"
INPUT_TIMEOUTS="${INPUT_TIMEOUTS//[\"\' ]/}"
IFS=':-' read -r -a TIMEOUT_ARRAY <<< "$INPUT_TIMEOUTS"

FIRST_TIMEOUT="${TIMEOUT_ARRAY[0]:-30}"
FIRST_TIMEOUT="${FIRST_TIMEOUT//[^0-9]/}"
if [[ -z "$FIRST_TIMEOUT" ]]; then FIRST_TIMEOUT=30; fi

# Parse the credentials array (space separated)
IFS=' ' read -r -a CRED_ARRAY <<< "$APP_PULL_CREDS"

log_info "⏱️  Mapped Timeouts: ${TIMEOUT_ARRAY[*]}"

QUEUES_TO_CHECK="$MONITOR_QUEUES"
TARGET_DIR="${TARGET_DIR:-$(pwd)}"
QUADLET_DIR="$HOME/.config/containers/systemd"
COMPOSE_FILE="$TARGET_DIR/.docker-compose.${SERVICE_NAME}.${ENVIRONMENT_NAME}.yml"

mkdir -p "${TARGET_DIR}/logs" "${QUADLET_DIR}" || exit 1
DEPLOY_DATE=$(date +"%Y-%m-%d_%H-%M-%S")

get_unit_name() { echo "$1-$2"; }

EXISTING_MAX=$(ls "$QUADLET_DIR"/${SERVICE_NAME}-*.container 2>/dev/null | grep -oP "${SERVICE_NAME}-\K[0-9]+" | sort -n | tail -1)
EXISTING_MAX=${EXISTING_MAX:-0}
if [ "$EXISTING_MAX" -gt "$SCALE_ARG" ]; then LOOP_MAX="$EXISTING_MAX"; else LOOP_MAX="$SCALE_ARG"; fi
if [[ "$IS_SCALE_ACTION" == "true" ]]; then LOOP_START="$SCALE_ARG"; LOOP_END="$SCALE_ARG"; else LOOP_START=1; LOOP_END="$LOOP_MAX"; fi

# ==============================================================================
# PHASE 0.5: NON-BLOCKING SMART LOCKING (SKIP BUSY)
# ==============================================================================
ACTIVE_INSTANCES=()

for i in $(seq "$LOOP_START" "$LOOP_END"); do
    LOCK_FILE="${TARGET_DIR}/.${SERVICE_NAME}-${i}.deploy.lock"
    FD=$(( 200 + i ))

    eval "exec $FD>\"$LOCK_FILE\""

    if ! flock -n $FD; then
        log_info "⏭️  SKIPPED: Instance $i is currently BUSY with an active pipeline. Moving on..."
        eval "exec $FD>&-"
        continue
    fi

    log_info "🔒 Acquired deployment lock for Instance $i."
    ACTIVE_INSTANCES+=("$i")
done

if [[ ${#ACTIVE_INSTANCES[@]} -eq 0 ]]; then
    log_info "✅ All instances are actively being processed by background runs. Exiting cleanly."
    exit 0
fi

# ==============================================================================
# PHASE 1: QUADLET GENERATION & CACHE WARMUP
# ==============================================================================
log_info "⚙️  PHASE 1: Compiling Native Quadlets for $SERVICE_NAME..."
cd "$TARGET_DIR" || exit 1

if [[ ! -f "$COMPOSE_FILE" ]]; then log_info "❌ FATAL: Compose file not found: $COMPOSE_FILE"; exit 1; fi

sed -i 's/\r$//' "$COMPOSE_FILE"
sed -i 's/\xc2\xa0/ /g' "$COMPOSE_FILE"
rm -f "$QUADLET_DIR"/${SERVICE_NAME}-net.network

podlet compose "$COMPOSE_FILE" | awk '/^# / { filename=$2; next } /^---$/ { next } { if (filename) print > filename }' || exit 1

shopt -s nullglob
for file in *.container; do mv "$file" "${file}.base"; done

declare -a BASENAMES
if [[ "$USE_EXPLICIT_ORDER" == "true" ]]; then
    BASENAMES=("${EXPLICIT_SVC_ARRAY[@]}")
else
    RAW_NAMES=($(awk '/^services:/{f=1;next} f && /^ +[^ ]+:/{ if(!i) {match($0, /^ +/); i=RLENGTH} if(match($0, "^[ ]{"i"}[^ ]+:")) print $1 } f && /^[^ ]/ {f=0}' "$COMPOSE_FILE" | sed 's/://'))
    BASENAMES=()
    for name in "${RAW_NAMES[@]}"; do
        resolved_name="${name//[\"\'$'\r']/}"
        BASENAMES+=("$resolved_name")
    done
    SERVICE_NAME="${BASENAMES[0]}"
fi

if [[ -z "$WORKER_SVC" ]]; then
    for srv in "${BASENAMES[@]}"; do
        if [[ "$srv" =~ (horizon|worker|queue|cron) ]] && [[ ! "$srv" =~ (web|frontend|proxy|nginx|api) ]]; then
            WORKER_SVC="$srv"; break
        fi
    done
    WORKER_SVC="${WORKER_SVC:-$SERVICE_NAME}"
fi

if [[ "$IS_SCALE_ACTION" != "true" ]]; then
    for basen in "${BASENAMES[@]}"; do
        for existing_file in "$QUADLET_DIR"/${basen}-*.container; do
            [[ -e "$existing_file" ]] || continue
            ext_num=$(echo "$existing_file" | grep -oP "${basen}-\K[0-9]+")
            IS_LOCKED=false
            for active_i in "${ACTIVE_INSTANCES[@]}"; do
                if [[ "$active_i" == "$ext_num" ]]; then IS_LOCKED=true; break; fi
            done
            if [[ "$IS_LOCKED" == "false" ]]; then rm -f "$existing_file"; fi
        done
    done
fi

for i in "${ACTIVE_INSTANCES[@]}"; do
    ENV_FILE="${TARGET_DIR}/.env.${SERVICE_NAME}-${i}"
    echo -e "INSTANCE_ID=${i}\nSERVICE_NAME=${SERVICE_NAME}" > "$ENV_FILE"

    for srv_idx in "${!BASENAMES[@]}"; do
        if [[ "$srv_idx" == 0 ]]; then SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-$FIRST_PORT}"; else SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-0}"; fi
        SVC_APP_PORT=$(( SVC_BASE_PORT + PORT_OFFSET + (i - 1) ))
        SAFE_NAME=$(echo "${BASENAMES[$srv_idx]}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        if [[ "$srv_idx" == 0 ]]; then echo "APP_PORT=${SVC_APP_PORT}" >> "$ENV_FILE"; fi
        echo "${SAFE_NAME}_PORT=${SVC_APP_PORT}" >> "$ENV_FILE"
    done

    for srv_idx in "${!BASENAMES[@]}"; do
        BASENAME="${BASENAMES[$srv_idx]}"
        BASE_FILE="${BASENAME}.container.base"
        INSTANCE_UNIT_NAME=$(get_unit_name "$BASENAME" "$i")
        TEMPLATE_FILE="$QUADLET_DIR/${INSTANCE_UNIT_NAME}.container"
        SPECIFIC_ENV_FILE="${TARGET_DIR}/.env.${BASENAME}.${ENVIRONMENT_NAME}"

        if [[ "$srv_idx" == 0 ]]; then SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-$FIRST_PORT}"; else SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-0}"; fi
        SVC_APP_PORT=$(( SVC_BASE_PORT + PORT_OFFSET + (i - 1) ))

        SVC_CPU="${CPU_ARRAY[$srv_idx]:-$FIRST_CPU}"
        SVC_MEM="${MEM_ARRAY[$srv_idx]:-$FIRST_MEM}"
        SVC_TIMEOUT="${TIMEOUT_ARRAY[$srv_idx]:-$FIRST_TIMEOUT}"
        SVC_TIMEOUT="${SVC_TIMEOUT//[^0-9]/}"
        if [[ -z "$SVC_TIMEOUT" ]]; then SVC_TIMEOUT=30; fi

        cat <<EOF > "$TEMPLATE_FILE"
[Unit]
Description=Managed Native Instance - ${INSTANCE_UNIT_NAME}
After=${SERVICE_NAME}-net-network.service
Requires=${SERVICE_NAME}-net-network.service
StartLimitBurst=5
StartLimitIntervalSec=300
EOF

        sed -i '/^\[Unit\]/d;/^\[Service\]/d;/^Restart=/d;/^RestartSec=/d' "$BASE_FILE"
        if ! grep -q "\[Container\]" "$BASE_FILE"; then sed -i '1i [Container]' "$BASE_FILE"; fi
        cat "$BASE_FILE" >> "$TEMPLATE_FILE"

        for dep_name in "${BASENAMES[@]}"; do
             sed -i "s/\b${dep_name}\.service\b/${dep_name}-${i}.service/g" "$TEMPLATE_FILE"
             sed -i "s/\b${dep_name}\.container\b/${dep_name}-${i}.container/g" "$TEMPLATE_FILE"
        done

        sed -i '/^ContainerName=/d;/^EnvironmentFile=/d;/^Network=/d;/^DependsOn=/d;/^NetworkAlias=/d' "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a Network=${SERVICE_NAME}-net.network" "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a EnvironmentFile=${TARGET_DIR}/.env.${SERVICE_NAME}-${i}" "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a EnvironmentFile=${SPECIFIC_ENV_FILE}" "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a ContainerName=${INSTANCE_UNIT_NAME}" "$TEMPLATE_FILE"

        # THE FIX: Instruct Quadlet to never attempt a network pull, trusting our manual podman command.
        sed -i "/\[Container\]/a Pull=never" "$TEMPLATE_FILE"

        sed -i "/\[Container\]/a StopTimeout=${SVC_TIMEOUT}" "$TEMPLATE_FILE"

        # Map the specific UID/GID for this container (falls back to the first array item if missing)
        SVC_UID="${UID_ARRAY[$srv_idx]:-${UID_ARRAY[0]}}"
        SVC_GID="${GID_ARRAY[$srv_idx]:-${GID_ARRAY[0]}}"

        PODMAN_ARGS="--health-on-failure=kill"
        # Only apply userns remapping if values are set and not marked as 'none'
        if [[ -n "$SVC_UID" && -n "$SVC_GID" && "$SVC_UID" != "none" && "$SVC_GID" != "none" ]]; then
            PODMAN_ARGS="--userns=keep-id:uid=${SVC_UID},gid=${SVC_GID} $PODMAN_ARGS"
        fi
        sed -i "/\[Container\]/a PodmanArgs=$PODMAN_ARGS" "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a LogDriver=journald" "$TEMPLATE_FILE"
        sed -i "/\[Container\]/a LogOpt=tag=1a-{{.Name}}" "$TEMPLATE_FILE"

        if [[ "$SVC_BASE_PORT" -gt 0 ]]; then
            if grep -q "^PublishPort=" "$TEMPLATE_FILE"; then
                 INTERNAL_PORT=$(grep -oP '^PublishPort=\K(?:[0-9.]+:)?[0-9]+:([0-9]+)' "$TEMPLATE_FILE" | sed -E 's/.*:([0-9]+)$/\1/' | head -n 1)
                 sed -i '/^PublishPort=/d' "$TEMPLATE_FILE"
                 if [[ -n "$INTERNAL_PORT" ]]; then sed -i "/\[Container\]/a PublishPort=${SVC_APP_PORT}:$INTERNAL_PORT" "$TEMPLATE_FILE"; fi
            else
                 sed -i '/^PublishPort=/d' "$TEMPLATE_FILE"
            fi
        fi

        sed -i "s|Volume=\./|Volume=$TARGET_DIR/|g" "$TEMPLATE_FILE"


        # ==========================================
        # 🛠️ PER-INSTANCE NGINX CONFIG GENERATION
        # ==========================================
        if [[ "$BASENAME" == "*frontend" && -f "$TARGET_DIR/nginx.conf.template" ]]; then
            local INSTANCE_CONF="$TARGET_DIR/nginx-${i}.conf"

            # Define your port logic here. This grabs the mapped port of the main service (index 0).
            # If you are passing a new environment variable, you can use that instead.
            local TARGET_PORT=$(( ${PORT_ARRAY[0]:-$FIRST_PORT} + PORT_OFFSET + (i - 1) ))

            # Create a fresh copy for this specific instance
            cp "$TARGET_DIR/nginx.conf.template" "$INSTANCE_CONF"

            # Replace placeholders with real values for this loop iteration
            sed -i "s/{{INSTANCE_ID}}/$i/g" "$INSTANCE_CONF"
            sed -i "s/{{TARGET_PORT}}/$TARGET_PORT/g" "$INSTANCE_CONF"

            # Repoint the Quadlet Volume mount from the generic config to the instance-specific one
            sed -i "s|Volume=$TARGET_DIR/nginx.conf:|Volume=$INSTANCE_CONF:|g" "$TEMPLATE_FILE"

            log_info "  📝 Generated unique NGINX config for instance $i targeting port $TARGET_PORT"
        fi

        SAFE_NAME=$(echo "$BASENAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        VAR_CPU="${SAFE_NAME}_CPU"
        VAR_MEM="${SAFE_NAME}_MEM"

        cat <<EOF >> "$TEMPLATE_FILE"

[Service]
EnvironmentFile=-${SPECIFIC_ENV_FILE}
EnvironmentFile=-${TARGET_DIR}/.env.${SERVICE_NAME}-${i}
SyslogIdentifier=1a-%p
CPUQuota=${!VAR_CPU:-$SVC_CPU}
MemoryMax=${!VAR_MEM:-$SVC_MEM}
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target
EOF
    done
done

# FOREGROUND PRE-PULL: Warms up the cache using Native Creds (Replaces compose pull)
log_info "⬇️ Pre-fetching images with per-container credentials..."
for srv_idx in "${!BASENAMES[@]}"; do
    current_unit=$(get_unit_name "${BASENAMES[$srv_idx]}" "1")
    TARGET_IMAGE=$(grep -oP '^Image=\K.*' "$QUADLET_DIR/${current_unit}.container" | head -n 1 || true)
    SVC_CRED="${CRED_ARRAY[$srv_idx]:-${CRED_ARRAY[0]}}"

    if [[ -n "$TARGET_IMAGE" ]]; then
        if [[ -n "$SVC_CRED" && "$SVC_CRED" != "none" ]]; then
            podman pull --creds="$SVC_CRED" "$TARGET_IMAGE" || log_info "⚠️ Pre-pull failed."
        else
            podman pull "$TARGET_IMAGE" || log_info "⚠️ Pre-pull failed."
        fi
    fi
done

rm -f *.container.base
for net in *.network; do
    sed -i '/^---$/d' "$net"
    sed -i "/^\[Network\]/a NetworkName=${SERVICE_NAME}-net" "$net"
    mv "$net" "$QUADLET_DIR/${SERVICE_NAME}-net.network"
done
shopt -u nullglob

systemctl --user daemon-reload || exit 1

systemctl --user reset-failed "${SERVICE_NAME}-net-network.service" 2>/dev/null || true
if ! podman network exists "${SERVICE_NAME}-net"; then
    systemctl --user stop "${SERVICE_NAME}-net-network.service" 2>/dev/null || true
    systemctl --user start "${SERVICE_NAME}-net-network.service" || exit 1
else
    systemctl --user start "${SERVICE_NAME}-net-network.service" 2>/dev/null || true
fi

# ==============================================================================
# PHASE 2: THE RESTART LIFECYCLE FUNCTION
# ==============================================================================
restart_instance() {
    local i=$1
    local is_busy=$2
    local main_cont_name=$(get_unit_name "$SERVICE_NAME" "$i")
    local worker_cont=$(get_unit_name "$WORKER_SVC" "$i")

    local env_file="$TARGET_DIR/.env.${SERVICE_NAME}-${i}"
    local log_file="$TARGET_DIR/logs/redeploy_${main_cont_name}_${DEPLOY_DATE}.log"

    {
        log_info "--- Restart Lifecycle for Instance $i initiated ---"

        if [[ "$is_busy" == "true" && "$CHECK_QUEUES" == "true" ]]; then
            podman exec "$worker_cont" php artisan horizon:terminate 2>/dev/null
            local timeout=$FIRST_TIMEOUT
            local elapsed=0
            while true; do
                local current_reserved=$(podman exec "$worker_cont" php artisan queue:monitor "$QUEUES_TO_CHECK" --no-ansi 2>/dev/null | awk '/Reserved jobs/ {s += $NF} END {print s + 0}')
                if [[ "${current_reserved:-0}" -eq 0 ]]; then break; fi
                if [ "$elapsed" -ge "$timeout" ]; then break; fi
                sleep 5; elapsed=$((elapsed + 5))
            done
        fi

        echo -e "INSTANCE_ID=$i\nSERVICE_NAME=$SERVICE_NAME" > "$env_file"
        for srv_idx in "${!BASENAMES[@]}"; do
            if [[ "$srv_idx" == 0 ]]; then local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-$FIRST_PORT}"; else local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-0}"; fi
            local SVC_APP_PORT=$(( SVC_BASE_PORT + PORT_OFFSET + (i - 1) ))
            local SAFE_NAME=$(echo "${BASENAMES[$srv_idx]}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
            if [[ "$srv_idx" == 0 ]]; then echo "APP_PORT=${SVC_APP_PORT}" >> "$env_file"; fi
            echo "${SAFE_NAME}_PORT=${SVC_APP_PORT}" >> "$env_file"
        done
        systemctl --user daemon-reload

        log_info "🛑 Stopping services (Reverse Order)..."
        for (( srv_idx=${#BASENAMES[@]}-1; srv_idx>=0; srv_idx-- )); do
            local current_unit=$(get_unit_name "${BASENAMES[$srv_idx]}" "$i")
            if [[ "$srv_idx" == 0 ]]; then local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-$FIRST_PORT}"; else local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-0}"; fi
            local SVC_APP_PORT=$(( SVC_BASE_PORT + PORT_OFFSET + (i - 1) ))

            local SVC_TIMEOUT="${TIMEOUT_ARRAY[$srv_idx]:-$FIRST_TIMEOUT}"
            SVC_TIMEOUT="${SVC_TIMEOUT//[^0-9]/}"
            if [[ -z "$SVC_TIMEOUT" ]]; then SVC_TIMEOUT=30; fi

            local IS_PORT_HOLDER=false
            if grep -q "^PublishPort=" "$QUADLET_DIR/${current_unit}.container" 2>/dev/null; then IS_PORT_HOLDER=true; fi

            systemctl --user reset-failed "${current_unit}.service" 2>/dev/null || true

            log_info "⏳ Issuing stop command to $current_unit..."
            systemctl --user stop "${current_unit}.service" --no-block 2>/dev/null || true

            local stop_wait=0
            local max_stop_wait=$(( SVC_TIMEOUT + 15 ))

            while true; do
                local current_state=$(systemctl --user show -p ActiveState --value "${current_unit}.service" 2>/dev/null)
                if [[ "$current_state" == "inactive" || "$current_state" == "failed" || -z "$current_state" ]]; then
                    break
                fi

                sleep 2
                stop_wait=$((stop_wait + 2))
                if [ "$stop_wait" -ge "$max_stop_wait" ]; then
                    log_info "⚠️ $current_unit hung after ${max_stop_wait}s. Forcing KILL..."
                    systemctl --user kill -s SIGKILL "${current_unit}.service" 2>/dev/null || true
                    break
                fi
            done
            log_info "✅ $current_unit successfully stopped."

            if [[ "$SVC_BASE_PORT" -gt 0 && "$IS_PORT_HOLDER" == "true" ]]; then
                local wait_count=0
                while [ -n "$(ss -tlnH sport = :$SVC_APP_PORT)" ]; do
                    sleep 2
                    wait_count=$((wait_count + 1))
                    if [ "$wait_count" -ge 15 ]; then
                        log_info "❌ FATAL: Port $SVC_APP_PORT failed to release."
                        exit 1
                    fi
                done
            fi
        done

        # ⬇️ NATIVE JIT PULL: Authenticates using the specific credential array
        log_info "⬇️ JIT Native Image Pull: Fetching latest images using per-container credentials..."
        for srv_idx in "${!BASENAMES[@]}"; do
            local current_unit=$(get_unit_name "${BASENAMES[$srv_idx]}" "$i")
            local TARGET_IMAGE=$(grep -oP '^Image=\K.*' "$QUADLET_DIR/${current_unit}.container" | head -n 1)
            local SVC_CRED="${CRED_ARRAY[$srv_idx]:-${CRED_ARRAY[0]}}"

            if [[ -n "$TARGET_IMAGE" ]]; then
                if [[ -n "$SVC_CRED" && "$SVC_CRED" != "none" ]]; then
                    log_info "   📥 Pulling $TARGET_IMAGE (Auth: Custom Token)..."
                    podman pull --creds="$SVC_CRED" "$TARGET_IMAGE" || log_info "⚠️ Warning: Failed to pull $TARGET_IMAGE."
                else
                    log_info "   📥 Pulling $TARGET_IMAGE (Auth: System Default)..."
                    podman pull "$TARGET_IMAGE" || log_info "⚠️ Warning: Failed to pull $TARGET_IMAGE."
                fi
            fi
        done

        log_info "🚀 Starting services (Forward Order)..."
        for srv_idx in "${!BASENAMES[@]}"; do
            local current_unit=$(get_unit_name "${BASENAMES[$srv_idx]}" "$i")
            if [[ "$srv_idx" == 0 ]]; then local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-$FIRST_PORT}"; else local SVC_BASE_PORT="${PORT_ARRAY[$srv_idx]:-0}"; fi
            local SVC_APP_PORT=$(( SVC_BASE_PORT + PORT_OFFSET + (i - 1) ))

            local IS_PORT_HOLDER=false
            if grep -q "^PublishPort=" "$QUADLET_DIR/${current_unit}.container" 2>/dev/null; then IS_PORT_HOLDER=true; fi

            systemctl --user reset-failed "${current_unit}.service" 2>/dev/null || true

            if ! systemctl --user start "${current_unit}.service"; then
                log_info "❌ FATAL: Failed to start $current_unit. Aborting deployment."
                exit 1
            fi

            if [[ "$SVC_BASE_PORT" -gt 0 && "$IS_PORT_HOLDER" == "true" ]]; then
                log_info "⏳ Waiting for port $SVC_APP_PORT to bind..."
                local wait_count=0
                while [ -z "$(ss -tlnH sport = :$SVC_APP_PORT)" ]; do
                    sleep 2
                    wait_count=$((wait_count + 1))
                    if [ "$wait_count" -ge 30 ]; then
                        log_info "❌ FATAL: Port $SVC_APP_PORT failed to bind within 60 seconds."
                        exit 1
                    fi
                done
            fi
        done

        log_info "✅ Instance $i successfully restarted."
    } >> "$log_file" 2>&1
}

# ==============================================================================
# PHASE 3: EXECUTION LOOP (DYNAMIC INSTANCE SKIPPING)
# ==============================================================================
HAS_LONG_TIMEOUT=false
for srv_idx in "${!BASENAMES[@]}"; do
    t_val="${TIMEOUT_ARRAY[$srv_idx]:-$FIRST_TIMEOUT}"
    t_val="${t_val//[^0-9]/}"
    if [[ -n "$t_val" && "$t_val" -gt 60 ]]; then HAS_LONG_TIMEOUT=true; break; fi
done

execute_sequential_deployment() {
    for i in "${ACTIVE_INSTANCES[@]}"; do
        FD=$(( 200 + i ))

        local BUSY=false
        local WORKER_TARGET=$(get_unit_name "$WORKER_SVC" "$i")

        if [[ "$CHECK_QUEUES" == "true" ]]; then
            if podman exec "$WORKER_TARGET" test -f artisan 2>/dev/null; then
                local reserved_count=$(podman exec "$WORKER_TARGET" php artisan queue:monitor "$QUEUES_TO_CHECK" --no-ansi 2>/dev/null | awk '/Reserved jobs/ {s += $NF} END {print s + 0}')
                if [[ "${reserved_count:-0}" -gt 0 ]]; then BUSY=true; fi
            fi
        fi

        if [[ "$HAS_LONG_TIMEOUT" == "true" || "$BUSY" == "true" ]]; then
            log_info "🔄 Rolling Update: Instance $i requires a long wait/drain. Monitoring for 30s max..."

            (
                for other in "${ACTIVE_INSTANCES[@]}"; do
                    if [[ "$other" != "$i" ]]; then
                        eval "exec $(( 200 + other ))>&-" 2>/dev/null
                    fi
                done

                if ! restart_instance "$i" "$BUSY"; then
                    log_info "❌ FATAL: Instance $i deployment failed."
                fi

                eval "exec $FD>&-"
                log_info "🔓 Instance $i unlocked and ready."
            ) &
            local INST_PID=$!

            eval "exec $FD>&-"

            local wait_time=0
            while kill -0 $INST_PID 2>/dev/null; do
                sleep 2
                wait_time=$((wait_time + 2))
                if [[ "$wait_time" -ge 30 ]]; then
                    log_info "⚠️ Instance $i exceeded 30s. Leaving it to finish in background. Advancing to next instance..."
                    break
                fi
            done
        else
            log_info "🔄 Rolling Update: Initiating Instance $i in FOREGROUND (Fast Path)..."
            if ! restart_instance "$i" "$BUSY"; then
                log_info "❌ FATAL: Instance $i deployment failed."
                exit 1
            fi
            eval "exec $FD>&-"
            log_info "🔓 Instance $i unlocked and ready."
        fi
    done
    log_info "🎉 Sequential Rolling Deployment Loop Finished."
}

if [[ "$HAS_LONG_TIMEOUT" == "true" || "$CHECK_QUEUES" == "true" ]]; then
    log_info "⚠️ Detaching Pipeline to BACKGROUND. CI runner will exit..."
    execute_sequential_deployment </dev/null >/dev/null 2>&1 &
    disown
else
    log_info "ℹ️ Running Pipeline in FOREGROUND..."
    execute_sequential_deployment
fi

exit 0
