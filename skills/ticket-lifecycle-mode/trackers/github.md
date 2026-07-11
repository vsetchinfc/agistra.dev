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

A GitHub tracker is configured for the current project when **both** of the following
are true:

1. The target repository has at least one remote whose URL contains `github.com`
   (check with `git remote -v`).
2. The `gh` CLI is authenticated in the current session (`gh auth status` exits 0).

When either condition is false, report "tracker not configured" — do not attempt
creation or updates. If `gh auth status` fails while a remote is present, record the
auth gap in the task file `## Log` section for later reconciliation.

## 2 — create-record

When detect-configured returns true and a new ticket is being created:

1. Run `gh issue create --title "<ticket title>" --body "<ticket description>"` in the
   target repository (add `--label` flags as appropriate for the initial state).
2. Capture the returned issue URL.
3. Set `github-issue: <url>` in the task file frontmatter.

The `github-issue:` field in the frontmatter is the authoritative reference for this
plugin. Its presence in any task file signals that the mirror-update obligation applies
to that ticket.

## 3 — update-record

On every lifecycle transition where `github-issue:` is set in the task file:

**State label update:**
- Remove the previous `state:*` label: `gh issue edit <N> --remove-label "state:<old-state>"`
- Apply the new `state:*` label: `gh issue edit <N> --add-label "state:<new-state>"`

**Fail-counter label update (when `fail-count:` changes):**
- On first fail: apply `qa-fail-1`
- On second fail: remove `qa-fail-1`, apply `qa-fail-2`
- On park (third fail): remove any `qa-fail-*` label; no new label — the local file's
  `parked: true` is the authoritative signal

**QA report comments:** post a comment to the issue when a QA verdict (PASS/FAIL/PARTIAL
PASS) is recorded. Use `gh issue comment <N> --body "<report>"`.

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
