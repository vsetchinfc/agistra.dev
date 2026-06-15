/** Command run from hub root on Claude Code SessionStart. */
export const RELAY_SESSION_START_COMMAND = 'node tools/ensure-relay-daemon.js';

/**
 * Ensure hub .claude/settings.json includes SessionStart → ensure-relay-daemon.
 * Idempotent — skips if hook already present.
 *
 * @param {object} settings
 * @returns {object}
 */
export function mergeRelaySessionStartHook(settings = {}) {
	const next = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
	const sessionStart = [...(next.hooks.SessionStart ?? [])];
	const hasRelayHook = sessionStart.some(entry =>
		entry.hooks?.some(h => String(h.command ?? '').includes('ensure-relay-daemon')),
	);
	if (!hasRelayHook) {
		sessionStart.push({
			matcher: '',
			hooks: [{ type: 'command', command: RELAY_SESSION_START_COMMAND }],
		});
	}
	next.hooks.SessionStart = sessionStart;
	return next;
}
