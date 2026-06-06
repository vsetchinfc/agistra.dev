#!/usr/bin/env bash
# memory-check.sh — Stop hook for Claude Code.
# Called automatically after every agent session.
#
# If git diff shows files were changed but no memory/ files were touched,
# exit 2 so Claude Code feeds a reminder back to the agent before closing.

set -euo pipefail

# Nothing to check if this isn't a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# Collect tracked changes relative to HEAD
status=$(git status --porcelain 2>/dev/null || true)

if [ -z "$status" ]; then
  # No changes — nothing to remember
  exit 0
fi

# memory/ may be excluded from git tracking — check filesystem mtime instead.
# Any memory/*.md modified in the last 4 hours counts as updated this session.
if find memory/ -maxdepth 1 -name "*.md" -mmin -240 2>/dev/null | grep -q .; then
  exit 0
fi

# Work happened but memory was not updated — remind the agent
echo "" >&2
echo "⚠️  Memory check: files were changed this session but memory/ was not updated." >&2
echo "   Before closing, update the HOT section in memory/<agent>.md with any" >&2
echo "   decisions, corrections, or new context from this session." >&2
echo "   (WAL protocol — write first, respond second.)" >&2
echo "" >&2
exit 2
