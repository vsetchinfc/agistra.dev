#!/usr/bin/env node
/**
 * Dependency-graph MCP server (ADR-036 Stage 2, task_274/#508) — exposes the
 * Stage 1 engine (dep-graph.js) to the active coding agent as session-scoped
 * tools: scan(path), baseline(), diff(), check(). Spawned per-session by the
 * client via .mcp.json's `command`, the same pattern the existing
 * agent-browser entry already uses — no persistent daemon, no lifecycle
 * hooks, no doctor.js readiness check (ADR-036 Decision 5).
 *
 * Usage:
 *   node pipelines/deploy/lib/dep-graph-mcp-server.js
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createDepGraphSession } from './dep-graph-session.js';
import { DEP_GRAPH_TOOLS, callDepGraphTool } from './dep-graph-tools.js';

const session = createDepGraphSession();

const server = new Server(
	{ name: 'dep-graph', version: '0.1.0' },
	{ capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: DEP_GRAPH_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	try {
		const result = await callDepGraphTool(
			request.params.name,
			request.params.arguments ?? {},
			session,
		);
		return {
			content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			content: [{ type: 'text', text: message }],
			isError: true,
		};
	}
});

const transport = new StdioServerTransport();
await server.connect(transport);
