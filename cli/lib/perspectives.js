import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const IGNORE = new Set(['node_modules', '.git', 'dist', 'out', 'build', 'coverage', '.vscode-test']);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py']);
const MAX_FILE_LINES = 300;
const MAX_DIR_FILES = 20;

// ── helpers ───────────────────────────────────────────────────────────────────

function r(n) { return Math.round(n * 100) / 100; }

function walkDir(dir, fn) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (IGNORE.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walkDir(full, fn);
		else fn(full);
	}
}

function countLines(filePath) {
	try { return fs.readFileSync(filePath, 'utf-8').split('\n').length; }
	catch { return 0; }
}

function collectSourceFiles(root) {
	const files = [];
	walkDir(root, f => { if (SOURCE_EXTS.has(path.extname(f))) files.push(f); });
	return files;
}

// ── SYS: System / Architecture ────────────────────────────────────────────────

export function analyzeSys(root) {
	const allFiles = collectSourceFiles(root);
	const dirCounts = {};
	let largeCount = 0;

	for (const f of allFiles) {
		const dir = path.dirname(f);
		dirCounts[dir] = (dirCounts[dir] || 0) + 1;
		if (countLines(f) > MAX_FILE_LINES) largeCount++;
	}

	const findings = [];

	const complexityScore = allFiles.length > 0 ? 1 - largeCount / allFiles.length : 1;
	if (largeCount > 0) {
		findings.push({
			id: 'sys-large-files',
			priority: largeCount > 3 ? 'high' : 'medium',
			title: `Refactor ${largeCount} oversized file(s)`,
			description: `${largeCount} source file(s) exceed ${MAX_FILE_LINES} lines. Large files increase coupling and reduce comprehension.`,
			skill: 'scan-sys', agent: 'architect', mode: 'architecture',
		});
	}

	const dirs = Object.values(dirCounts);
	const overloaded = dirs.filter(n => n > MAX_DIR_FILES).length;
	const cohesionScore = dirs.length > 0 ? 1 - overloaded / dirs.length : 1;
	if (overloaded > 0) {
		findings.push({
			id: 'sys-overloaded-dirs',
			priority: 'medium',
			title: `Split ${overloaded} overloaded director(ies)`,
			description: `${overloaded} director(ies) hold more than ${MAX_DIR_FILES} source files. Extract into focused sub-modules.`,
			skill: 'scan-sys', agent: 'architect', mode: 'architecture',
		});
	}

	const hasTs = allFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
	const hasTsConfig = fs.existsSync(path.join(root, 'tsconfig.json'));
	const hasCi = fs.existsSync(path.join(root, '.github', 'workflows'));
	const infraScore = ((hasTs ? (hasTsConfig ? 1 : 0) : 1) + (hasCi ? 1 : 0)) / 2;

	if (hasTs && !hasTsConfig) {
		findings.push({
			id: 'sys-no-tsconfig',
			priority: 'high',
			title: 'Add tsconfig.json',
			description: 'TypeScript files found but no tsconfig.json. Strict type checking prevents whole classes of runtime bugs.',
			skill: 'scan-sys', agent: 'builder', mode: 'engineering',
		});
	}
	if (!hasCi) {
		findings.push({
			id: 'sys-no-ci',
			priority: 'medium',
			title: 'Add CI/CD pipeline',
			description: 'No .github/workflows/ directory found. Automated checks catch regressions before they ship.',
			skill: 'scan-sys', agent: 'architect', mode: 'architecture',
		});
	}

	return { id: 'sys', name: 'System', score: r((complexityScore + cohesionScore + infraScore) / 3), findings };
}

// ── TST: Test ─────────────────────────────────────────────────────────────────

