# Telegram setup (deprecated for group relay)

> **Superseded by [relay-setup.md](./relay-setup.md)** (ADR-004). Production group relay uses the hub relay daemon + `mcpServers.relay`, not the Claude official Telegram plugin.

This file is kept for reference and troubleshooting legacy setups.

---

## What changed

| Old (task_17) | New (task_29–35) |
| ------------- | ---------------- |
| `mcpServers.telegram` + bun plugin | `mcpServers.relay` → local daemon |
| Direct MCP Telegram I/O | Daemon poll/send + Router `relay_*` tools |
| `wireTelegramMcp` in setup | `wireRelayMcp` in setup |

---

## Legacy plugin path (DM testing only)

If you still use the official plugin for direct-message experiments:

1. Install bun — [bun.sh](https://bun.sh)
2. Plugin path: `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/telegram`
3. Calling `wireTelegramMcp` emits a deprecation warning; setup uses `wireRelayMcp` instead.

For group relay, follow **[relay-setup.md](./relay-setup.md)**.

---

## Troubleshooting (legacy)

| Symptom | Fix |
| ------- | --- |
| `mcp__telegram__*` tools not appearing | Confirm bun + plugin path; restart Claude Code |
| Bot not responding in **group** | Use relay daemon — plugin is not the group relay path |
| Setup skipped relay wiring | Ensure `telegram.enabled` in `workspace.config.json`; re-run `npm run setup` |
