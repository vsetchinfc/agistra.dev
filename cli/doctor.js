#!/usr/bin/env node
/**
 * doctor.js — Hub health check command.
 *
 * Runs 9 checks and prints a coloured report showing green/warn/fail for each
 * configuration item. Designed to be run after `npm run setup` to confirm the
 * hub is correctly configured before starting a work session.
 *
 * Usage:
 *   node cli/doctor.js --output <hub-root>   # check the given hub
 *   node cli/doctor.js                       # defaults to cwd
 *   npm run doctor                           # deployed hub shortcut
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CLAUDE_SETTINGS_PATH, readJsonSafe } from './wizard.js';
import { DEFAULT_DAEMON_PORT } from './relay/core/config.js';
import { resolveRouterModel, parseProfileModel } from './lib/models.js';

// ── Check result constructors ──────────────────────────────────────────────────

function pass(id, label, message) {
	return { id, label, status: 'pass', message, hint: null };
}

function fail(id, label, message, hint) {
	return { id, label, status: 'fail', message, hint };
}

function warn(id, label, message, hint) {
	return { id, label, status: 'warn', message, hint };
}

function skip(id, label, message) {
	return { id, label, status: 'skip', message, hint: null };
}

// ── Individual checks ──────────────────────────────────────────────────────────

function checkWorkspaceConfig({ hubRoot, fsMod }) {
	const p = path.join(hubRoot, 'workspace.config.json');
	if (fsMod.existsSync(p)) {
		return pass(1, 'workspace config', 'workspace.config.json found');
	}
	return fail(1, 'workspace config', 'workspace.config.json not found',
		'run: npm run setup');
}

function checkGitignore({ hubRoot, fsMod }) {
	const p = path.join(hubRoot, '.gitignore');
	if (!fsMod.existsSync(p)) {
		return fail(2, '.gitignore entries', '.gitignore not found',
			'run: npm run deploy (redeploy hub)');
	}
	const content = fsMod.readFileSync(p, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());
	const missing = [];
	if (!lines.includes('workspace.config.json')) missing.push('workspace.config.json');
	if (!lines.includes('.claude/settings.local.json')) missing.push('.claude/settings.local.json');
	if (missing.length === 0) {
		return pass(2, '.gitignore entries', 'both personal files covered');
	}
	return fail(2, '.gitignore entries', `missing entries: ${missing.join(', ')}`,
		'run: npm run deploy (redeploy hub to add missing entries)');
}

function checkGitattributes({ hubRoot, fsMod }) {
	const p = path.join(hubRoot, '.gitattributes');
	if (!fsMod.existsSync(p)) {
		return fail(3, '.gitattributes', '.gitattributes not found',
			'run: npm run deploy (redeploy hub)');
	}
	const content = fsMod.readFileSync(p, 'utf-8');
	const missing = [];
	if (!/memory\/\*\.md\s+merge=ours/.test(content)) missing.push('memory/*.md merge=ours');
	if (!/.cursor\/rules\/workspace-identity\.mdc\s+merge=ours/.test(content)) {
		missing.push('.cursor/rules/workspace-identity.mdc merge=ours');
	}
	if (missing.length === 0) {
		return pass(3, '.gitattributes', 'merge=ours entries present');
	}
	return fail(3, '.gitattributes', `missing entries: ${missing.join(', ')}`,
		'run: npm run deploy (redeploy hub to add missing entries)');
}

function checkMemoryFiles({ hubRoot, fsMod }) {
	const required = ['architect.md', 'builder.md', 'tester.md', 'router.md'];
	const missing = required.filter(f => !fsMod.existsSync(path.join(hubRoot, 'memory', f)));
	if (missing.length === 0) {
		return pass(4, 'memory files', 'all 4 agent memory files present');
	}
	return fail(4, 'memory files', `missing: ${missing.join(', ')}`,
		'run: npm run deploy (redeploy hub to scaffold memory files)');
}

function checkMcpJson({ hubRoot, fsMod }) {
	const p = path.join(hubRoot, '.mcp.json');
	if (!fsMod.existsSync(p)) {
		return fail(5, '.mcp.json', '.mcp.json not found',
			'run: npm run deploy (redeploy hub)');
	}
	let data;
	try {
		data = JSON.parse(fsMod.readFileSync(p, 'utf-8'));
	} catch {
		return fail(5, '.mcp.json', '.mcp.json is not valid JSON',
			'run: npm run deploy (redeploy hub to regenerate .mcp.json)');
	}
	if (data?.mcpServers?.['agent-browser']) {
		return pass(5, '.mcp.json', 'agent-browser wired');
	}
	return fail(5, '.mcp.json', 'mcpServers.agent-browser missing',
		'run: npm run deploy (redeploy hub to add agent-browser)');
}

function readHubConfig(hubRoot, fsMod) {
	const configPath = path.join(hubRoot, 'workspace.config.json');
	if (!fsMod.existsSync(configPath)) {
		return { config: null, skipReason: 'workspace.config.json absent — skipping relay check' };
	}
	try {
		return { config: JSON.parse(fsMod.readFileSync(configPath, 'utf-8')), skipReason: null };
	} catch {
		return { config: null, skipReason: 'workspace.config.json unreadable — skipping relay check' };
	}
}

function isRemoteTeamEnabled(config) {
	return Boolean(config?.remoteTeam?.enabled);
}

async function checkRelayDaemonAsync({ hubRoot, fsMod, probeHealth }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason) return skip(6, 'relay daemon', skipReason);
	if (!isRemoteTeamEnabled(config)) {
		return skip(6, 'relay daemon', 'remoteTeam not enabled — relay check skipped');
	}

	const port = Number(config?.relay?.daemonPort) || DEFAULT_DAEMON_PORT;
	const result = await probeHealth(port);
	if (result === 'ok') {
		return pass(6, 'relay daemon', `GET localhost:${port}/health returned ok`);
	}
	return warn(6, 'relay daemon',
		result === 'bad' ? `daemon on port ${port} did not return ok` : `daemon not reachable on port ${port}`,
		'start: npm run relay -- --hub . (from profiles repo) or npm run relay (deployed hub)');
}

function checkRelayMcp({ hubRoot, fsMod }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason) return skip(7, 'relay MCP', skipReason);
	if (!isRemoteTeamEnabled(config)) {
		return skip(7, 'relay MCP', 'remoteTeam not enabled — relay check skipped');
	}

	const claudeSettings = readJsonSafe(CLAUDE_SETTINGS_PATH, fsMod);
	const cursorMcpPath = path.join(hubRoot, '.cursor', 'mcp.json');
	const cursorSettings = readJsonSafe(cursorMcpPath, fsMod);
	const hasClaude = Boolean(claudeSettings?.mcpServers?.relay);
	const hasCursor = Boolean(cursorSettings?.mcpServers?.relay);

	if (hasClaude && hasCursor) {
		return pass(7, 'relay MCP', 'mcpServers.relay in Claude settings and .cursor/mcp.json');
	}
	if (hasClaude) {
		return pass(7, 'relay MCP', 'mcpServers.relay present in ~/.claude/settings.json');
	}
	if (hasCursor) {
		return pass(7, 'relay MCP', 'mcpServers.relay present in .cursor/mcp.json');
	}

	return fail(7, 'relay MCP',
		'remoteTeam enabled but mcpServers.relay missing in Claude settings and .cursor/mcp.json',
		'run: npm run setup (re-enter telegram credentials to wire relay MCP)');
}

function checkTelegramConfig({ hubRoot, fsMod }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason) return skip(8, 'telegram config', skipReason);
	if (!isRemoteTeamEnabled(config)) {
		return skip(8, 'telegram config', 'remoteTeam not enabled — telegram check skipped');
	}

	const telegram = config?.telegram;
	const missing = [];
	if (!telegram || telegram.enabled === false) missing.push('telegram.enabled');
	if (!telegram?.bot_token) missing.push('telegram.bot_token');
	if (!telegram?.relay_group_id) missing.push('telegram.relay_group_id');

	if (missing.length === 0) {
		return pass(8, 'telegram config', 'telegram credentials complete in workspace.config.json');
	}
	return fail(8, 'telegram config',
		`incomplete telegram block: missing ${missing.join(', ')}`,
		'run: npm run setup');
}

function checkAgentProfiles({ hubRoot, fsMod }) {
	const dir = path.join(hubRoot, '.claude', 'agents');
	if (!fsMod.existsSync(dir)) {
		return fail(9, 'agent profiles', '.claude/agents/ directory not found',
			'run: npm run deploy (redeploy hub)');
	}
	let entries;
	try {
		entries = fsMod.readdirSync(dir).filter(f => f.endsWith('.md'));
	} catch {
		return fail(9, 'agent profiles', 'could not read .claude/agents/',
			'run: npm run deploy (redeploy hub)');
	}
	if (entries.length === 0) {
		return fail(9, 'agent profiles', '.claude/agents/ is empty',
			'run: npm run deploy (redeploy hub)');
	}
	return pass(9, 'agent profiles', `${entries.length} agent profile(s) found in .claude/agents/`);
}

function isAutoDispatchEnabled(config) {
	return config?.relay?.autoDispatch === true;
}

function checkAutoDispatchClaude({ hubRoot, fsMod, execFn }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason || !isAutoDispatchEnabled(config)) {
		return skip(10, 'auto-dispatch: claude', 'autoDispatch not enabled — check skipped');
	}
	try {
		execFn('claude', ['--version'], { stdio: 'pipe' });
		return pass(10, 'auto-dispatch: claude', '`claude` found on PATH');
	} catch {
		return fail(10, 'auto-dispatch: claude', '`claude` not found on PATH',
			'install Claude Code CLI: https://claude.ai/download');
	}
}

function checkAutoDispatchRouterProfile({ hubRoot, fsMod }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason || !isAutoDispatchEnabled(config)) {
		return skip(11, 'auto-dispatch: router profile', 'autoDispatch not enabled — check skipped');
	}
	const profilePath = path.join(hubRoot, '.claude', 'agents', 'router.md');
	if (fsMod.existsSync(profilePath)) {
		return pass(11, 'auto-dispatch: router profile', '.claude/agents/router.md found');
	}
	return fail(11, 'auto-dispatch: router profile', '.claude/agents/router.md not found',
		'run: npm run deploy (redeploy hub to install router profile)');
}

function checkAutoDispatchRouterModel({ hubRoot, fsMod, profilesRoot }) {
	const { config, skipReason } = readHubConfig(hubRoot, fsMod);
	if (skipReason || !isRemoteTeamEnabled(config)) {
		return skip(12, 'router model tier', 'remoteTeam not enabled — check skipped');
	}
	const profilePath = path.join(hubRoot, '.claude', 'agents', 'router.md');
	if (!fsMod.existsSync(profilePath)) {
		return skip(12, 'router model tier', '.claude/agents/router.md absent — skipping model check');
	}
	let deployedModel;
	try {
		deployedModel = parseProfileModel(fsMod.readFileSync(profilePath, 'utf-8'));
	} catch {
		return skip(12, 'router model tier', 'could not read router profile — skipping model check');
	}
	let expectedModel;
	try {
		expectedModel = resolveRouterModel(profilesRoot, fsMod);
	} catch {
		return skip(12, 'router model tier', 'router manifest unavailable — skipping model check');
	}
	if (!deployedModel) {
		return warn(12, 'router model tier',
			'deployed router.md has no model field — economy tier not enforced',
			`run: npm run deploy (expected model: ${expectedModel})`);
	}
	if (deployedModel !== expectedModel) {
		return warn(12, 'router model tier',
			`deployed model (${deployedModel}) ≠ manifest economy tier (${expectedModel})`,
			'run: npm run deploy (redeploy to update router model)');
	}
	return pass(12, 'router model tier', `router uses economy model ${deployedModel}`);
}

/**
 * Default health probe — GET /health and expect JSON with ok: true.
 *
 * @param {number} port
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<'ok'|'bad'|'unreachable'>}
 */