export function analyzeTst(root) {
	const TEST_PATTERNS = [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /^test_.*\.py$/, /.*_test\.py$/];
	const allFiles = collectSourceFiles(root);
	const testFiles = allFiles.filter(f => TEST_PATTERNS.some(p => p.test(path.basename(f))));
	const sourceFiles = allFiles.filter(f => !TEST_PATTERNS.some(p => p.test(path.basename(f))));

	let hasTestScript = false;
	const pkgPath = path.join(root, 'package.json');
	if (fs.existsSync(pkgPath)) {
		try { hasTestScript = !!JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).scripts?.test; } catch {}
	}

	const findings = [];

	if (testFiles.length === 0) {
		findings.push({
			id: 'tst-no-tests',
			priority: 'critical',
			title: 'Create test suite',
			description: 'No test files found. Tests are the primary regression safety net.',
			skill: 'scan-tst', agent: 'tester', mode: 'qa',
		});
		return { id: 'tst', name: 'Test', score: 0.0, findings };
	}

	const ratio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 1;
	const ratioScore = Math.min(ratio / 0.5, 1.0);
	if (ratio < 0.5) {
		findings.push({
			id: 'tst-low-coverage',
			priority: 'high',
			title: 'Increase test coverage',
			description: `${testFiles.length} test files for ${sourceFiles.length} source files (${Math.round(ratio * 100)}%). Target: ≥50% file coverage.`,
			skill: 'scan-tst', agent: 'tester', mode: 'qa',
		});
	}

	if (!hasTestScript) {
		findings.push({
			id: 'tst-no-script',
			priority: 'high',
			title: 'Add test script to package.json',
			description: 'No scripts.test defined. CI and contributors cannot verify the build.',
			skill: 'scan-tst', agent: 'tester', mode: 'qa',
		});
	}

	return { id: 'tst', name: 'Test', score: r((ratioScore + (hasTestScript ? 1 : 0)) / 2), findings };
}

// ── USR: User / Product ───────────────────────────────────────────────────────

export function analyzeUsr(root) {
	const findings = [];

	const readmePath = path.join(root, 'README.md');
	let readmeScore = 0;
	if (fs.existsSync(readmePath)) {
		const len = fs.readFileSync(readmePath, 'utf-8').length;
		readmeScore = Math.min(len / 2000, 1.0);
		if (len < 500) {
			findings.push({
				id: 'usr-readme-thin',
				priority: 'high',
				title: 'Expand README',
				description: `README is only ${len} chars. Add installation, usage examples, and feature descriptions (target: 2000+ chars).`,
				skill: 'scan-usr', agent: 'builder', mode: 'engineering',
			});
		}
	} else {
		findings.push({
			id: 'usr-no-readme',
			priority: 'critical',
			title: 'Create README.md',
			description: 'No README found. Users cannot discover what this project does or how to use it.',
			skill: 'scan-usr', agent: 'builder', mode: 'engineering',
		});
	}

	let descScore = 1.0;
	const pkgPath = path.join(root, 'package.json');
	if (fs.existsSync(pkgPath)) {
		try {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
			if (!pkg.description) {
				descScore = 0.0;
				findings.push({
					id: 'usr-no-description',
					priority: 'medium',
					title: 'Add package.json description',
					description: 'The description field is missing. npm search and registries rely on it.',
					skill: 'scan-usr', agent: 'builder', mode: 'engineering',
				});
			}
		} catch {}
	}

	const hasChangelog = fs.existsSync(path.join(root, 'CHANGELOG.md')) || fs.existsSync(path.join(root, 'CHANGELOG'));
	const changelogScore = hasChangelog ? 1.0 : 0.5;

	return { id: 'usr', name: 'User', score: r((readmeScore + descScore + changelogScore) / 3), findings };
}

// ── ANL: Analytics / Observability ───────────────────────────────────────────

