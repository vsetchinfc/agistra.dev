---
name: browser-automation
description: "Use when: Tester needs UI state evidence for VBR, or Builder needs to verify an integration wire is observable end-to-end. Powered by agent-browser MCP — token-efficient browser automation (200–400 tokens/page)."
argument-hint: "URL to verify, UI state to capture, form to fill, or integration endpoint to exercise"
---

# Browser Automation

Token-efficient browser automation via the `agent-browser` MCP server. Provides Tester with evidence-grade UI verification and gives Builder a lightweight end-to-end integration check.

## When to Load

**Tester:** Load when the acceptance criteria include a visible UI state, a rendered page, a form interaction, or a URL that must be reachable. VBR for Tester requires observable evidence — a screenshot or captured text, not just a passing test suite.

**Builder:** Load when the ticket's end-to-end step requires confirming that a new integration wire produces observable output in a running app. Tests passing is not sufficient when the integration surface is a rendered page or API response visible in a browser.

Do not load for: unit tests, static file checks, pure API responses verified via curl/fetch, or any task where the acceptance criteria make no reference to UI state or browser-visible output.

## VBR Criteria When Browser Is Available

Tester must satisfy at least one of these before reporting `state:qa-passed`:

- Screenshot captured showing the expected UI state (visible text, rendered component, or error state)
- Page text extracted confirming the expected content is present
- Navigation succeeded to the target URL without error (HTTP 2xx or expected redirect)
- Form submission completed and confirmation state is visible

"Tests pass" alone does not satisfy VBR when browser verification is available and the ACs reference UI state.

## Usage

**Preflight:** Before using any `mcp__agent-browser__*` tool, confirm the server is present in `.mcp.json` and reachable. If not, fall back immediately to the When Browser Is Unavailable section below and report evidence quality in your verdict.

The `agent-browser` MCP server exposes tools directly in the session once configured in `.mcp.json`. No `npx` invocation required — tools are available as `mcp__agent-browser__browser_navigate`, `mcp__agent-browser__browser_snapshot`, `mcp__agent-browser__browser_screenshot`, etc.

Common operations:
- Navigate to a URL and capture a screenshot
- Extract visible text from a page
- Click a button or link by label
- Fill and submit a form

## Token Budget

agent-browser represents each page in 200–400 tokens — roughly 10–20× cheaper than raw Playwright output. This makes it viable to run a browser check on every QA pass without a significant context cost.

Keep browser sessions short: navigate → capture evidence → close. Do not leave sessions open across multiple tool calls.

## When Browser Is Unavailable

If the MCP server is not running or not configured, fall back to:
- `curl` for HTTP reachability checks
- Reading rendered HTML files from the build output
- Manual screenshot instruction to the team lead

**VBR fallback rule:** If the acceptance criteria explicitly require browser evidence (UI state, visual confirmation, form submission feedback, etc.), and only curl or static file fallbacks were used, report the result as **BLOCKED** — evidence is insufficient to satisfy VBR without observable UI state capture. Note the fallback method in the QA report and escalate to the team lead for manual verification.

Note the fallback method in the QA report so the team lead can assess evidence quality.
