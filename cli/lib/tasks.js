import fs from 'node:fs';
import path from 'node:path';

/**
 * Canonical set of task state tokens per ADR-005.
 * Used in filename patterns and state validation across CLI tools.
 */
export const TASK_STATE_TOKENS = [
	'todo',
	'in-progress',
	'ready-for-review',
	'ready-for-qa',
	'changes-requested',
	'qa-passed',
	'done',
];

function taskNum(filename) {
	const m = filename.match(/^task_(\d+)_/);
	return m ? parseInt(m[1], 10) : 0;
}

function listMdFiles(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

/** Project root for a task file (handles tasks already under projects/<name>/done/). */
export function projectDirFromTaskPath(taskPath) {
	const dir = path.dirname(taskPath);
	return path.basename(dir) === 'done' ? path.dirname(dir) : dir;
}

export function doneTasksDir(projectDir) {
	return path.join(projectDir, 'done');
}

/**
 * Parse YAML-like frontmatter from a markdown file.
 * Supports scalar string values and simple string arrays (  - item).
 * Returns { meta: object, body: string }
 */
export function parseFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { meta: {}, body: content };

	const meta = {};
	const lines = match[1].split(/\r?\n/);
	let currentArrayKey = null;

	for (const line of lines) {
		const arrayItem = line.match(/^\s{2,}- (.+)$/);
		const arrayStart = line.match(/^([\w-]+):\s*$/);
		const keyValue = line.match(/^([\w-]+):\s+(.+)$/);

		if (currentArrayKey && arrayItem) {
			meta[currentArrayKey].push(arrayItem[1].trim());
		} else if (arrayStart) {
			currentArrayKey = arrayStart[1];
			meta[currentArrayKey] = [];
		} else if (keyValue) {
			currentArrayKey = null;
			meta[keyValue[1]] = keyValue[2].trim();
		}
	}

	return { meta, body: match[2] };
}

/**
 * Find the lowest-numbered _todo task file in a project directory.
 * Returns the absolute file path, or null if none found.
 */
export function findCurrentTask(projectDir) {
	if (!fs.existsSync(projectDir)) return null;
	const files = fs.readdirSync(projectDir)
		.filter(f => f.match(/^task_\d+_todo_/))
		.sort((a, b) => taskNum(a) - taskNum(b));
	return files.length > 0 ? path.join(projectDir, files[0]) : null;
}

/**
 * List all project directories under projectsRoot with their pending/completed task counts.
 * Returns an array of { project, projectDir, todos: string[], inFlight: Array<{file, state}>, dones: string[] }
 * 
 * - todos: files in todo state only (auto-dispatchable)
 * - inFlight: files in intermediate states (in-progress, ready-for-review, ready-for-qa, changes-requested, qa-passed) with state token
 * - dones: files in done state (terminal)
 */
export function listAllTasks(projectsRoot) {
	if (!fs.existsSync(projectsRoot)) return [];
	return fs.readdirSync(projectsRoot, { withFileTypes: true })
		.filter(e => e.isDirectory())
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(e => {
			const projectDir = path.join(projectsRoot, e.name);
			const rootFiles = listMdFiles(projectDir);
			const doneFiles = listMdFiles(doneTasksDir(projectDir));
			const todos = rootFiles
				.filter(f => f.match(/^task_\d+_todo_/))
				.sort((a, b) => taskNum(a) - taskNum(b));
			const dones = [
				...rootFiles.filter(f => f.match(/^task_\d+_done_/)),
				...doneFiles.filter(f => f.match(/^task_\d+_done_/)),
			].sort((a, b) => taskNum(a) - taskNum(b));

			// Collect intermediate states with state token
			const intermediateStates = ['in-progress', 'ready-for-review', 'ready-for-qa', 'changes-requested', 'qa-passed'];
			const inFlight = [];
			for (const state of intermediateStates) {
				const matches = rootFiles.filter(f => f.includes(`_${state}_`));
				for (const file of matches) {
					inFlight.push({ file, state });
				}
			}
			inFlight.sort((a, b) => taskNum(a.file) - taskNum(b.file));

			return {
				project: e.name,
				projectDir,
				todos,
				inFlight,
				dones,
			};
		});
}

/**
 * Find a specific task by number or slug.
 * Matches any state token (todo, in-progress, ready-for-review, ready-for-qa, changes-requested, qa-passed, done).
 * e.g. query "6" matches "task_6_in-progress_feature.md"
 * Returns the absolute file path, or null if not found.
 */
export function findTaskByQuery(projectDir, query) {
	if (!fs.existsSync(projectDir)) return null;
	const files = fs.readdirSync(projectDir)
		.filter(f => f.match(/^task_\d+_(todo|in-progress|ready-for-review|ready-for-qa|changes-requested|qa-passed|done)_/));

	const num = parseInt(query, 10);
	if (!Number.isNaN(num)) {
		const byNum = files.find(f => taskNum(f) === num);
		if (byNum) return path.join(projectDir, byNum);
	}

	const needle = String(query).toLowerCase();
	const bySlug = files.find(f => f.toLowerCase().includes(needle));
	return bySlug ? path.join(projectDir, bySlug) : null;
}

/**
 * Load a skill's SKILL.md content.
 * Returns the file content string, or null if the skill directory or file doesn't exist.
 */
