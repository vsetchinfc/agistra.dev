import fs from 'node:fs';
import path from 'node:path';
import { scanProject, loadHealth, saveHealth, generateTasks } from './lib/scanner.js';

const SCORE_BAR = (s) => {
	const filled = Math.round(s * 10);
	return '█'.repeat(filled) + '░'.repeat(10 - filled);
};

const TREND = (t) => {
	if (t === null || t === undefined) return '';
	if (t > 0) return ` ▲${t.toFixed(2)}`;
	if (t < 0) return ` ▼${Math.abs(t).toFixed(2)}`;
	return ' →';
};

/**
 * Scan a project directory for quality issues and generate task files.
 *
 * Options:
 *   projectRoot   string   absolute path to the project repo to scan
 *   projectName   string   name of the project (used in filenames and content)
 *   projectsDir   string   absolute path to the projects/<name>/ queue directory
 *   dryRun        boolean  print what would be written without writing files
 */
export function scan({ projectRoot, projectName, projectsDir, dryRun = false }) {
	if (!projectRoot || !projectName) {
		process.stderr.write('[scan] --project <name> is required\n');
		process.exit(1);
	}

	process.stderr.write(`[scan] scanning ${projectRoot}\n\n`);

	const { perspectives, overall, allFindings } = scanProject({ projectDir: projectRoot });

	// Load previous health for trend comparison
	const prev = loadHealth(projectsDir);

	// Print perspective scores
	if (perspectives.length > 0) {
		console.log('Perspective Scores');
		console.log('─'.repeat(50));
		for (const p of perspectives) {
			const prevScore = prev?.perspectives?.[p.id]?.score ?? null;
			const trend = prevScore !== null ? p.score - prevScore : null;
			const flag = p.score === Math.min(...perspectives.map(x => x.score)) ? ' ← lowest' : '';
			console.log(`  ${p.id.toUpperCase().padEnd(4)} ${p.name.padEnd(12)} ${SCORE_BAR(p.score)}  ${p.score.toFixed(2)}${TREND(trend)}${flag}`);
		}
		const prevOverall = prev?.overall ?? null;
		const overallTrend = prevOverall !== null ? overall - prevOverall : null;
		console.log('─'.repeat(50));
		console.log(`       ${'Overall'.padEnd(12)} ${SCORE_BAR(overall)}  ${overall.toFixed(2)}${TREND(overallTrend)}`);
		console.log();
	}

	if (allFindings.length === 0) {
		console.log('No issues found — project looks healthy.');
		if (!dryRun && perspectives.length > 0) saveHealth(projectsDir, projectName, perspectives, overall);
		return;
	}

	console.log(`Found ${allFindings.length} issue(s):\n`);
	for (const f of allFindings) {
		console.log(`  [${f.priority.toUpperCase().padEnd(8)}] ${f.title}`);
	}

	const tasks = generateTasks({ allFindings, projectName, projectsDir });

	if (tasks.length === 0) {
		console.log('\nAll issues already have task files — nothing new to create.');
	} else {
		console.log(`\n${dryRun ? 'Would create' : 'Creating'} ${tasks.length} task(s):\n`);
		fs.mkdirSync(projectsDir, { recursive: true });
		for (const { filename, content } of tasks) {
			console.log(`  → ${filename}`);
			if (!dryRun) fs.writeFileSync(path.join(projectsDir, filename), content, 'utf-8');
		}
	}

	if (!dryRun) {
		saveHealth(projectsDir, projectName, perspectives, overall);
		if (tasks.length > 0) {
			console.log(`\nRun "node cli/index.js dispatch --list" to see the updated queue.`);
		}
	}
}
