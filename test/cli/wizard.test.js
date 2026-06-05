/**
 * Unit tests for cli/wizard.js — Telegram MCP wiring.
 *
 * Uses Node's built-in test runner (node:test) and assert.
 * All file I/O is injected so no real files are touched.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
	isBunAvailable,
	buildMcpEntry,
	readJsonSafe,
	mergeMcpEntry,
	writeJsonSafe,
	wireTelegramMcp,
} from '../../cli/wizard.js';

import os from 'node:os';
import path from 'node:path';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeFsMock(initialFiles = {}) {
	const store = { ...initialFiles };
	return {
		existsSync(p) { return Object.prototype.hasOwnProperty.call(store, p); },
		readFileSync(p) {
			if (!Object.prototype.hasOwnProperty.call(store, p)) {
				const err = new Error(`ENOENT: no such file or directory, open '${p}'`);
				err.code = 'ENOENT';
				throw err;
			}
			return store[p];
		},
		mkdirSync() {},
		writeFileSync(p, data) { store[p] = data; },
		_store: store,
	};
}

function bunOk() { return '1.0.0'; }   // execFn that succeeds
function bunMissing() { throw new Error('not found'); } // execFn that fails

const WORKSPACE_ROOT = '/workspace';
const CLAUDE_SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');
const CURSOR_MCP = path.join(WORKSPACE_ROOT, '.cursor', 'mcp.json');

function baseConfig(overrides = {}) {
	return {
		telegram: {
			enabled: true,
			bot_token: 'tok123',
			relay_group_id: '-100abc',
			...overrides,
		},
	};
}

// ── isBunAvailable ─────────────────────────────────────────────────────────────

describe('isBunAvailable', () => {
	test('returns true when bun exec succeeds', () => {
		assert.equal(isBunAvailable(bunOk), true);
	});

	test('returns false when bun exec throws', () => {
		assert.equal(isBunAvailable(bunMissing), false);
	});
});

// ── buildMcpEntry ──────────────────────────────────────────────────────────────

describe('buildMcpEntry', () => {
	test('returns correct command and args', () => {
		const entry = buildMcpEntry('/some/plugin/path');
		assert.equal(entry.command, 'bun');
		assert.deepEqual(entry.args, [
			'run', '--cwd', '/some/plugin/path', '--shell=bun', '--silent', 'start',
		]);
	});
});

// ── mergeMcpEntry ──────────────────────────────────────────────────────────────

describe('mergeMcpEntry', () => {
	test('adds mcpServers.telegram to empty object', () => {
		const result = mergeMcpEntry({}, { command: 'bun', args: [] });
		assert.deepEqual(result.mcpServers.telegram, { command: 'bun', args: [] });
	});

	test('preserves existing mcpServers keys', () => {
		const existing = { mcpServers: { github: { command: 'gh' } } };
		mergeMcpEntry(existing, { command: 'bun', args: [] });
		assert.ok(existing.mcpServers.github);
		assert.ok(existing.mcpServers.telegram);
	});

	test('idempotent — overwrite does not duplicate', () => {
		const existing = {};
		const entry = { command: 'bun', args: ['run', 'start'] };
		mergeMcpEntry(existing, entry);
		mergeMcpEntry(existing, entry);
		const keys = Object.keys(existing.mcpServers);
		assert.equal(keys.length, 1);
		assert.equal(keys[0], 'telegram');
	});
});

// ── writeJsonSafe ──────────────────────────────────────────────────────────────

describe('writeJsonSafe', () => {
	test('writes pretty-printed JSON with trailing newline', () => {
		const fsMock = makeFsMock();
		writeJsonSafe('/some/file.json', { a: 1 }, fsMock);
		const written = fsMock._store['/some/file.json'];
		assert.ok(written.endsWith('\n'));
		assert.deepEqual(JSON.parse(written), { a: 1 });
	});
});

// ── wireTelegramMcp ────────────────────────────────────────────────────────────

describe('wireTelegramMcp — telegram disabled', () => {
	test('skips silently when telegram block is absent', () => {
		const fsMock = makeFsMock();
		const { wrote } = wireTelegramMcp({
			config: {},
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});
		assert.deepEqual(wrote, []);
		assert.equal(Object.keys(fsMock._store).length, 0);
	});

	test('skips silently when telegram.enabled is false', () => {
		const fsMock = makeFsMock();
		const { wrote } = wireTelegramMcp({
			config: { telegram: { enabled: false } },
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});
		assert.deepEqual(wrote, []);
		assert.equal(Object.keys(fsMock._store).length, 0);
	});
});

describe('wireTelegramMcp — bun missing', () => {
	test('prints warning and skips file writes when bun is not found', () => {
		const fsMock = makeFsMock();
		const warnings = [];
		const { wrote } = wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunMissing,
			warn: (msg) => warnings.push(msg),
		});

		assert.deepEqual(wrote, []);
		assert.equal(Object.keys(fsMock._store).length, 0);
		assert.equal(warnings.length, 1);
		assert.ok(warnings[0].includes('bun'));
		assert.ok(warnings[0].includes('https://bun.sh'));
	});
});

describe('wireTelegramMcp — claude-code only', () => {
	test('writes settings.json and leaves .cursor/mcp.json untouched', () => {
		const fsMock = makeFsMock();
		const { wrote } = wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		assert.deepEqual(wrote, [CLAUDE_SETTINGS]);
		assert.ok(fsMock.existsSync(CLAUDE_SETTINGS));
		assert.equal(fsMock.existsSync(CURSOR_MCP), false);

		const parsed = JSON.parse(fsMock._store[CLAUDE_SETTINGS]);
		assert.ok(parsed.mcpServers?.telegram?.command === 'bun');
	});

	test('preserves other keys in existing settings.json', () => {
		const existingData = JSON.stringify({ theme: 'dark', mcpServers: { github: { command: 'gh' } } });
		const fsMock = makeFsMock({ [CLAUDE_SETTINGS]: existingData });

		wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		const parsed = JSON.parse(fsMock._store[CLAUDE_SETTINGS]);
		assert.equal(parsed.theme, 'dark');
		assert.ok(parsed.mcpServers.github);
		assert.ok(parsed.mcpServers.telegram);
	});
});

describe('wireTelegramMcp — cursor only', () => {
	test('writes .cursor/mcp.json and leaves settings.json untouched', () => {
		const fsMock = makeFsMock();
		const { wrote } = wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		assert.deepEqual(wrote, [CURSOR_MCP]);
		assert.ok(fsMock.existsSync(CURSOR_MCP));
		assert.equal(fsMock.existsSync(CLAUDE_SETTINGS), false);

		const parsed = JSON.parse(fsMock._store[CURSOR_MCP]);
		assert.ok(parsed.mcpServers?.telegram?.command === 'bun');
	});

	test('creates .cursor/mcp.json when file is absent', () => {
		const fsMock = makeFsMock(); // no pre-existing files
		wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});
		assert.ok(fsMock.existsSync(CURSOR_MCP));
	});
});

describe('wireTelegramMcp — both targets', () => {
	test('writes both settings.json and .cursor/mcp.json', () => {
		const fsMock = makeFsMock();
		const { wrote } = wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		assert.deepEqual(wrote.sort(), [CLAUDE_SETTINGS, CURSOR_MCP].sort());
		assert.ok(fsMock.existsSync(CLAUDE_SETTINGS));
		assert.ok(fsMock.existsSync(CURSOR_MCP));
	});
});

describe('wireTelegramMcp — idempotency', () => {
	test('re-running does not duplicate mcpServers.telegram entry', () => {
		const fsMock = makeFsMock();

		// First run
		wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		// Second run — same config
		wireTelegramMcp({
			config: baseConfig(),
			workspaceRoot: WORKSPACE_ROOT,
			targets: ['claude-code', 'cursor'],
			fsMod: fsMock,
			execFn: bunOk,
		});

		const claudeParsed = JSON.parse(fsMock._store[CLAUDE_SETTINGS]);
		const telegramKeys = Object.keys(claudeParsed.mcpServers).filter(k => k === 'telegram');
		assert.equal(telegramKeys.length, 1);

		const cursorParsed = JSON.parse(fsMock._store[CURSOR_MCP]);
		const cursorTelegramKeys = Object.keys(cursorParsed.mcpServers).filter(k => k === 'telegram');
		assert.equal(cursorTelegramKeys.length, 1);
	});
});
