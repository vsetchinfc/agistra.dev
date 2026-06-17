/**
 * Model resolution helpers — read agent manifests to get the correct model for each agent.
 *
 * Router always uses the economy-tier model (Haiku) regardless of platform defaults.
 * Architect, Builder, and Tester use Sonnet (the default Claude model).
 * This module provides the authoritative model lookup so auto-dispatch and doctor
 * always agree on the expected model rather than each maintaining its own constant.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROUTER_MANIFEST_REL = path.join('profiles', 'router-workspace', 'agent.manifest.json');

/**
 * Read the Router model from the router-workspace manifest.
 *
 * When the manifest is absent and `hubRoot` is provided, falls back to reading the
 * model from the deployed profile at `hubRoot/.claude/agents/router.md` frontmatter.
 * Fails loudly (throws) only when both the manifest and the fallback profile are
 * missing or yield no model.
 *
 * @param {string} profilesRoot  Absolute path to the setchin-agent-profiles repo root.
 * @param {typeof fs} [fsMod]    Injectable fs module for testing.
 * @param {string} [hubRoot]     Absolute hub root — used as fallback profile location.
 * @returns {string}  The model id, e.g. 'claude-haiku-4-5-20251001'.
 */
export function resolveRouterModel(profilesRoot, fsMod = fs, hubRoot) {
	const manifestPath = path.join(profilesRoot, ROUTER_MANIFEST_REL);

	if (!fsMod.existsSync(manifestPath)) {
		// Manifest absent — attempt fallback to deployed router profile.
		if (hubRoot) {
			const profilePath = path.join(hubRoot, '.claude', 'agents', 'router.md');
			if (fsMod.existsSync(profilePath)) {
				const content = fsMod.readFileSync(profilePath, 'utf-8');
				const model = parseProfileModel(content);
				if (model) return model;
			}
		}
		throw new Error(
			`Router manifest not found: ${manifestPath}\n` +
			'Run from the setchin-agent-profiles repo root.',
		);
	}

	let manifest;
	try {
		manifest = JSON.parse(fsMod.readFileSync(manifestPath, 'utf-8'));
	} catch {
		throw new Error(`Router manifest is not valid JSON: ${manifestPath}`);
	}

	const model = manifest?.claude?.model;
	if (!model) {
		throw new Error(
			`claude.model missing in router manifest: ${manifestPath}\n` +
			'Add "claude": { "model": "claude-haiku-..." } to the manifest.',
		);
	}

	return model;
}

/**
 * Parse the model field from an agent profile frontmatter string.
 * Returns null when the field is absent or unparseable.
 *
 * @param {string} content  Full text of a .md agent profile.
 * @returns {string | null}
 */
export function parseProfileModel(content) {
	const match = (content ?? '').match(/^---[\s\S]*?^model:\s*(\S+)/m);
	return match ? match[1] : null;
}
