#!/bin/bash

# ==============================================================================
# 📈 DYNAMIC SCALE MANAGER (v8.8)
# Race-Condition Fix | Async Lock Polling | deploy.sh v1.24.x Compatible
# ==============================================================================

set -o pipefail

TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUADLET_DIR="$HOME/.config/containers/systemd"
DEPLOY_EXE="$TARGET_DIR/deploy.sh"

log_scale() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] 📈 [SCALE]: $1"; }

if [ ! -f "$DEPLOY_EXE" ]; then log_scale "❌ ERROR: deploy.sh not found."; exit 1; fi

INPUT_SERVICES="${SERVICES:-$1}"
TARGET_SCALE="${TARGET_SCALE:-$2}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-development}"
PORT_OFFSET="${APP_OFFSET:-0}"

export APP_PULL_CREDS="${APP_PULL_CREDS:-}"
export CHECK_QUEUES="${CHECK_QUEUES:-false}"
export MONITOR_QUEUES="${MONITOR_QUEUES:-redis:default,redis:ldap}"

if [[ -z "$INPUT_SERVICES" || -z "$TARGET_SCALE" ]]; then
    log_scale "Usage: export SERVICES='app:ui' && export TARGET_SCALE=5 && bash scale.sh"
    exit 1
fi

if [[ "$INPUT_SERVICES" == *":"* ]]; then
    IFS=':' read -r -a BASENAMES <<< "$INPUT_SERVICES"
    SERVICE_NAME="${BASENAMES[0]}"
else
    SERVICE_NAME="$INPUT_SERVICES"; BASENAMES=("$SERVICE_NAME")
fi

# --- 🔍 1. DETECT CURRENT STATE ---
log_scale "Scanning current fleet for $SERVICE_NAME..."

EXISTING_IDS=()
shopt -s nullglob
for file in "$QUADLET_DIR"/${SERVICE_NAME}-*.container; do
    id=$(basename "$file" | sed -E "s/^${SERVICE_NAME}-([0-9]+)\.container$/\1/")
    if [[ "$id" =~ ^[0-9]+$ ]]; then
        EXISTING_IDS+=("$id")
    fi
done
shopt -u nullglob

