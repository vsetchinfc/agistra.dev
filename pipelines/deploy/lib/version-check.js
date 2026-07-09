#!/usr/bin/env node
/**
 * version-check.js — compare local hub VERSION against deployed hub.
 *
 * Usage: node pipelines/deploy/lib/version-check.js [--hub <path>]
 *
 * Outputs JSON: { status, local, remote }
 * Status values:
 *   "up-to-date"       — local matches remote
 *   "update-available" — remote is newer
 *   "local-ahead"      — local is newer (dev scenario)
 *   "offline"          — could not reach remote
 *   "no-local-version" — local VERSION file missing or unreadable
 *   "no-remote-version"— remote returned unparseable content
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { parseVersion, compareVersions } from './version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REMOTE_URL = 'https://raw.githubusercontent.com/vsetchinfc/agistra.dev/main/VERSION';

function readLocalVersion(hubRoot) {
	const versionPath = path.join(hubRoot, 'VERSION');
	try {
		const content = fs.readFileSync(versionPath, 'utf-8');
		return parseVersion(content);
	} catch {
		return null;
	}
}

function fetchRemoteVersion(url) {
	return new Promise((resolve) => {
		const req = https.get(url, { timeout: 5000 }, (res) => {
			let data = '';
			res.on('data', chunk => { data += chunk; });
			res.on('end', () => resolve(parseVersion(data)));
		});
		req.on('error', () => resolve(null));
		req.on('timeout', () => { req.destroy(); resolve(null); });
	});
}

async function main() {
	const args = process.argv.slice(2);
	const hubIdx = args.indexOf('--hub');
	const hubRoot = hubIdx !== -1 ? path.resolve(args[hubIdx + 1]) : path.resolve(__dirname, '..', '..', '..');

	const local = readLocalVersion(hubRoot);
	if (!local) {
		console.log(JSON.stringify({ status: 'no-local-version', local: null, remote: null }));
		process.exit(0);
	}

	let remote;
	try {
		remote = await fetchRemoteVersion(REMOTE_URL);
	} catch {
		remote = null;
	}

	if (remote === null) {
		// Distinguish offline from no-remote-version by whether we got a response
		console.log(JSON.stringify({ status: 'offline', local, remote: null }));
		process.exit(0);
	}

	if (!remote) {
		console.log(JSON.stringify({ status: 'no-remote-version', local, remote: null }));
		process.exit(0);
	}

	const cmp = compareVersions(local, remote);
	let status;
	if (cmp === 0) status = 'up-to-date';
	else if (cmp < 0) status = 'update-available';
	else status = 'local-ahead';

	console.log(JSON.stringify({ status, local, remote }));
}

main();
