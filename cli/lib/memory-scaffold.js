/**
 * memory-scaffold.js — shared memory/<agent>.md starter content + create-if-absent write.
 *
 * Used by both deploy-time scaffolding (cli/lib/extras.js's deployExtras) and
 * doctor's auto-fix (cli/doctor.js's checkMemoryFiles) so starter content never
 * drifts between the two call sites.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Starter content for a freshly scaffolded memory/<agent>.md file.
 *
 * @param {string} agentId
 * @returns {string}
 */
export function memoryStarter(agentId) {
	return `# ${agentId} memory\n\n## HOT\n\n_(nothing yet)_\n\n## WARM\n\n## COLD\n`;
}

/**
 * Create memory/<agentId>.md under memoryRoot if it does not already exist.
 * Never overwrites an existing file — this is the one invariant call sites rely on.
 *
 * @param {object} options
 * @param {string} options.memoryRoot Absolute path to the hub's memory/ directory.
 * @param {string} options.agentId
 * @param {object} [options.fsMod] Injectable fs module for testability.
 * @returns {boolean} true if a file was scaffolded, false if it already existed.
 */
export function scaffoldMemoryFile({ memoryRoot, agentId, fsMod = fs }) {
	const memFile = path.join(memoryRoot, `${agentId}.md`);
	if (fsMod.existsSync(memFile)) return false;
	fsMod.mkdirSync(memoryRoot, { recursive: true });
	fsMod.writeFileSync(memFile, memoryStarter(agentId), 'utf-8');
	return true;
}
