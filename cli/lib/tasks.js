import fs from 'node:fs';
import path from 'node:path';

function taskNum(filename) {
	const m = filename.match(/^task_(\d+)_/);
	return m ? parseInt(m[1], 10) : 0;
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
 * Returns an array of { project, projectDir, todos: string[], dones: string[] }
 */
export function listAllTasks(projectsRoot) {
	if (!fs.existsSync(projectsRoot)) return [];
	return fs.readdirSync(projectsRoot, { withFileTypes: true })
		.filter(e => e.isDirectory())
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(e => {
			const projectDir = path.join(projectsRoot, e.name);
			const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md')).sort((a, b) => taskNum(a) - taskNum(b));
			return {
				project: e.name,
				projectDir,
				todos: files.filter(f => f.match(/^task_\d+_todo_/)),
				dones: files.filter(f => f.match(/^task_\d+_done_/)),
			};
		});
}

/**
 * Find a specific _todo task by number.
 * e.g. query "6" matches "task_6_todo.md"
 * Returns the absolute file path, or null if not found.
 */
export function findTaskByQuery(projectDir, query) {
	if (!fs.existsSync(projectDir)) return null;
	const num = parseInt(query, 10);
	const files = fs.readdirSync(projectDir)
		.filter(f => f.match(/^task_\d+_todo_/));
	const match = files.find(f => taskNum(f) === num);
	return match ? path.join(projectDir, match) : null;
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
 * Rename a task file from _todo to _done in place.
 * Returns the new (done) file path.
 */
export function changeTaskStatus(taskPath) {
	const donePath = taskPath.replace('_todo_', '_done_');
	fs.renameSync(taskPath, donePath);
	return donePath;
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
