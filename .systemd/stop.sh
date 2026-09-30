#!/bin/bash

# ==============================================================================
# 🛑 UNIVERSAL SERVICE STOPPER (Discrete Quadlet Edition)
# ==============================================================================

# --- PARAMETER HANDLING ---
# Accepts multiple services: bash stop.sh webapp api su-cron
SERVICES_TO_STOP=("$@")

QUADLET_DIR="$HOME/.config/containers/systemd"

echo "------------------------------------------------------"
echo ">>> 🛑 PHASE: STOP requested instances"
echo "------------------------------------------------------"

if [ ${#SERVICES_TO_STOP[@]} -eq 0 ]; then
    echo "❌ ERROR: No service names provided. Usage: bash stop.sh service1 service2 ..."
    exit 1
fi

for APP in "${SERVICES_TO_STOP[@]}"; do
    echo "🔍 Searching for instances belonging to: $APP"

    # Track if we found anything for this app
    FOUND=false

    # Look for any discrete .container files strictly matching the app prefix
    # Using ${APP}-* prevents 'api' from accidentally matching 'api-gateway'
    shopt -s nullglob
    for file in "$QUADLET_DIR"/${APP}-*.container; do
        [ -e "$file" ] || continue
        FOUND=true

        BASE_NAME="$(basename "$file" .container)"
        echo "   🛑 Stopping instance: ${BASE_NAME}.service"

        # Stop the service natively
        # (This automatically triggers the graceful Horizon ExecStop we defined in deploy.sh!)
        systemctl --user stop "${BASE_NAME}.service" 2>/dev/null || true
    done
    shopt -u nullglob

    if [[ "$FOUND" == "false" ]]; then
        echo "   ℹ️  No running instances found for '$APP'."
    else
        # Stop the dedicated network service for this app
        echo "   🌐 Stopping network: ${APP}-net-network.service"
        systemctl --user stop "${APP}-net-network.service" 2>/dev/null || true
    fi
done

# --- REFRESH ---
echo ">>> ♻️  Refreshing Systemd status..."
systemctl --user daemon-reload
systemctl --user reset-failed

echo "------------------------------------------------------"
echo "✅ Stop sequence complete."

# Build a strict regex pattern to filter podman ps output for the requested services
# e.g., ^(webapp-|api-|su-cron-)
PODMAN_FILTER="^($(printf "%s-|" "${SERVICES_TO_STOP[@]}" | sed 's/|$//'))"

echo "📦 Remaining active containers for requested services (Should be empty):"
podman ps --format "table {{.Names}}\t{{.Status}}" | awk "NR==1 || /$PODMAN_FILTER/"