CURRENT_COUNT=${#EXISTING_IDS[@]}

if [ "$CURRENT_COUNT" -gt 0 ]; then
    IFS=$'\n' SORTED_IDS=($(sort -n <<<"${EXISTING_IDS[*]}")); unset IFS
    EXISTING_IDS=("${SORTED_IDS[@]}")
    LAST_ID=${EXISTING_IDS[-1]}
else
    LAST_ID=0
fi

if [ "$LAST_ID" -eq 0 ]; then
    log_scale "❌ No existing instances found in $QUADLET_DIR. Run deploy.sh first."
    exit 1
fi

# --- ⚙️ 2. CLONE CONFIGURATION ---
log_scale "Cloning config from Instance $LAST_ID..."
declare -a NEXT_PORTS_ARRAY; declare -a CPUS_ARRAY; declare -a MEMS_ARRAY; declare -a TIMEOUTS_ARRAY

for svc in "${BASENAMES[@]}"; do
    LAST_FILE="$QUADLET_DIR/${svc}-${LAST_ID}.container"
    if [ ! -f "$LAST_FILE" ]; then
        NEXT_PORTS_ARRAY+=(0); CPUS_ARRAY+=("100%"); MEMS_ARRAY+=("512M"); TIMEOUTS_ARRAY+=("30")
        continue
    fi

    LAST_PORT=$(awk -F'[:=]' '/^PublishPort=/{if (NF==3) print $2; else if (NF==4) print $3}' "$LAST_FILE" | head -n 1)
    if [[ -n "$LAST_PORT" ]]; then NEXT_PORTS_ARRAY+=($((LAST_PORT + 1))); else NEXT_PORTS_ARRAY+=(0); fi

    C_VAL=$(grep -oP '^CPUQuota=\K.*' "$LAST_FILE" | head -n 1)
    CPUS_ARRAY+=("${C_VAL:-100%}")

    M_VAL=$(grep -oP '^MemoryMax=\K.*' "$LAST_FILE" | head -n 1)
    MEMS_ARRAY+=("${M_VAL:-512M}")

    T_VAL=$(grep -oP '^StopTimeout=\K.*' "$LAST_FILE" | head -n 1)
    TIMEOUTS_ARRAY+=("${T_VAL:-30}")
done

APP_UID=$(grep -oP 'uid=\K[0-9]+' "$QUADLET_DIR/${SERVICE_NAME}-${LAST_ID}.container" | head -n 1)
APP_GID=$(grep -oP 'gid=\K[0-9]+' "$QUADLET_DIR/${SERVICE_NAME}-${LAST_ID}.container" | head -n 1)

find_free_port() {
    local port=$1
    while ss -tuln | grep -q ":$port "; do port=$((port + 1)); done
    echo "$port"
}

# --- 🚀 3. SCALE UP LOGIC ---
if [ "$TARGET_SCALE" -gt "$CURRENT_COUNT" ]; then
    NUM_TO_ADD=$((TARGET_SCALE - CURRENT_COUNT))
    log_scale "Scaling UP by $NUM_TO_ADD instances..."

    for (( i=1; i<=NUM_TO_ADD; i++ )); do
        NEW_ID=$((LAST_ID + i))
        NEW_PORTS_STR=""

        for p_idx in "${!NEXT_PORTS_ARRAY[@]}"; do
            val="${NEXT_PORTS_ARRAY[$p_idx]}"
            if [[ "$val" -gt 0 ]]; then
                free_p=$(find_free_port "$val")
                NEXT_PORTS_ARRAY[$p_idx]=$((free_p + 1))
                BASE_TO_PASS=$(( free_p - (NEW_ID - 1) - PORT_OFFSET ))
                NEW_PORTS_STR="${NEW_PORTS_STR}${BASE_TO_PASS}:"
            else
                NEW_PORTS_STR="${NEW_PORTS_STR}0:"
            fi
        done
        NEW_PORTS_STR="${NEW_PORTS_STR%:}"

        log_scale "Deploying NEW Instance $NEW_ID (Calculated Base Ports: [$NEW_PORTS_STR])"

        export IS_SCALE_ACTION="true"
        export APP_SCALE="$NEW_ID"
        export SERVICES="$INPUT_SERVICES"
        export APP_PORTS="$NEW_PORTS_STR"
        export ENVIRONMENT_NAME="$ENVIRONMENT_NAME"
        export APP_CPUS=$(IFS=':'; echo "${CPUS_ARRAY[*]}")
        export APP_MEMS=$(IFS=':'; echo "${MEMS_ARRAY[*]}")
        export APP_STOP_TIMEOUT_SEC=$(IFS=':'; echo "${TIMEOUTS_ARRAY[*]}")
        export APP_UID="${APP_UID}"
        export APP_GID="${APP_GID}"

        bash "$DEPLOY_EXE" || { log_scale "❌ Deployment failed for Instance $NEW_ID."; exit 1; }

        # ⬇️ THE FIX: Smart Lock Monitor
        # Prevents the loop from firing the next deployment until deploy.sh is completely finished in the background
        LOCK_FILE="${TARGET_DIR}/.${SERVICE_NAME}-${NEW_ID}.deploy.lock"
        if fuser "$LOCK_FILE" >/dev/null 2>&1; then
            log_scale "⏳ Waiting for Instance $NEW_ID background deployment to finalize..."
            while ! flock -n 99 99<"$LOCK_FILE"; do
                sleep 2
            done 2>/dev/null
            exec 99>&- 2>/dev/null
            log_scale "✅ Instance $NEW_ID successfully deployed."
        fi

    done

# --- 🛑 4. SCALE DOWN LOGIC ---
elif [ "$TARGET_SCALE" -lt "$CURRENT_COUNT" ]; then
    NUM_TO_REMOVE=$((CURRENT_COUNT - TARGET_SCALE))
    log_scale "Scaling DOWN by $NUM_TO_REMOVE instances..."

    HAS_LONG_TIMEOUT=false
    for t in "${TIMEOUTS_ARRAY[@]}"; do
        if [[ "${t//[^0-9]/}" -gt 60 ]]; then HAS_LONG_TIMEOUT=true; break; fi
    done

    execute_scale_down() {
        REVERSE_IDS=($(printf '%s\n' "${EXISTING_IDS[@]}" | sort -nr))
        REMOVED_COUNT=0

        for ID in "${REVERSE_IDS[@]}"; do
            if [ "$REMOVED_COUNT" -ge "$NUM_TO_REMOVE" ]; then
                break
            fi

            LOCK_FILE="${TARGET_DIR}/.${SERVICE_NAME}-${ID}.deploy.lock"
            FD=$(( 200 + ID ))
            eval "exec $FD>\"$LOCK_FILE\""

            if ! flock -n $FD; then
                log_scale "⚠️ Instance $ID is locked by an active deployment. Skipping..."
                eval "exec $FD>&-"
                continue
            fi

            log_scale "🔒 Acquired lock for Instance $ID. Proceeding with teardown..."

            (
                for (( srv_idx=${#BASENAMES[@]}-1; srv_idx>=0; srv_idx-- )); do
                    UNIT="${BASENAMES[$srv_idx]}-${ID}"
                    SVC_TIMEOUT="${TIMEOUTS_ARRAY[$srv_idx]:-30}"
                    SVC_TIMEOUT="${SVC_TIMEOUT//[^0-9]/}"

                    log_scale "⏳ Issuing stop command to $UNIT..."
                    systemctl --user stop "${UNIT}.service" --no-block 2>/dev/null || true

                    local stop_wait=0
                    local max_stop_wait=$(( SVC_TIMEOUT + 15 ))

                    while true; do
                        local current_state=$(systemctl --user show -p ActiveState --value "${UNIT}.service" 2>/dev/null)
                        if [[ "$current_state" == "inactive" || "$current_state" == "failed" || -z "$current_state" ]]; then
                            break
                        fi
                        sleep 2
                        stop_wait=$((stop_wait + 2))
                        if [ "$stop_wait" -ge "$max_stop_wait" ]; then
                            log_scale "⚠️ $UNIT hung. Forcing KILL..."
                            systemctl --user kill -s SIGKILL "${UNIT}.service" 2>/dev/null || true
                            break
                        fi
                    done
                    log_scale "✅ $UNIT stopped."

                    rm -f "$QUADLET_DIR/${UNIT}.container"
                    podman rm -f "$UNIT" 2>/dev/null || true
                done

                rm -f "$TARGET_DIR"/.env.${SERVICE_NAME}-${ID}
                rm -f "$TARGET_DIR"/nginx-${ID}.conf

                systemctl --user daemon-reload
                eval "exec $FD>&-"
                rm -f "$LOCK_FILE"
                log_scale "🗑️ Instance $ID completely removed."
            ) &
            local TEARDOWN_PID=$!

            eval "exec $FD>&-"

            local wait_time=0
            while kill -0 $TEARDOWN_PID 2>/dev/null; do
                sleep 2
                wait_time=$((wait_time + 2))
                if [[ "$wait_time" -ge 30 ]]; then
                    log_scale "⚠️ Instance $ID teardown exceeded 30s. Leaving to finish in background..."
                    break
                fi
            done

            REMOVED_COUNT=$((REMOVED_COUNT + 1))
        done

        if [ "$REMOVED_COUNT" -lt "$NUM_TO_REMOVE" ]; then
            log_scale "⚠️ WARNING: Target scale not reached. Only removed $REMOVED_COUNT/$NUM_TO_REMOVE instances because others were locked."
        else
            log_scale "✅ Scale down sequence successfully executed."
        fi
    }

    if [[ "$HAS_LONG_TIMEOUT" == "true" ]]; then
        log_scale "⚠️ Long timeouts detected. Detaching Teardown to BACKGROUND. CI runner will exit..."
        execute_scale_down </dev/null >/dev/null 2>&1 &
        disown
    else
        execute_scale_down
    fi

else
    log_scale "Already at target scale ($CURRENT_COUNT)."
fi

log_scale "Operation complete."
exit 0
