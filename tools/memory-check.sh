#!/bin/bash
# Memory discipline check — invoked by stop hooks after each agent session.
# Reminds the agent to update HOT memory if real work was done but memory was not written.
#
# Exit codes:
#   0 = no action needed (memory updated, or nothing significant changed)
#   2 = feed reminder back to the agent (work done, memory not updated)

MEMORY_DIR="${MEMORY_DIR:-memory}"

# Check if memory files were updated this session (unstaged or staged, excluding archives)
MEMORY_CHANGED=$(git diff --name-only HEAD -- "${MEMORY_DIR}/" 2>/dev/null | grep -v "/archive/")
MEMORY_STAGED=$(git diff --cached --name-only -- "${MEMORY_DIR}/" 2>/dev/null | grep -v "/archive/")

if [ -n "$MEMORY_CHANGED" ] || [ -n "$MEMORY_STAGED" ]; then
  # Memory was written this session — nothing to do
  exit 0
fi

# Check if any other work was done (proxy for a substantial session)
ANY_CHANGED=$(git diff --name-only HEAD -- 2>/dev/null)
ANY_STAGED=$(git diff --cached --name-only -- 2>/dev/null)

if [ -z "$ANY_CHANGED" ] && [ -z "$ANY_STAGED" ]; then
  # Nothing changed at all — likely a read-only or lookup session
  exit 0
fi

# Real work happened but memory was not updated
echo "Memory files unchanged this session. If decisions, corrections, or new context were established, update HOT in memory/<agent>.md before closing."
exit 2
