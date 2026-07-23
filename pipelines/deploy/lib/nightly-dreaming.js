/**
 * Nightly dreaming auto-trigger — Windows Scheduled Task registration.
 *
 * Registers an opt-in nightly Windows Scheduled Task that invokes headless Claude Code
 * with a directive prompt that triggers the `dreaming` skill's end-of-day memory
 * consolidation, reusing the exact invocation pattern already proven by the Telegram
 * relay daemon's Router auto-dispatch (see relay/adapters/claude-code.js's
 * dispatchRouter(), which spawns `claude -p "<prompt>" --model claude-haiku-4-5-20251001`
 * with `cwd: hubRoot`).
 *
 * Windows-only for v1 (task_208 / issue #381) — Mac/Linux (cron/launchd) deferred.
 *
 * **Prompt wording (task_213 / issue #389):** the original v1 prompt was a bare
 * `"Good night Team"`, which reliably fails in a cold, non-interactive session — reproduced
 * directly (not guessed): `cmd.exe /c claude -p "Good night Team" --model
 * claude-haiku-4-5-20251001` returns a generic "Good night! Rest well." with zero tool
 * calls and zero file reads. The bare phrase only works interactively because the user has
 * usually already addressed an agent by name first, which pulls CLAUDE.md's Startup Rule
 * (and from there the `dreaming` skill's trigger-phrase catalogue) into active play. A cold
 * headless turn with no prior context has nothing to anchor "Good night Team" to an agent
 * identity, so the model treats it as generic small talk instead. The fix addresses the
 * prompt to Architect by name (the same entity `agents/skills/dreaming/SKILL.md`'s own
 * "Dispatch behaviour" section documents as owning the full-team consolidation cascade when
 * it receives the trigger directly) and adds an explicit non-interactive directive so the
 * model performs real file reads/writes instead of only replying in words. Proven via a
 * real, unmocked end-to-end run against a scratch hub copy (see PR description) — an actual
 * memory file was rewritten with genuine current-state content, not just an exit-0 process.
 *
 * **Permission mode (task_213 / issue #389):** memory consolidation is all file-writing
 * tool calls, and a Scheduled Task run has no TTY and nobody present at 2am to approve a
 * permission prompt — those writes would otherwise be silently blocked. `claude --help`
 * documents `--permission-mode bypassPermissions` for exactly this non-interactive case;
 * it is now included in the registered task's Arguments alongside the directive prompt.
 *
 * Registration uses a full Task Scheduler XML definition (not the simple
 * `schtasks /create /tr "..."` command-line form). The XML schema's <WorkingDirectory>
 * element is the only schtasks-supported way to set the task's real "Start in" directory —
 * the simple command-line form has no equivalent switch. Getting this right matters: the
 * Working Directory Verification protocol in agent-foundations depends on `claude -p`
 * resolving `.claude/agents/` from the hub root, not from whatever directory Task
 * Scheduler happens to default to (typically %SystemRoot%\System32).
 *
 * The Exec action's Command is `cmd.exe` (not `claude` directly) with `/c claude ...` as
 * Arguments. This mirrors the exact reason lib/claude-cli.js's claudeSpawnShell() spawns
 * `claude` with `shell: true` on Windows: `claude` is an npm-installed `.cmd` shim, and
 * Task Scheduler's CreateProcess-based Exec action does not perform the PATHEXT/.cmd
 * resolution an interactive shell performs. Routing through `cmd.exe /c` reproduces that
 * resolution exactly.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

export const NIGHTLY_DREAMING_TASK_NAME = 'AgistraDevNightlyDreaming';
export const DEFAULT_NIGHTLY_DREAMING_TIME = '02:00';
export const NIGHTLY_DREAMING_MODEL = 'claude-haiku-4-5-20251001';
// Addressed to Architect by name (required for the cold-session CLAUDE.md Startup Rule to
// fire at all) plus an explicit non-interactive directive (required so the model performs
// real file reads/writes instead of a conversational acknowledgement). See the file header
// comment above for the full root-cause writeup and real E2E proof (task_213 / issue #389).
export const NIGHTLY_DREAMING_PROMPT =
	'Architect, Good night Team. Run the dreaming skill end-of-day memory consolidation now. ' +
	'This is an unattended automated run, not interactive chat -- actually perform the file ' +
	'reads and writes yourself, do not just acknowledge in words.';
// Non-interactive permission mode — nobody is present overnight to approve a permission
// prompt for the file-writing tool calls consolidation requires (task_213 / issue #389).
export const NIGHTLY_DREAMING_PERMISSION_MODE = 'bypassPermissions';

/**
 * Minimal XML text escaping for the values interpolated into the task definition
 * (hub path, prompt text). Task names/models are internal constants, not user input,
 * but hubRoot is a real filesystem path that may legitimately contain `&` or similar.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Today's date as a local (not UTC) YYYY-MM-DD string. Used as the CalendarTrigger's
 * StartBoundary date component — using `toISOString()` (UTC) here could shift the
 * first-occurrence date by one day in some timezones near local midnight; the daily
 * recurrence itself is unaffected either way, but the local date is the correct value.
 *
 * @param {Date} [d]
 * @returns {string}
 */