export async function probeRelayHealth(port, fetchFn = globalThis.fetch) {
	try {
		const res = await fetchFn(`http://127.0.0.1:${port}/health`);
		const data = await res.json();
		return res.ok && data?.ok === true ? 'ok' : 'bad';
	} catch {
		return 'unreachable';
	}
}

// ── runChecks (exported for testing) ──────────────────────────────────────────

/**
 * Run all hub health checks.
 *
 * @param {object} options
 * @param {string}   options.hubRoot      Absolute path to the hub root.
 * @param {object}   [options.fsMod]      Injectable fs module for testability.
 * @param {function(number): Promise<'ok'|'bad'|'unreachable'>} [options.probeHealth]
 * @param {function} [options.execFn]     Injectable execFileSync for PATH checks.
 * @param {string}   [options.profilesRoot] Absolute path to profiles repo root.
 * @returns {Promise<Array<{id, label, status, message, hint}>>}
 */
export async function runChecks({
	hubRoot,
	fsMod = fs,
	probeHealth = probeRelayHealth,
	execFn = execFileSync,
	profilesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
}) {
	return [
		checkWorkspaceConfig({ hubRoot, fsMod }),
		checkGitignore({ hubRoot, fsMod }),
		checkGitattributes({ hubRoot, fsMod }),
		checkMemoryFiles({ hubRoot, fsMod }),
		checkMcpJson({ hubRoot, fsMod }),
		await checkRelayDaemonAsync({ hubRoot, fsMod, probeHealth }),
		checkRelayMcp({ hubRoot, fsMod }),
		checkTelegramConfig({ hubRoot, fsMod }),
		checkAgentProfiles({ hubRoot, fsMod }),
		checkAutoDispatchClaude({ hubRoot, fsMod, execFn }),
		checkAutoDispatchRouterProfile({ hubRoot, fsMod }),
		checkAutoDispatchRouterModel({ hubRoot, fsMod, profilesRoot }),
	];
}

