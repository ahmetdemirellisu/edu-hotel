#!/bin/bash

# ==============================================================================
# 🗑️ DEPLOYMENT GARBAGE COLLECTOR (Action-Only Pipeline Edition)
# ==============================================================================

set -o pipefail

show_help() {
    echo "=========================================================================="
    echo " 🗑️ MULTI-STAGE GARBAGE COLLECTOR"
    echo "=========================================================================="
    echo "Usage: Provide a space-separated list of your stage SERVICES variables."
    echo "  export AUTHORIZED_PROJECTS='projA:ui projB projC:db:cache'"
    echo "  bash clean.sh"
    exit 1
}

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] 🧹 [GC]: $1"; }

AUTHORIZED_PROJECTS="${AUTHORIZED_PROJECTS:-$1}"
TARGET_DIR="${TARGET_DIR:-$(pwd)}"
BASE_DIR="${BASE_DIR:-$(dirname "$TARGET_DIR")}"
QUADLET_DIR="$HOME/.config/containers/systemd"

if [[ -z "$AUTHORIZED_PROJECTS" ]]; then show_help; fi

# ==============================================================================
# PHASE 1: BUILD WHITELIST
# ==============================================================================
declare -a REGEX_PARTS

for PROJ_DEF in $AUTHORIZED_PROJECTS; do
    IFS=':' read -r -a BASENAMES <<< "$PROJ_DEF"
    MAIN_SVC="${BASENAMES[0]}"

    REGEX_PARTS+=("^${MAIN_SVC}-net")
    REGEX_PARTS+=("^\.env\.${MAIN_SVC}-[0-9]+")
    REGEX_PARTS+=("^\.env\.${MAIN_SVC}\.")

    for svc in "${BASENAMES[@]}"; do
        REGEX_PARTS+=("^${svc}-[0-9]+")
    done
done

KEEP_PATTERN=$(IFS='|'; echo "${REGEX_PARTS[*]}")

log_info "Active Whitelist Pattern: ($KEEP_PATTERN)"
echo "------------------------------------------------------"

# ==============================================================================
# PHASE 2: HUNT ORPHANED QUADLETS & NETWORKS
# ==============================================================================
shopt -s nullglob
for file in "$QUADLET_DIR"/*.{container,network}; do
    filename=$(basename "$file")

    if echo "$filename" | grep -Ei -q "($KEEP_PATTERN)"; then continue; fi

    if echo "$filename" | grep -Eq -- "-([0-9]+)\.container$|-net\.network$"; then
        BASE_NAME="${filename%.*}"

        log_info "🛑 STOPPED SERVICE: ${BASE_NAME}.service"
        systemctl --user stop "${BASE_NAME}.service" 2>/dev/null || true

        log_info "🗑️  PRUNED QUADLET: $filename"
        rm -f "$file"
    fi
done
shopt -u nullglob

# ==============================================================================
# PHASE 3: HUNT ORPHANED ENVIRONMENT FILES
# ==============================================================================
shopt -s nullglob
for env_file in "$BASE_DIR"/*/.env.*; do
    filename=$(basename "$env_file")

    if echo "$filename" | grep -Ei -q "($KEEP_PATTERN)"; then continue; fi

    if echo "$filename" | grep -Eq "^\.env\..*-[0-9]+$"; then
         log_info "📝 PRUNED ENV FILE: $env_file"
         rm -f "$env_file"
    fi
done
shopt -u nullglob

# ==============================================================================
# PHASE 4: SYSTEMD & CONTAINER REAPER
# ==============================================================================
systemctl --user daemon-reload
systemctl --user reset-failed

ALL_CONTAINERS=$(podman ps -a --format "{{.Names}}")

#if [[ -n "$ALL_CONTAINERS" ]]; then
#    for container in $ALL_CONTAINERS; do
#        if echo "$container" | grep -Ei -q "($KEEP_PATTERN)"; then continue; fi
#
#        if echo "$container" | grep -Eq -- "-[0-9]+$"; then
#            log_info "💀 PRUNED CONTAINER: $container"
#            podman rm -f "$container" 2>/dev/null || true
#        fi
#    done
#fi

# ==============================================================================
# PHASE 5: NETWORK REAPER (Whitelist Aware)
# ==============================================================================
ALL_NETWORKS=$(podman network ls --format "{{.Name}}")

if [[ -n "$ALL_NETWORKS" ]]; then
    for net in $ALL_NETWORKS; do
        # Ignore the default podman network
        if [[ "$net" == "podman" ]]; then continue; fi

        # If it matches the authorized project whitelist, LEAVE IT ALONE
        if echo "$net" | grep -Ei -q "($KEEP_PATTERN)"; then continue; fi

        # If it wasn't whitelisted, but it looks like a deploy.sh network (-net)
        if echo "$net" | grep -Eq -- "-net$"; then
            log_info "🌐 PRUNED ROGUE NETWORK: $net"
            podman network rm -f "$net" 2>/dev/null || true
        fi
    done
fi

echo "------------------------------------------------------"
log_info "✅ Garbage Collection Complete. Runner is sanitized."
