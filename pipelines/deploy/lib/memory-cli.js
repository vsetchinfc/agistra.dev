/**
 * memory-cli.js — WAL memory-file scaffolding.
 *
 * The `dreaming` skill's Consolidation Rules previously described, in
 * prose, a scaffolding step every agent had to hand-execute on first touch
 * of a fresh hub: "if the live repo memory file does not exist, create it
 * with HOT / WARM / COLD headings" and "if the archive directory does not
 * exist, create memory/archive/". That step is identical every time — a
 * template write plus a directory-existence check, no judgment involved —
 * so it is implemented here as a standalone command rather than folded
 * into `task-cli.js` (kept a separate file/entry point deliberately, to
 * avoid colliding with concurrent work inside task-cli.js's own `runCli`).
 *
 * `ensure <agent>`:
 *   - Creates `memory/<agent>.md` with the `# <Agent> — Live Memory` +
 *     `## HOT` / `## WARM` / `## COLD` skeleton if it does not exist yet.
 *   - No-ops (never overwrites or truncates) if the file already exists.
 *   - Creates `memory/archive/` if it does not exist.
 *   - Idempotent: running it twice produces no diff on the second run.
 *
 * This intentionally does NOT perform any HOT/WARM/COLD compaction, decay,
 * or archival — that remains `dreaming`'s judgment-driven territory. This
 * command only covers the existence/skeleton step described above.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Capitalises the first letter of an agent id for the memory file title (architect -> Architect). */
function displayName(agentId) {
	if (!agentId) return agentId;
	return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function memorySkeleton(agentId) {
	return `# ${displayName(agentId)} — Live Memory\n\n## HOT\n\n## WARM\n\n## COLD\n`;
}

/**
 * Ensures `memory/<agent>.md` exists with the HOT/WARM/COLD skeleton and
 * that `memory/archive/` exists, without touching either if already
 * present. `repoRoot` defaults to cwd; `fsMod` is injectable for tests.
 */
export function ensureMemoryFile(agentId, { repoRoot = process.cwd(), fsMod = fs } = {}) {
	if (!agentId) {
		return { ok: false, error: 'agent id is required. Usage: memory ensure <agent>' };
	}

	const memoryDir = path.join(repoRoot, 'memory');
	const archiveDir = path.join(memoryDir, 'archive');
	const memoryFile = path.join(memoryDir, `${agentId}.md`);

	let memoryFileCreated = false;
	let archiveDirCreated = false;

	if (!fsMod.existsSync(memoryDir)) {
		fsMod.mkdirSync(memoryDir, { recursive: true });
	}

	if (!fsMod.existsSync(memoryFile)) {
		fsMod.writeFileSync(memoryFile, memorySkeleton(agentId), 'utf-8');
		memoryFileCreated = true;
	}

	if (!fsMod.existsSync(archiveDir)) {
		fsMod.mkdirSync(archiveDir, { recursive: true });
		archiveDirCreated = true;
	}

	return {
		ok: true,
		agent: agentId,
		memoryFile,
		archiveDir,
		memoryFileCreated,
		archiveDirCreated,
	};
}

export function runCli(argv, { repoRoot = process.cwd(), fsMod = fs } = {}) {
	const [cmd, ...rest] = argv;

	switch (cmd) {
		case 'ensure':
			return ensureMemoryFile(rest[0], { repoRoot, fsMod });
		default:
			return {
				ok: false,
				error: `unknown command: ${cmd ?? '(none)'}. Usage: memory <ensure> <agent>`,
			};
	}
}

const isMain = process.argv[1] &&
	path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
	let output;
	try {
		const argv = process.argv.slice(2);
		output = runCli(argv);
	} catch (err) {
		output = { ok: false, error: err.message };
	}
	process.stdout.write(JSON.stringify(output, null, 2) + '\n');
	process.exit(output.ok ? 0 : 1);
}
