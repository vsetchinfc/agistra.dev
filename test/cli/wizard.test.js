/**
 * Unit tests for pipelines/deploy/wizard.js.
 *
 * Uses Node's built-in test runner (node:test) and assert.
 * All file I/O is injected so no real files are touched.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
	writeJsonSafe,
} from '../../pipelines/deploy/wizard.js';

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
