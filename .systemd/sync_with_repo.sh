#!/bin/bash
set -e

# 1. Define Paths
SRC_DIR="${CI_PROJECT_DIR}"
DEST_DIR="/home/$USER/data_volume/data/html"
MANIFEST_FILE="$DEST_DIR/.rsync_manifest"

echo "-> Starting state-aware sync..."
mkdir -p "$DEST_DIR"

# 2. Get the list of ignored files to exclude
EXCLUDE_FILE=$(mktemp)
cd "$SRC_DIR"
cat .gitignore >> "$EXCLUDE_FILE"
echo ".git/\n.editorconfig\n.gitattributes\n.gitignore\n.gitlab-ci.yml\n.systemd" >> "$EXCLUDE_FILE"

# 3. Determine exactly what files currently exist in the source (respecting ignores)
# We do a dry-run against an empty directory to get an exact list of source files.
EMPTY_DIR=$(mktemp -d)
CURRENT_SRC_FILES=$(mktemp)
# 1. This block runs, completely silenced, and the script WAITS here
(
    rsync -an --out-format="%n" --exclude-from="$EXCLUDE_FILE" "./" "$EMPTY_DIR/" | grep -v '/$' > "$CURRENT_SRC_FILES"
) 2>/dev/null
rm -rf "$EMPTY_DIR"

# 4. Handle Deletions (If a previous manifest exists)
if [ -s "$MANIFEST_FILE" ]; then
    echo "-> Checking for files deleted from the CI source..."

    # Sort both files so 'comm' can compare them properly
    sort -o "$MANIFEST_FILE" "$MANIFEST_FILE"
    sort -o "$CURRENT_SRC_FILES" "$CURRENT_SRC_FILES"

    # Find files that are in the OLD manifest but NOT in the CURRENT source
    DELETED_FILES=$(comm -23 "$MANIFEST_FILE" "$CURRENT_SRC_FILES")

    if [ -n "$DELETED_FILES" ]; then
        echo "$DELETED_FILES" | while read -r file; do
            if [ -n "$file" ] && [ -f "$DEST_DIR/$file" ]; then
                echo "   Removing deleted source file from destination: $file"
                rm "$DEST_DIR/$file"
                # Clean up parent folders if they are now empty
                dirname "$DEST_DIR/$file" | xargs rmdir -p --ignore-fail-on-non-empty 2>/dev/null || true
            fi
        done
    fi
fi

# 5. Run the actual Rsync WITHOUT the global --delete flag
# This copies updates over, but leaves untracked destination files safe
echo "-> Syncing new and modified files..."

(
rsync -av --exclude-from="$EXCLUDE_FILE" "./" "$DEST_DIR/"
) 2>/dev/null

# 6. Save the current source state as the manifest for the next run
cp "$CURRENT_SRC_FILES" "$MANIFEST_FILE"

# Clean up temporary files
rm "$EXCLUDE_FILE" "$CURRENT_SRC_FILES"

echo "-> Sync completed successfully!"
