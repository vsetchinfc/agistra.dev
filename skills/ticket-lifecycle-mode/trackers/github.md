# GitHub Tracker Plugin

This file is the GitHub implementation of the tracker plugin contract defined in
`ticket-lifecycle-mode/SKILL.md` (Tracker Plugin Contract section). It is the first
reference plugin shipped with the framework. A second tracker plugin (Jira, Linear,
etc.) would live at `trackers/<name>.md` and follow the same three-operation shape —
the core contract and all other skills never need to change.

## Plugin Identity

- **Plugin name:** `github`
- **Frontmatter field:** `github-issue:` (value: issue URL or `org/repo#number`)
- **Tooling required:** `gh` CLI (GitHub CLI)

## 1 — detect-configured

`detect-configured` never depends on the agent process's ambient working directory. In a
multi-repo hub, the agent's cwd is frequently a different git repository from the target
project (e.g. the hub root itself, or a sibling project). A cwd-dependent check (running
`git remote -v` wherever the process happens to be) silently inspects the wrong
repository and can report "not configured" for a project that is in fact tracked on
GitHub — just not visible from that cwd. To avoid this, resolution always happens in one
of two explicit ways, tried in order:

**(a) Known reference (the common case — no `git remote -v` call at all):**

An `owner/repo` for the target project is already known if either of the following is
true:

1. `workspace.config.json` has `projects.<name>.githubRepo` set (see "The `githubRepo`
   field" below), or
2. any existing task file for this project already carries a GitHub reference —
   `github-issue:` in frontmatter, or the legacy `**GitHub:**` body line.

When either source resolves an `owner/repo`, extract it directly and treat the tracker
as configured, provided `gh auth status` also exits 0 (record an auth gap in the task
file `## Log` section if it doesn't). No filesystem or `git remote -v` check is needed
or performed in this path — the `--repo` flag on every subsequent `gh` call (see
create-record and update-record below) makes the agent's own cwd irrelevant to every
`gh` invocation from this point on.

**(b) Bootstrap fallback (a project's first-ever ticket — nothing known yet):**

Only when neither source in (a) resolves an `owner/repo` — i.e. this is the first ticket
ever created for the project — fall back to confirming a GitHub remote explicitly:

1. Resolve the project's real repository filesystem path: `workspace.config.json` →
   `projects.<name>.repoPath` if set, else ask the operator for the path (or for the
   `owner/repo` string directly, skipping to step 3).
2. Run `git -C <resolved-path> remote -v` — always with an explicit `-C <path>`, never a
   bare `git remote -v` against ambient cwd — and confirm at least one remote URL
   contains `github.com`.
3. Confirm `gh auth status` exits 0.

When either check in (b) fails, report "tracker not configured" — do not attempt
creation or updates.

Once path (b) resolves an `owner/repo` for a project, record it into
`workspace.config.json` → `projects.<name>.githubRepo` immediately (see "The
`githubRepo` field" below) so every later ticket for that project uses path (a) and
never re-runs the bootstrap fallback.

## 2 — create-record

When detect-configured returns true and a new ticket is being created:

1. Run `gh issue create --repo <owner>/<repo> --title "<ticket title>" --body "<ticket
   description>"` (add `--label` flags as appropriate for the initial state). The
   `--repo` flag is always explicit and always the `owner/repo` resolved by
   detect-configured — never left to `gh`'s own cwd-based repo inference.
2. Capture the returned issue URL.
3. Set `github-issue: <url>` in the task file frontmatter.

The `github-issue:` field in the frontmatter is the authoritative reference for this
plugin. Its presence in any task file signals that the mirror-update obligation applies
to that ticket, and — per detect-configured path (a) above — also serves as a known
reference for resolving this project's `owner/repo` on every subsequent ticket.

## 3 — update-record

On every lifecycle transition where `github-issue:` is set in the task file, resolve
`<owner>/<repo>` from that field (or from `projects.<name>.githubRepo`) and pass it
explicitly on every `gh` call below — never rely on `gh`'s own cwd-based repo inference:

**State label update:**
- Remove the previous `state:*` label:
  `gh issue edit <N> --repo <owner>/<repo> --remove-label "state:<old-state>"`
- Apply the new `state:*` label:
  `gh issue edit <N> --repo <owner>/<repo> --add-label "state:<new-state>"`

**Fail-counter label update (when `fail-count:` changes):**
- On first fail: apply `qa-fail-1`
- On second fail: remove `qa-fail-1`, apply `qa-fail-2`
- On park (third fail): remove any `qa-fail-*` label; no new label — the local file's
  `parked: true` is the authoritative signal

  Every add/remove above is a `gh issue edit <N> --repo <owner>/<repo> --add-label
  "<label>"` / `--remove-label "<label>"` call.

**QA report comments:** post a comment to the issue when a QA verdict (PASS/FAIL/PARTIAL
PASS) is recorded. Use `gh issue comment <N> --repo <owner>/<repo> --body "<report>"`.

**PR closing-keyword convention:** When a task file has `github-issue:` set and a PR is
opened implementing that ticket, the PR body must include a `Closes #<N>` (or `Fixes #<N>`)
line referencing that issue number. On merge to the repository's default branch, this
keyword automatically closes the mirrored issue.

**Important default-branch dependency:** This auto-close behavior only fires when the PR
merges into the repository's **default branch**. This is a critical configuration dependency.
GitHub's auto-closing keywords do not fire when a PR merges into a non-default branch.
A mismatch between the default branch and the actual merge target (for example, a repository
configured with `main` as the default branch but feature PRs merging to `develop`) will cause
the auto-close logic to silently fail without warning — closing-keyword lines in the PR body
will exist and be syntactically correct, but the issue will not close on merge. This
dependency is critical enough to document explicitly here: any configuration change affecting
which branch is marked as default must be coordinated with the merge strategy to ensure
closing keywords continue to fire as expected.

## The `githubRepo` field

`projects.<name>.githubRepo` in `workspace.config.json` is an `"owner/repo"` string
(e.g. `"owner/repo"`) recording the GitHub repository for a project, independent of
where that project's files live on disk. It follows the same resolution-order
convention as the existing `projects.<name>.repoPath` field used elsewhere in this hub
for mapping a project name to its repository's filesystem location — the two fields
serve the same "map a project name to its real repository" purpose for different
consumers: `repoPath` resolves a filesystem path, `githubRepo` resolves an `owner/repo`
string for `gh --repo`.

```json
{
  "projects": {
    "<name>": {
      "githubRepo": "owner/repo"
    }
  }
}
```

- **Read:** consulted first in detect-configured path (a) above, before checking any
  task file for a `github-issue:` reference.
- **Write:** set automatically the first time detect-configured path (b) resolves an
  `owner/repo` for a project via its filesystem path — see "Bootstrap fallback" above.
  Once set, that project's tickets never trigger path (b) again.

## workspace.config.json declaration

To explicitly declare GitHub as the active tracker plugin for a hub, add the following
to `workspace.config.json`:

```json
{
  "tracker": {
    "plugin": "github"
  }
}
```

When this field is absent, agents fall back to running detect-configured for each
available plugin and using the first one that returns true. Explicit declaration is
recommended when a project uses multiple remotes (e.g. a GitHub mirror alongside a
primary Jira instance) to avoid ambiguous auto-detection.
