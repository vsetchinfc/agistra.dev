#!/usr/bin/env node
/**
 * Workspace setup wizard.
 *
 * Collects user / org / agent configuration and writes a gitignored
 * workspace.config.json to the target output directory.
 *
 * Run from the source repo:   npm run setup "D:/path/to/hub"
 * Run from a deployed hub:    npm run setup
 */
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
	const result = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const next = argv[i + 1];
			result[key] = (next && !next.startsWith('--')) ? next : true;
			if (next && !next.startsWith('--')) i++;
		}
	}
	return result;
}

const args = parseArgs(process.argv.slice(2));
const outputRoot = args.output ? path.resolve(args.output) : path.resolve('.');

const rl = readline.createInterface({ input, output });

function ask(question, defaultValue = '') {
	const hint = defaultValue ? ` [${defaultValue}]` : '';
	return rl.question(`${question}${hint}: `).then(a => a.trim() || defaultValue);
}

function askYN(question, defaultYes = false) {
	const hint = defaultYes ? ' [Y/n]' : ' [y/N]';
	return rl.question(`${question}${hint}: `).then(a => {
		const v = a.trim().toLowerCase();
		if (!v) return defaultYes;
		return v === 'y' || v === 'yes';
	});
}

function line(label = '') {
	const dashes = '─'.repeat(Math.max(0, 44 - label.length));
	process.stdout.write(`\n── ${label}${dashes}\n\n`);
}

async function run() {
	process.stdout.write('\n╔══════════════════════════════════════════════╗\n');
	process.stdout.write('║           Agent Workspace Setup              ║\n');
	process.stdout.write('╚══════════════════════════════════════════════╝\n');

	line('You ');
	const userName = await ask('Your name');
	const userRole = await ask('Your role (e.g. Technical Lead)', 'Technical Lead');

	line('Organisation ');
	const orgName = await ask('Organisation or team name');

	line('Remote team ');
	const hasRemoteTeam = await askYN('Do you work with a remote team?', false);

	let remoteTeam = { enabled: false };
	if (hasRemoteTeam) {
		const remoteTeamName  = await ask('Remote team name',  'Remote Team');
		const remoteAgentName = await ask('Remote agent name', 'Remote Agent');
		remoteTeam = { enabled: true, name: remoteTeamName, agentName: remoteAgentName };
	}

	rl.close();

	const config = {
		user: { name: userName, role: userRole },
		org: orgName,
		remoteTeam,
	};

	fs.mkdirSync(outputRoot, { recursive: true });

	const configPath = path.join(outputRoot, 'workspace.config.json');
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

	// Warn if .gitignore does not cover the config file
	const gitignorePath = path.join(outputRoot, '.gitignore');
	let gitignoreCovers = false;
	if (fs.existsSync(gitignorePath)) {
		const gi = fs.readFileSync(gitignorePath, 'utf-8');
		gitignoreCovers = gi.split('\n').some(l => l.trim() === 'workspace.config.json');
	}

	line('Done ');
	process.stdout.write(`  Config written → ${configPath}\n`);

	if (!gitignoreCovers) {
		process.stdout.write('\n  WARNING: workspace.config.json is not listed in .gitignore.\n');
		process.stdout.write('  Add the following line to prevent committing personal config:\n\n');
		process.stdout.write('    workspace.config.json\n');
	}

	if (!remoteTeam.enabled) {
		process.stdout.write('\n  Remote team disabled — Router will run in minimal mode.\n');
		process.stdout.write('  Re-run setup and enable remote team to unlock relay skills.\n');
	}

	process.stdout.write('\n');
}

run().catch(err => {
	rl.close();
	process.stderr.write(err.message + '\n');
	process.exit(1);
});
