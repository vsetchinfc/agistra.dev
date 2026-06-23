#!/usr/bin/env bash
# memory-check.sh — Stop hook for Claude Code.
# Called automatically after every agent session.
#
# Delegates the platform-neutral check to memory-check-core.sh, then
# applies the Claude Code Stop-hook contract: stderr text + exit 2 feeds
# a reminder back into the model before it closes; exit 0 on clean.

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

status=$("$script_dir/memory-check-core.sh")

if [ "$status" != "dirty" ]; then
  exit 0
fi

echo "" >&2
echo "⚠️  Memory check: files were changed this session but memory/ was not updated." >&2
echo "   Before closing, update the HOT section in memory/<agent>.md with any" >&2
echo "   decisions, corrections, or new context from this session." >&2
echo "   (WAL protocol — write first, respond second.)" >&2
echo "" >&2
exit 2
