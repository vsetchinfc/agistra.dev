/**
 * wizard.js — Telegram MCP wiring for Claude Code and Cursor targets.
 *
 * Reads workspace.config.json → telegram block and writes mcpServers.telegram
 * into the appropriate platform config files:
 *   - Claude Code: ~/.claude/settings.json
 *   - Cursor:      .cursor/mcp.json  (relative to workspace root)
 *
 * Invoked as a sub-step from setup.js. Never run standalone.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

// ── Constants ──────────────────────────────────────────────────────────────────

const PLUGIN_PATH = path.join(
	os.homedir(),
	'.claude',
	'plugins',
	'marketplaces',
	'claude-plugins-official',
	'external_plugins',
	'telegram',
);

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

// ── Pure helpers (exported for testing) ───────────────────────────────────────

/**
 * Check whether `bun` is available on PATH.
 *
 * @param {function(string, string[], object): string} [execFn]
 *   Injectable exec function for testing. Defaults to execFileSync.
 * @returns {boolean}
 */
export function isBunAvailable(execFn = execFileSync) {
	try {
		execFn('bun', ['--version'], { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Build the MCP server entry for the Telegram plugin.
 *
 * @param {string} pluginPath  Absolute path to the plugin directory.
 * @returns {object}  The mcpServers.telegram config object.
 */
export function buildMcpEntry(pluginPath) {
	return {
		command: 'bun',
		args: ['run', '--cwd', pluginPath, '--shell=bun', '--silent', 'start'],
	};
}

/**
 * Read and parse a JSON file safely.
 *
 * @param {string} filePath  Absolute path to the file.
 * @returns {object|null}  Parsed JSON, or null if the file is absent or unparseable.
 */
export function readJsonSafe(filePath) {
	if (!fs.existsSync(filePath)) return null;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch {
		return null;
	}
}

/**
 * Merge mcpServers.telegram into a config object without duplicating.
 *
 * @param {object} existing  Current parsed JSON (may be empty object).
 * @param {object} entry     The MCP entry to set.
 * @returns {object}  The updated object (same reference).
 */
export function mergeMcpEntry(existing, entry) {
	if (!existing.mcpServers) {
		existing.mcpServers = {};
	}
	existing.mcpServers.telegram = entry;
	return existing;
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

// ── Main wiring function ───────────────────────────────────────────────────────

/**
 * Wire Telegram MCP server config into Claude Code and/or Cursor platform files.
 *
 * @param {object} options
 * @param {object}   options.config       Parsed workspace.config.json.
 * @param {string}   options.workspaceRoot Absolute path to the workspace root.
 * @param {string[]} options.targets       Active targets: ['claude-code', 'cursor'].
 * @param {object}   [options.fsMod]       Injectable fs module for testing.
 * @param {function} [options.execFn]      Injectable exec function for bun check.
 * @param {function} [options.warn]        Injectable warn output function.
 * @returns {{ wrote: string[] }}  List of file paths that were written.
 */
export function wireTelegramMcp({
	config,
	workspaceRoot,
	targets = [],
	fsMod = fs,
	execFn = execFileSync,
	warn = (msg) => process.stderr.write(msg + '\n'),
}) {
	const wrote = [];

	// AC1/AC2: Read telegram block; skip if absent or disabled
	const telegram = config?.telegram;
	if (!telegram || telegram.enabled === false) {
		return { wrote };
	}

	// AC3: Pre-flight bun check
	if (!isBunAvailable(execFn)) {
		warn(
			'WARNING: `bun` was not found on PATH. ' +
			'Telegram MCP server requires bun to run. ' +
			'Install bun at https://bun.sh and re-run setup.',
		);
		return { wrote };
	}

	const entry = buildMcpEntry(PLUGIN_PATH);

	// AC4: Claude Code target
	if (targets.includes('claude-code')) {
		const existing = readJsonFileSafe(CLAUDE_SETTINGS_PATH, fsMod) ?? {};
		mergeMcpEntry(existing, entry);
		writeJsonSafe(CLAUDE_SETTINGS_PATH, existing, fsMod);
		wrote.push(CLAUDE_SETTINGS_PATH);
	}

	// AC5: Cursor target
	if (targets.includes('cursor')) {
		const cursorMcpPath = path.join(workspaceRoot, '.cursor', 'mcp.json');
		const existing = readJsonFileSafe(cursorMcpPath, fsMod) ?? {};
		mergeMcpEntry(existing, entry);
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