export function localDateString(d = new Date()) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * Build the Task Scheduler XML definition for the nightly dreaming task.
 *
 * @param {object} opts
 * @param {string} opts.hubRoot     Absolute hub root — becomes the task's WorkingDirectory
 *   ("Start in"). Required.
 * @param {string} [opts.time]      Local HH:MM start time (24h). Defaults to an off-peak time.
 * @param {string} [opts.startDate] YYYY-MM-DD for the trigger's StartBoundary date component
 *   (the task recurs daily thereafter regardless of this date). Defaults to today (local).
 * @param {string} [opts.model]
 * @param {string} [opts.prompt]
 * @param {string} [opts.permissionMode]  Non-interactive permission mode (see file header
 *   comment — file-writing tool calls need this with nobody present to approve them).
 * @returns {string} XML document text (CRLF line endings, as Windows tooling expects).
 */
export function buildNightlyDreamingTaskXml({
	hubRoot,
	time = DEFAULT_NIGHTLY_DREAMING_TIME,
	startDate = localDateString(),
	model = NIGHTLY_DREAMING_MODEL,
	prompt = NIGHTLY_DREAMING_PROMPT,
	permissionMode = NIGHTLY_DREAMING_PERMISSION_MODE,
}) {
	if (!hubRoot) {
		throw new Error('buildNightlyDreamingTaskXml: hubRoot is required');
	}
	const startBoundary = `${startDate}T${time}:00`;
	const args = `/c claude -p "${prompt}" --model ${model} --permission-mode ${permissionMode}`;
	return [
		'<?xml version="1.0" encoding="UTF-16"?>',
		'<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">',
		'  <RegistrationInfo>',
		'    <Description>Agistra Dev nightly end-of-day memory consolidation ("Good night Team"). Opt-in, registered by npm run setup (task_208 / issue #381).</Description>',
		'  </RegistrationInfo>',
		'  <Triggers>',
		'    <CalendarTrigger>',
		`      <StartBoundary>${escapeXml(startBoundary)}</StartBoundary>`,
		'      <Enabled>true</Enabled>',
		'      <ScheduleByDay>',
		'        <DaysInterval>1</DaysInterval>',
		'      </ScheduleByDay>',
		'    </CalendarTrigger>',
		'  </Triggers>',
		'  <Principals>',
		'    <Principal id="Author">',
		'      <LogonType>InteractiveToken</LogonType>',
		'      <RunLevel>LeastPrivilege</RunLevel>',
		'    </Principal>',
		'  </Principals>',
		'  <Settings>',
		'    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>',
		'    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>',
		'    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>',
		'    <StartWhenAvailable>true</StartWhenAvailable>',
		'    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>',
		'    <AllowHardTerminate>true</AllowHardTerminate>',
		'    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>',
		'    <Enabled>true</Enabled>',
		'  </Settings>',
		'  <Actions Context="Author">',
		'    <Exec>',
		'      <Command>cmd.exe</Command>',
		`      <Arguments>${escapeXml(args)}</Arguments>`,
		`      <WorkingDirectory>${escapeXml(hubRoot)}</WorkingDirectory>`,
		'    </Exec>',
		'  </Actions>',
		'</Task>',
		'',
	].join('\r\n');
}

/**
 * Check whether the nightly dreaming Scheduled Task is currently registered.
 *
 * @param {object} [opts]
 * @param {string} [opts.taskName]
 * @param {function} [opts.execFn]  Injectable execFileSync for testing.
 * @returns {boolean}
 */
