/**
 * Unit tests for cli/relay/core/logger.js
 *
 * Uses Node's built-in test runner (node:test).
 * All file I/O is injected via fsMod/nowFn — no real files are touched.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { createDaemonLogger, resolveLogPath } from '../../../cli/relay/core/logger.js';

// ── fs mock factory ────────────────────────────────────────────────────────────

function makeFsMock(initialFiles = {}) {
	const store = { ...initialFiles };
	const dirs = new Set();

	return {
		_store: store,
		_dirs: dirs,
		existsSync(p) {
			return Object.prototype.hasOwnProperty.call(store, p);
		},
		mkdirSync(p, _opts) {
			dirs.add(p);
		},
		appendFileSync(p, data) {
			store[p] = (store[p] ?? '') + data;
		},
		readdirSync(p) {
			if (!dirs.has(p) && !Object.keys(store).some(k => k.startsWith(p + path.sep) || k.startsWith(p + '/'))) {
				const err = new Error(`ENOENT: no such file or directory, scandir '${p}'`);
				err.code = 'ENOENT';
				throw err;
			}
			// return basenames of files whose directory matches p
			return Object.keys(store)
				.filter(k => path.dirname(k) === p)
				.map(k => path.basename(k));
		},
		unlinkSync(p) {
			delete store[p];
		},
	};
}

// ── resolveLogPath ─────────────────────────────────────────────────────────────

describe('resolveLogPath', () => {
	test('returns correct path for a given date', () => {
		const logsDir = '/hub/relay/logs';
		const result = resolveLogPath(logsDir, '2025-01-15');
		assert.equal(result, path.join(logsDir, 'dispatch-2025-01-15.log'));
	});
});

// ── log() ──────────────────────────────────────────────────────────────────────

describe('createDaemonLogger — log()', () => {
	test('creates relay/logs directory and writes timestamped line', () => {
		const hubRoot = '/hub';
		const fsMod = makeFsMock();
		const logsDir = path.join(hubRoot, 'relay', 'logs');
		const now = new Date('2025-06-10T00:00:00.000Z').getTime();
		const logger = createDaemonLogger(hubRoot, { fsMod, nowFn: () => now });

		logger.log('hello world');

		const expectedPath = path.join(logsDir, 'dispatch-2025-06-10.log');
		assert.ok(fsMod._store[expectedPath], 'log file should exist');
		assert.match(fsMod._store[expectedPath], /\[2025-06-10T00:00:00\.000Z\] hello world\n/);
	});

	test('uses different date for a different UTC date', () => {
		const hubRoot = '/hub';
		const fsMod = makeFsMock();
		const logsDir = path.join(hubRoot, 'relay', 'logs');

		// First log — 2025-06-10
		const d1 = new Date('2025-06-10T23:59:59.000Z').getTime();
		const logger1 = createDaemonLogger(hubRoot, { fsMod, nowFn: () => d1 });
		logger1.log('day one');
		assert.ok(fsMod._store[path.join(logsDir, 'dispatch-2025-06-10.log')]);

		// Second log — 2025-06-11 (simulates midnight rollover by creating a new logger)
		const d2 = new Date('2025-06-11T00:00:01.000Z').getTime();
		let calls = 0;
		const logger2 = createDaemonLogger(hubRoot, { fsMod, nowFn: () => { calls++; return d2; } });
		logger2.log('day two');
		assert.ok(fsMod._store[path.join(logsDir, 'dispatch-2025-06-11.log')]);
	});

	test('is non-fatal when appendFileSync throws', () => {
		const hubRoot = '/hub';
		const fsMod = makeFsMock();
		fsMod.appendFileSync = () => { throw new Error('disk full'); };
		const logger = createDaemonLogger(hubRoot, { fsMod });
		assert.doesNotThrow(() => logger.log('should not throw'));
	});
});

// ── pruneOldLogs() ─────────────────────────────────────────────────────────────

describe('createDaemonLogger — pruneOldLogs()', () => {
	const hubRoot = '/hub';
	const logsDir = path.join(hubRoot, 'relay', 'logs');

	function makeLogPath(dateStr) {
		return path.join(logsDir, `dispatch-${dateStr}.log`);
	}

	test('deletes files older than threshold, skips today\'s file', () => {
		// Today: 2025-06-10, threshold: 30 days → cut-off is 2025-05-11
		const now = new Date('2025-06-10T12:00:00Z').getTime();

		const fsMod = makeFsMock({
			[makeLogPath('2025-05-01')]: 'old1\n',   // older than 30d — should delete
			[makeLogPath('2025-05-10')]: 'old2\n',   // older than 30d — should delete
			[makeLogPath('2025-05-11')]: 'edge\n',   // exactly 30d ago (inclusive of day boundary) — should delete
			[makeLogPath('2025-06-01')]: 'recent\n', // within 30d — keep
			[makeLogPath('2025-06-10')]: 'today\n',  // today — keep
		});
		// Mark logsDir as existing for readdirSync
		fsMod._dirs.add(logsDir);

		const logger = createDaemonLogger(hubRoot, { fsMod, nowFn: () => now });
		const deleted = logger.pruneOldLogs(30 * 86400 * 1000);

		assert.ok(deleted >= 2, `expected at least 2 deleted, got ${deleted}`);
		assert.ok(!fsMod._store[makeLogPath('2025-05-01')], 'old file should be deleted');
		assert.ok(!fsMod._store[makeLogPath('2025-05-10')], 'old file should be deleted');
		assert.ok(fsMod._store[makeLogPath('2025-06-01')], 'recent file should be kept');
		assert.ok(fsMod._store[makeLogPath('2025-06-10')], 'today file should be kept');
	});

	test('returns count of deleted files', () => {
		const now = new Date('2025-06-10T12:00:00Z').getTime();
		const fsMod = makeFsMock({
			[makeLogPath('2025-01-01')]: 'a\n',
			[makeLogPath('2025-01-02')]: 'b\n',
			[makeLogPath('2025-06-10')]: 'today\n',
		});
		fsMod._dirs.add(logsDir);

		const logger = createDaemonLogger(hubRoot, { fsMod, nowFn: () => now });
		const deleted = logger.pruneOldLogs(30 * 86400 * 1000);

		assert.equal(deleted, 2);
	});

	test('returns 0 when relay/logs does not exist', () => {
		const fsMod = makeFsMock(); // empty store, no dirs
		const logger = createDaemonLogger(hubRoot, { fsMod });
		const deleted = logger.pruneOldLogs(30 * 86400 * 1000);
		assert.equal(deleted, 0);
	});

	test('skips non-matching filenames', () => {
		const now = new Date('2025-06-10T12:00:00Z').getTime();
		const fsMod = makeFsMock({
			[path.join(logsDir, 'daemon.pid')]: 'x',
			[path.join(logsDir, 'some-other.log')]: 'y',
			[makeLogPath('2025-06-10')]: 'today\n',
		});
		fsMod._dirs.add(logsDir);

		const logger = createDaemonLogger(hubRoot, { fsMod, nowFn: () => now });
		const deleted = logger.pruneOldLogs(30 * 86400 * 1000);
		assert.equal(deleted, 0);
		assert.ok(fsMod._store[path.join(logsDir, 'daemon.pid')], 'non-log file should not be touched');
	});

	test('is non-fatal when unlinkSync throws on one file', () => {
		const now = new Date('2025-06-10T12:00:00Z').getTime();
		const fsMod = makeFsMock({
			[makeLogPath('2025-01-01')]: 'a\n',
			[makeLogPath('2025-01-02')]: 'b\n',
			[makeLogPath('2025-06-10')]: 'today\n',
		});
		fsMod._dirs.add(logsDir);

		let unlinkCalls = 0;
		const origUnlink = fsMod.unlinkSync.bind(fsMod);
		fsMod.unlinkSync = (p) => {
			unlinkCalls++;
			if (unlinkCalls === 1) throw new Error('locked');
			origUnlink(p);
		};

		const logger = createDaemonLogger(hubRoot, { fsMod, nowFn: () => now });
		assert.doesNotThrow(() => logger.pruneOldLogs(30 * 86400 * 1000));
	});
});

// ── logRetentionDays default in config ────────────────────────────────────────

describe('loadRelayConfig — logRetentionDays', () => {
	// Import inline to keep test self-contained
	test('defaults to 30 when relay.logRetentionDays is absent', async () => {
		const { loadRelayConfig } = await import('../../../cli/relay/core/config.js');

		const fsMod = {
			existsSync: () => true,
			readFileSync: () => JSON.stringify({
				telegram: { enabled: true, bot_token: 'tok', relay_group_id: '-100' },
				relay: {},
			}),
		};

		const cfg = loadRelayConfig({ hubRoot: '/hub', fsMod });
		assert.equal(cfg.logRetentionDays, 30);
	});

	test('uses provided numeric value', async () => {
		const { loadRelayConfig } = await import('../../../cli/relay/core/config.js');

		const fsMod = {
			existsSync: () => true,
			readFileSync: () => JSON.stringify({
				telegram: { enabled: true, bot_token: 'tok', relay_group_id: '-100' },
				relay: { logRetentionDays: 7 },
			}),
		};

		const cfg = loadRelayConfig({ hubRoot: '/hub', fsMod });
		assert.equal(cfg.logRetentionDays, 7);
	});

	test('defaults to 30 when relay.logRetentionDays is non-numeric', async () => {
		const { loadRelayConfig } = await import('../../../cli/relay/core/config.js');

		const fsMod = {
			existsSync: () => true,
			readFileSync: () => JSON.stringify({
				telegram: { enabled: true, bot_token: 'tok', relay_group_id: '-100' },
				relay: { logRetentionDays: 'banana' },
			}),
		};

		const cfg = loadRelayConfig({ hubRoot: '/hub', fsMod });
		assert.equal(cfg.logRetentionDays, 30);
	});
});
