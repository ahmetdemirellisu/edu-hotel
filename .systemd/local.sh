#!/bin/bash

# 1. Capture arguments
SERVICES=("$@")

# 2. Hard-set PROFILE_FILE to be safe
# If $HOME is empty for some reason, default to the current user's home
MY_HOME=${HOME:-/home/$(whoami)}
PROFILE_FILE="$MY_HOME/.bash_profile"

if [ ${#SERVICES[@]} -eq 0 ]; then
  echo "❌ Error: No services were passed to the script."
  exit 1
fi

echo ">>> Updating $PROFILE_FILE with service variables..."
touch "$PROFILE_FILE"

for i in "${!SERVICES[@]}"; do
  NUM=$((i + 1))
  VAR_NAME="SERVICE${NUM}"
  VAR_VALUE="${SERVICES[$i]}"

  # Guard: If VAR_VALUE is empty, skip it
  if [ -z "$VAR_VALUE" ]; then
    echo "⚠️ Warning: Argument $NUM is empty, skipping..."
    continue
  fi

  echo "Setting $VAR_NAME=\"$VAR_VALUE\""

  if grep -q "^export $VAR_NAME=" "$PROFILE_FILE"; then
    sed -i "s|^export $VAR_NAME=.*|export $VAR_NAME=\"$VAR_VALUE\"|" "$PROFILE_FILE"
  else
    echo "export $VAR_NAME=\"$VAR_VALUE\"" >> "$PROFILE_FILE"
  fi
done

echo "✅ Export complete."