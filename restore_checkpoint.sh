#!/usr/bin/env bash
set -e

echo "=============================================="
echo " [RESTORE] Restoring codebase to checkpoint..."
echo "=============================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKPOINT_DIR="$SCRIPT_DIR/.restore_checkpoint"

if [ ! -d "$CHECKPOINT_DIR" ]; then
  echo "Error: Checkpoint directory '$CHECKPOINT_DIR' not found!"
  exit 1
fi

# Copy all directories and files back to working directory
cp -rf "$CHECKPOINT_DIR/src" "$SCRIPT_DIR/"
cp -rf "$CHECKPOINT_DIR/server" "$SCRIPT_DIR/"
cp -rf "$CHECKPOINT_DIR/services" "$SCRIPT_DIR/"
cp -rf "$CHECKPOINT_DIR/functions" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/server.ts" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/worker.ts" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/index.html" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/vite.config.ts" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/package.json" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/tsconfig.json" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/wrangler.jsonc" "$SCRIPT_DIR/"
cp -f "$CHECKPOINT_DIR/metadata.json" "$SCRIPT_DIR/"

echo " [RESTORE] Completed! All files have been restored to the stable snapshot."
echo "=============================================="
