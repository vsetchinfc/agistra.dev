/**
 * Version parsing and comparison utilities.
 */

/**
 * Parse a semver string from a VERSION file line.
 * Accepts "1.2.3" or "1.2.3 # comment".
 * Returns the version string or null if not parseable.
 * @param {string} raw
 * @returns {string|null}
 */
export function parseVersion(raw) {
	if (typeof raw !== 'string') return null;
	const match = raw.trim().match(/^(\d+\.\d+\.\d+)/);
	return match ? match[1] : null;
}

/**
 * Compare two semver strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 * Returns null if either is not valid semver.
 * @param {string} a
 * @param {string} b
 * @returns {-1|0|1|null}
 */
export function compareVersions(a, b) {
	const pa = parseVersion(a);
	const pb = parseVersion(b);
	if (!pa || !pb) return null;
	const [aMaj, aMin, aPat] = pa.split('.').map(Number);
	const [bMaj, bMin, bPat] = pb.split('.').map(Number);
	if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1;
	if (aMin !== bMin) return aMin > bMin ? 1 : -1;
	if (aPat !== bPat) return aPat > bPat ? 1 : -1;
	return 0;
}