// ── computeExitCode (exported for testing) ────────────────────────────────────

/**
 * Compute exit code from check results.
 *
 * @param {Array} checks
 * @returns {0|1|2}  0 = all pass/skip, 1 = any fail, 2 = warnings only (no fails)
 */
export function computeExitCode(checks) {
	if (checks.some(c => c.status === 'fail')) return 1;
	if (checks.some(c => c.status === 'warn')) return 2;
	return 0;
}

// ── formatReport (exported for testing) ───────────────────────────────────────

const LABEL_WIDTH = 24;

function formatCheck(check, useColor) {
	const green  = useColor ? '\x1b[32m' : '';
	const red    = useColor ? '\x1b[31m' : '';
	const yellow = useColor ? '\x1b[33m' : '';
	const dim    = useColor ? '\x1b[2m'  : '';
	const reset  = useColor ? '\x1b[0m'  : '';

	let sym;
	switch (check.status) {
		case 'pass': sym = `${green}✓${reset}`; break;
		case 'fail': sym = `${red}✗${reset}`;   break;
		case 'warn': sym = `${yellow}⚠${reset}`; break;
		default:     sym = '-';
	}

	const label = check.label.padEnd(LABEL_WIDTH);
	const lines = [`  ${sym}  ${label} ${check.message}`];
	if (check.hint) {
		const indent = ' '.repeat(LABEL_WIDTH + 5);
		lines.push(`  ${indent} ${dim}→ ${check.hint}${reset}`);
	}
	return lines;
}

