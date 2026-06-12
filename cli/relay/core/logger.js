/**
 * Daemon trace logger — per-day rotating log files in relay/logs/.
 *
 * Log path: <hubRoot>/relay/logs/dispatch-YYYY-MM-DD.log  (UTC date)
 * Date is resolved on each log() call so midnight auto-rotates without a timer.
 */

import fs from 'node:fs';
import path from 'node:path';

const LOG_FILENAME_PATTERN = /^dispatch-(\d{4}-\d{2}-\d{2})\.log$/;

/**
 * Return YYYY-MM-DD in UTC for the given timestamp (or now).
 *
 * @param {number} [nowMs]  Override Date.now() for testing.
 * @returns {string}
 */
function utcDateString(nowMs = Date.now()) {
	return new Date(nowMs).toISOString().slice(0, 10);
}

/**
 * Resolve the log file path for a given UTC date.
 *
 * @param {string} logsDir
 * @param {string} dateStr   YYYY-MM-DD
 * @returns {string}
 */
export function resolveLogPath(logsDir, dateStr) {
	return path.join(logsDir, `dispatch-${dateStr}.log`);
}

/**
 * Create a daemon logger that writes to relay/logs/dispatch-YYYY-MM-DD.log.
 *
 * @param {string} hubRoot  Absolute hub root.
 * @param {object} [options]
 * @param {typeof fs} [options.fsMod]  Injectable for testing.
 * @param {() => number} [options.nowFn]  Injectable clock for testing.
 * @returns {{ log: (message: string) => void, pruneOldLogs: (olderThanMs: number) => number }}
 */
export function createDaemonLogger(hubRoot, { fsMod = fs, nowFn = () => Date.now() } = {}) {
	const logsDir = path.join(hubRoot, 'relay', 'logs');

	function ensureLogsDir() {
		fsMod.mkdirSync(logsDir, { recursive: true });
	}

	function log(message) {
		try {
			ensureLogsDir();
			const dateStr = utcDateString(nowFn());
			const logPath = resolveLogPath(logsDir, dateStr);
			fsMod.appendFileSync(logPath, `[${new Date(nowFn()).toISOString()}] ${message}\n`);
		} catch {
			// non-fatal — logging errors must not break the daemon
		}
	}

	/**
	 * Delete log files in relay/logs/ matching dispatch-YYYY-MM-DD.log whose
	 * date is older than Date.now() - olderThanMs. Skips today's file.
	 * Non-fatal on individual delete errors.
	 *
	 * @param {number} olderThanMs
	 * @returns {number} Count of files deleted.
	 */
	function pruneOldLogs(olderThanMs) {
		let deleted = 0;
		const todayStr = utcDateString(nowFn());
		const threshold = nowFn() - olderThanMs;

		let entries;
		try {
			entries = fsMod.readdirSync(logsDir);
		} catch {
			// relay/logs does not exist yet — nothing to prune
			return 0;
		}

		for (const entry of entries) {
			const match = LOG_FILENAME_PATTERN.exec(entry);
			if (!match) continue;
			const fileDateStr = match[1];
			if (fileDateStr === todayStr) continue; // never delete today's file

			const fileTs = new Date(`${fileDateStr}T00:00:00Z`).getTime();
			if (fileTs < threshold) {
				try {
					fsMod.unlinkSync(path.join(logsDir, entry));
					deleted++;
				} catch {
					// non-fatal — skip unreadable or locked files
				}
			}
		}

		return deleted;
	}

	return { log, pruneOldLogs };
}