export function loadSkillContent(skillsRoot, skillName) {
	const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
	if (!fs.existsSync(skillPath)) return null;
	return fs.readFileSync(skillPath, 'utf-8');
}

/**
 * Map lifecycle state to filename token.
 * Per ADR-005 state vocabulary.
 * Throws on unknown state to prevent silent bugs.
 */
function stateToToken(state) {
	const map = {
		'state:ready-for-implementation': 'todo',
		'state:in-progress': 'in-progress',
		'state:ready-for-review': 'ready-for-review',
		'state:ready-for-qa': 'ready-for-qa',
		'state:changes-requested': 'changes-requested',
		'state:qa-passed': 'qa-passed',
		'closed': 'done',
	};
	if (!map[state]) {
		throw new Error(`Unknown lifecycle state: ${state}. Valid states: ${Object.keys(map).join(', ')}`);
	}
	return map[state];
}

/**
 * Serialize frontmatter object to YAML-like string.
 */
function serializeFrontmatter(meta) {
	const lines = [];
	for (const [key, value] of Object.entries(meta)) {
		if (Array.isArray(value)) {
			lines.push(`${key}:`);
			for (const item of value) {
				lines.push(`  - ${item}`);
			}
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	return lines.join('\n');
}

/**
 * Change a task's lifecycle state, updating both frontmatter and filename atomically.
 * 
 * @param {string} taskPath - Current task file path
 * @param {string} [targetState] - New lifecycle state (e.g., 'state:in-progress'). Defaults to 'closed' for backward compatibility.
 * @param {object} [frontmatterUpdates] - Additional frontmatter fields to update (e.g., { 'fail-count': 1 })
 * @returns {string} New task file path
 * 
 * Legacy behavior (backward compatible):
 * - changeTaskStatus(path) → moves _todo_ to done/_done_
 * 
 * New behavior:
 * - changeTaskStatus(path, 'state:in-progress') → renames to _in-progress_ and updates frontmatter status
 * - changeTaskStatus(path, 'state:ready-for-qa', { 'fail-count': 1 }) → updates both status and fail-count
 */
export function changeTaskStatus(taskPath, targetState = 'closed', frontmatterUpdates = {}) {
	const projectDir = projectDirFromTaskPath(taskPath);
	const raw = fs.readFileSync(taskPath, 'utf-8');
	const { meta, body } = parseFrontmatter(raw);

	// Update frontmatter
	meta.status = targetState;
	for (const [key, value] of Object.entries(frontmatterUpdates)) {
		meta[key] = String(value);
	}

	// Determine new filename token
	const token = stateToToken(targetState);
	const basename = path.basename(taskPath);
	const match = basename.match(/^(task_\d+)_(todo|in-progress|ready-for-review|ready-for-qa|changes-requested|qa-passed|done)_(.+)$/);
	if (!match) {
		throw new Error(`Task filename does not match expected pattern: ${basename}`);
	}
	const [, prefix, , slug] = match;
	const newBasename = `${prefix}_${token}_${slug}`;

	// Determine target directory (done/ for terminal states, project root otherwise)
	let targetDir = projectDir;
	if (token === 'done') {
		targetDir = doneTasksDir(projectDir);
		fs.mkdirSync(targetDir, { recursive: true });
	}

	const newPath = path.join(targetDir, newBasename);

	// Write atomically: update content, then rename
	const newContent = `---\n${serializeFrontmatter(meta)}\n---\n${body}`;
	fs.writeFileSync(taskPath, newContent, 'utf-8');
	if (taskPath !== newPath) {
		fs.renameSync(taskPath, newPath);
	}

	return newPath;
}

/**
 * Build a focused dispatch prompt for a task file.
 * Skills declared in the frontmatter are listed by name only — the agent loads
 * them from its profile on demand rather than having content inlined here.
 *
 * Returns { meta, model, taskName, injectedSkills, missingSkills, prompt }
 */
export function buildDispatchPrompt(taskPath, skillsRoot) {
	const raw = fs.readFileSync(taskPath, 'utf-8');
	const { meta, body } = parseFrontmatter(raw);

	const skills = Array.isArray(meta.skills) ? meta.skills : [];
	const knownSkills = [];
	const missingSkills = [];

	for (const skillName of skills) {
		if (loadSkillContent(skillsRoot, skillName)) {
			knownSkills.push(skillName);
		} else {
			missingSkills.push(skillName);
		}
	}

	const agentLabel = [meta.agent, meta.mode].filter(Boolean).join(' / ');
	const model = meta.model ?? 'claude-sonnet-4-6';
	const githubLine = meta.github ? `\n**GitHub:** \`${meta.github}\`` : '';
	const taskName = path.basename(taskPath);
	const skillsSummary = skills.length > 0 ? skills.join(', ') : 'none';
	const missingSummary = missingSkills.length > 0
		? ` | **Unknown skills:** ${missingSkills.join(', ')}`
		: '';

	const header =
		`<!-- DISPATCH -->\n` +
		`**Agent:** ${agentLabel || 'unspecified'} | **Model:** \`${model}\`${githubLine}\n` +
		`**Task:** \`${taskName}\`\n` +
		`**Skills required:** ${skillsSummary}${missingSummary}\n\n` +
		`---\n\n`;

	return {
		meta,
		model,
		taskName,
		injectedSkills: knownSkills,
		missingSkills,
		prompt: header + body,
	};
}