export function isNightlyDreamingTaskRegistered({
	taskName = NIGHTLY_DREAMING_TASK_NAME,
	execFn = execFileSync,
} = {}) {
	try {
		execFn('schtasks', ['/query', '/tn', taskName], { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Query the live registered task definition back from Task Scheduler as XML.
 * Used for real end-to-end verification (confirming what Windows actually persisted,
 * not just what this module attempted to write) and is also useful for QA/Tester.
 *
 * @param {object} [opts]
 * @param {string} [opts.taskName]
 * @param {function} [opts.execFn]
 * @returns {string|null}  XML text, or null if the task is not registered / query failed.
 */
export function queryNightlyDreamingTaskXml({
	taskName = NIGHTLY_DREAMING_TASK_NAME,
	execFn = execFileSync,
} = {}) {
	try {
		const raw = execFn('schtasks', ['/query', '/tn', taskName, '/xml', 'ONE'], {
			stdio: 'pipe',
			encoding: 'utf-8',
		});
		return raw?.toString ? raw.toString() : raw;
	} catch {
		return null;
	}
}

/**
 * Register the nightly dreaming Scheduled Task. Idempotent — `/f` forces overwrite of
 * an existing task with the same name, so re-running setup with a changed hub path (or
 * simply re-confirming the opt-in) safely replaces the prior definition rather than
 * erroring on a name collision.
 *
 * @param {object} opts
 * @param {string} opts.hubRoot
 * @param {string} [opts.taskName]
 * @param {string} [opts.time]
 * @param {function} [opts.execFn]   Injectable execFileSync for testing.
 * @param {object}   [opts.fsMod]    Injectable fs module for testing.
 * @param {string}   [opts.tmpDir]   Directory to stage the XML definition file in.
 * @returns {{ ok: boolean, error?: string, xmlPath?: string }}
 */
export function registerNightlyDreamingTask({
	hubRoot,
	taskName = NIGHTLY_DREAMING_TASK_NAME,
	time = DEFAULT_NIGHTLY_DREAMING_TIME,
	execFn = execFileSync,
	fsMod = fs,
	tmpDir = os.tmpdir(),
} = {}) {
	if (!hubRoot) {
		return { ok: false, error: 'hubRoot is required' };
	}
	let xml;
	try {
		xml = buildNightlyDreamingTaskXml({ hubRoot, time });
	} catch (err) {
		return { ok: false, error: err.message };
	}
	// This XML temp-file path is always Windows-style (schtasks is Windows-only), so use
	// path.win32 explicitly rather than the OS-native path module — on a non-Windows CI
	// runner, plain path.join would treat the drive-letter-prefixed tmpDir as an opaque
	// POSIX segment and join it with a forward slash, producing a mixed-separator path
	// that never matches the Windows-style path schtasks/tests expect (task_208 Gap 1).
	const xmlPath = path.win32.join(tmpDir, `${taskName}.xml`);
	try {
		// schtasks requires the XML definition file to be Unicode (UTF-16) AND
		// requires a byte-order-mark to reliably detect that encoding — without the
		// BOM, schtasks misreads the file and fails with a confusing "task XML is
		// malformed... one root element" error even though the text content is
		// perfectly valid XML. Node's 'utf16le' encoding does not add a BOM on its
		// own, so it is prepended explicitly here (U+FEFF encodes to the correct
		// 0xFF 0xFE byte pair in UTF-16LE).
		const BOM = String.fromCharCode(0xfeff);
		fsMod.writeFileSync(xmlPath, BOM + xml, { encoding: 'utf16le' });
	} catch (err) {
		return { ok: false, error: `could not write task XML: ${err.message}` };
	}
	try {
		execFn('schtasks', ['/create', '/tn', taskName, '/xml', xmlPath, '/f'], { stdio: 'pipe' });
		return { ok: true, xmlPath };
	} catch (err) {
		return { ok: false, error: err.message ?? String(err), xmlPath };
	} finally {
		try {
			fsMod.unlinkSync(xmlPath);
		} catch {
			// best-effort cleanup — schtasks has already read the file by this point
		}
	}
}

/**
 * Remove the nightly dreaming Scheduled Task, if registered. Never errors when the task
 * is already absent — that is treated as a successful no-op, matching the "safe-degrade"
 * convention used elsewhere in this codebase for optional/already-satisfied state.
 *
 * @param {object} [opts]
 * @param {string} [opts.taskName]
 * @param {function} [opts.execFn]
 * @returns {{ ok: boolean, removed: boolean, error?: string }}
 */
export function removeNightlyDreamingTask({
	taskName = NIGHTLY_DREAMING_TASK_NAME,
	execFn = execFileSync,
} = {}) {
	if (!isNightlyDreamingTaskRegistered({ taskName, execFn })) {
		return { ok: true, removed: false };
	}
	try {
		execFn('schtasks', ['/delete', '/tn', taskName, '/f'], { stdio: 'pipe' });
		return { ok: true, removed: true };
	} catch (err) {
		return { ok: false, removed: false, error: err.message ?? String(err) };
	}
}
