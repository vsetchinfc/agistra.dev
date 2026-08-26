/**
 * wizard.js — Relay MCP wiring for Claude Code and Cursor targets.
 *
 * Reads workspace.config.json → telegram block and writes mcpServers.relay
 * into the appropriate platform config files:
 *   - Claude Code: ~/.claude/settings.json
 *   - Cursor:      .cursor/mcp.json  (relative to workspace root)
 *
 * Invoked as a sub-step from setup.js. Never run standalone.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Constants ──────────────────────────────────────────────────────────────────

export const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

// ── Pure helpers (exported for testing) ───────────────────────────────────────

/**
 * Read and parse a JSON file safely.
 *
 * @param {string} filePath  Absolute path to the file.
 * @returns {object|null}  Parsed JSON, or null if the file is absent or unparseable.
 */
export function readJsonSafe(filePath, fsMod = fs) {
	if (!fsMod.existsSync(filePath)) return null;
	try {
		return JSON.parse(fsMod.readFileSync(filePath, 'utf-8'));
	} catch {
		return null;
	}
}

/**
 * Merge mcpServers.relay into a config object without duplicating.
 *
 * @param {object} existing
 * @param {object} entry
 * @returns {object}
 */
export function mergeRelayMcpEntry(existing, entry) {
	if (!existing.mcpServers) {
		existing.mcpServers = {};
	}
	existing.mcpServers.relay = entry;
	return existing;
}

/**
 * Build the MCP server entry for the hub relay daemon.
 *
 * @param {string} workspaceRoot Absolute path to the hub root.
 * @returns {object}
 */
export function buildRelayMcpEntry(workspaceRoot) {
	const serverPath = path.join(workspaceRoot, 'pipelines', 'deploy', 'relay', 'mcp', 'server.js');
	return {
		command: process.execPath,
		args: [serverPath, '--hub', path.resolve(workspaceRoot)],
	};
}

/**
 * Write a JSON object to a file atomically (write then rename).
 *
 * @param {string} filePath  Absolute path to write.
 * @param {object} data      Object to serialize.
 * @param {object} [fsMod]   Injectable fs module for testing.
 */
export function writeJsonSafe(filePath, data, fsMod = fs) {
	const dir = path.dirname(filePath);
	fsMod.mkdirSync(dir, { recursive: true });
	fsMod.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ── Main wiring functions ──────────────────────────────────────────────────────

/**
 * Wire relay MCP server config into Claude Code and/or Cursor platform files.
 *
 * @param {object} options
 * @param {object}   options.config
 * @param {string}   options.workspaceRoot
 * @param {string[]} options.targets
 * @param {object}   [options.fsMod]
 * @returns {{ wrote: string[] }}
 */
export function wireRelayMcp({
	config,
	workspaceRoot,
	targets = [],
	fsMod = fs,
}) {
	const wrote = [];

	const telegram = config?.telegram;
	if (!telegram || telegram.enabled === false) {
		return { wrote };
	}

	const entry = buildRelayMcpEntry(workspaceRoot);

	if (targets.includes('claude-code')) {
		const existing = readJsonFileSafe(CLAUDE_SETTINGS_PATH, fsMod) ?? {};
		mergeRelayMcpEntry(existing, entry);
		writeJsonSafe(CLAUDE_SETTINGS_PATH, existing, fsMod);
		wrote.push(CLAUDE_SETTINGS_PATH);
	}

	if (targets.includes('cursor')) {
		const cursorMcpPath = path.join(workspaceRoot, '.cursor', 'mcp.json');
		const existing = readJsonFileSafe(cursorMcpPath, fsMod) ?? {};
		mergeRelayMcpEntry(existing, entry);
		writeJsonSafe(cursorMcpPath, existing, fsMod);
		wrote.push(cursorMcpPath);
	}

	return { wrote };
}

// ── Internal helper (uses injectable fs for testability) ─────────────────────

/**
 * Read and parse JSON using an injectable fs module.
 *
 * @param {string} filePath
 * @param {object} fsMod
 * @returns {object|null}
 */
function readJsonFileSafe(filePath, fsMod) {
	if (!fsMod.existsSync(filePath)) return null;
	try {
		return JSON.parse(fsMod.readFileSync(filePath, 'utf-8'));
	} catch {
		return null;
	}
}