/**
 * Format the full doctor report as a string.
 *
 * @param {Array}   checks     Results from runChecks.
 * @param {boolean} useColor   Whether to emit ANSI colour codes.
 * @returns {string}
 */
export function formatReport(checks, useColor = false) {
	const lines = [];

	lines.push('╔══════════════════════════════════════════════╗');
	lines.push('║           Hub Health Check (doctor)          ║');
	lines.push('╚══════════════════════════════════════════════╝');
	lines.push('');

	for (const check of checks) {
		for (const line of formatCheck(check, useColor)) {
			lines.push(line);
		}
	}

	lines.push('');
	lines.push('── Result ────────────────────────────────────');
	lines.push('');

	const exitCode = computeExitCode(checks);
	if (exitCode === 0) {
		const green = useColor ? '\x1b[32m' : '';
		const reset = useColor ? '\x1b[0m'  : '';
		lines.push(`  ${green}READY${reset} — hub is correctly configured`);
	} else {
		const red    = useColor ? '\x1b[31m' : '';
		const yellow = useColor ? '\x1b[33m' : '';
		const reset  = useColor ? '\x1b[0m'  : '';
		const fails  = checks.filter(c => c.status === 'fail').length;
		const warns  = checks.filter(c => c.status === 'warn').length;
		const parts  = [];
		if (fails > 0) parts.push(`${red}${fails} error${fails > 1 ? 's' : ''}${reset}`);
		if (warns > 0) parts.push(`${yellow}${warns} warning${warns > 1 ? 's' : ''}${reset}`);
		lines.push(`  NOT READY — ${parts.join(', ')}`);
	}

	lines.push('');

	return lines.join('\n');
}

// ── CLI entry point ────────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
	path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
	const outputIdx = process.argv.indexOf('--output');
	const hubRoot = outputIdx !== -1
		? path.resolve(process.argv[outputIdx + 1])
		: process.cwd();

	const checks = await runChecks({ hubRoot });
	const useColor = Boolean(process.stdout.isTTY);
	process.stdout.write(formatReport(checks, useColor));
	process.exit(computeExitCode(checks));
}
