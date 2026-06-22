#!/usr/bin/env bash
# memory-check-core.sh — platform-neutral WAL memory-check logic.
#
# Checks whether files were changed this session (git status --porcelain)
# without a corresponding update to memory/*.md (git status, falling back
# to filesystem mtime within the last 240 minutes since memory/ may be
# gitignored in some hubs).
#
# Contract (consumed by platform adapters — no platform-specific formatting here):
#   stdout: "clean" or "dirty"
#   exit code: always 0 (the core never fails the calling shell; adapters
#              decide how to surface "dirty" to their platform)
#
# Adapters source the shared reminder text from memory-check-message.txt
# (same directory as this script) rather than duplicating the message.

set -euo pipefail

# Nothing to check if this isn't a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "clean"
  exit 0
fi

# Collect tracked changes relative to HEAD
status=$(git status --porcelain 2>/dev/null || true)

if [ -z "$status" ]; then
  # No changes — nothing to remember
  echo "clean"
  exit 0
fi

# memory/ may be excluded from git tracking — check filesystem mtime instead.
# Any memory/*.md modified in the last 4 hours counts as updated this session.
if find memory/ -maxdepth 1 -name "*.md" -mmin -240 2>/dev/null | grep -q .; then
  echo "clean"
  exit 0
fi

# Work happened but memory was not updated
echo "dirty"
exit 0