export function analyzeAnl(root) {
	const findings = [];

	const hasCi = fs.existsSync(path.join(root, '.github', 'workflows'));
	if (!hasCi) {
		findings.push({
			id: 'anl-no-ci',
			priority: 'medium',
			title: 'Add CI/CD pipeline',
			description: 'No .github/workflows/ found. Automated checks catch regressions before they reach production.',
			skill: 'scan-anl', agent: 'architect', mode: 'architecture',
		});
	}

	let commitScore = 1.0;
	try {
		const out = execSync('git log -20 --pretty=format:%s', { cwd: root, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
		const msgs = out.trim().split('\n').filter(Boolean);
		if (msgs.length >= 3) {
			const fixes = msgs.filter(m => /\bfix\b/i.test(m)).length;
			const fixRate = fixes / msgs.length;
			if (fixRate > 0.5) {
				commitScore = r(1 - fixRate);
				findings.push({
					id: 'anl-high-fix-rate',
					priority: 'medium',
					title: 'High bug-fix rate in recent commits',
					description: `${fixes} of ${msgs.length} recent commits are fixes (${Math.round(fixRate * 100)}%). Signals weak test coverage or recurring design debt.`,
					skill: 'scan-anl', agent: 'architect', mode: 'architecture',
				});
			}
		}
	} catch {}

	let cleanScore = 1.0;
	try {
		const out = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
		const lines = out.trim().split('\n').filter(Boolean);
		if (lines.length > 0) {
			cleanScore = 0.5;
			findings.push({
				id: 'anl-uncommitted',
				priority: 'medium',
				title: `Commit ${lines.length} uncommitted change(s)`,
				description: 'Working tree has uncommitted changes. Commit or stash before starting new work.',
				skill: 'scan-anl', agent: 'builder', mode: 'engineering',
			});
		}
	} catch {}

	const ciScore = hasCi ? 1 : 0;
	return { id: 'anl', name: 'Analytics', score: r((ciScore + commitScore + cleanScore) / 3), findings };
}

// ── DBG: Debug / Reliability ──────────────────────────────────────────────────

export function analyzeDbg(root) {
	const TODO_PATTERN = /\/\/\s*(TODO|FIXME|HACK|BUG|XXX)[\s:]*(.*)/i;
	const CONSOLE_PATTERN = /\bconsole\.(log|warn|error|debug)\b/;
	const todos = [];
	const consoleLogs = [];

	walkDir(root, filePath => {
		if (!SOURCE_EXTS.has(path.extname(filePath))) return;
		const rel = path.relative(root, filePath);
		const isTest = /test|spec|__tests__/.test(rel);
		try {
			fs.readFileSync(filePath, 'utf-8').split('\n').forEach((line, i) => {
				const m = line.match(TODO_PATTERN);
				if (m && !isTest) todos.push({ file: rel, line: i + 1, type: m[1].toUpperCase() });
				if (CONSOLE_PATTERN.test(line) && !isTest) consoleLogs.push({ file: rel, line: i + 1 });
			});
		} catch {}
	});

	const findings = [];

	if (todos.length > 0) {
		const fixmes = todos.filter(t => ['FIXME', 'BUG'].includes(t.type));
		findings.push({
			id: 'dbg-todos',
			priority: fixmes.length > 0 ? 'high' : 'medium',
			title: `Resolve ${todos.length} TODO/FIXME comment(s)`,
			description: `${todos.length} inline markers (${fixmes.length} FIXME/BUG). Top: ${todos.slice(0, 2).map(t => `${t.file}:${t.line}`).join(', ')}`,
			skill: 'scan-dbg', agent: 'builder', mode: 'engineering',
		});
	}

	if (consoleLogs.length > 5) {
		findings.push({
			id: 'dbg-console-logs',
			priority: 'medium',
			title: `Remove ${consoleLogs.length} console.log statement(s)`,
			description: `${consoleLogs.length} console.log/warn/error calls in production source. Use a structured logger instead.`,
			skill: 'scan-dbg', agent: 'builder', mode: 'engineering',
		});
	}

	const todoScore = r(Math.max(0, 1 - todos.length / 10));
	const logScore = r(Math.max(0, 1 - consoleLogs.length / 10));
	return { id: 'dbg', name: 'Debug', score: r((todoScore + logScore) / 2), findings };
}
