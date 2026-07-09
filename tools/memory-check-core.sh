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

# Resolve to the hub root before any check, regardless of the session shell's
# cwd. A session that has cd'd into a foreign repo (e.g. another project
# working dir) must not have its dirty/no-memory state misreported as the
# hub's.
#
#   1. CLAUDE_PROJECT_DIR, when set (Claude Code always sets it) — trust it.
#   2. Otherwise fall back to this script's own repo root, discovered via
#      `git rev-parse --show-toplevel` from the script's directory. This
#      keeps the fallback adapter-agnostic (Copilot/Codex/Cursor have no
#      CLAUDE_PROJECT_DIR) with no hard Claude dependency in the core.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  hub_root="$CLAUDE_PROJECT_DIR"
else
  hub_root="$(cd "$script_dir" && git rev-parse --show-toplevel 2>/dev/null || true)"
  hub_root="${hub_root:-$script_dir}"
fi

cd "$hub_root" 2>/dev/null || true

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
