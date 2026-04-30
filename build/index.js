"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const auth_js_1 = require("./auth.js");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
const server = new index_js_1.Server({
    name: "Maxion Windows Cores",
    version: "16.0.0"
}, {
    capabilities: { tools: {} }
});
// ─── Define the Maxion Skill for Claude ─────────────────────────────────────
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [{
            name: "run_ending_thrasher",
            description: "Executes the Maxion hardware resource shedding protocol to prevent Windows system freezing. Requires an active $20/month subscription.",
            inputSchema: {
                type: "object",
                properties: {
                    userId: {
                        type: "string",
                        description: "The Supabase user ID of the current client."
                    }
                },
                required: ["userId"]
            }
        }]
}));
// ─── Handle Tool Execution ──────────────────────────────────────────────────
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === "run_ending_thrasher") {
        const { userId } = request.params.arguments;
        if (!userId) {
            return {
                content: [{ type: "text", text: "UNAUTHORIZED: User ID missing. Please authenticate." }],
                isError: true
            };
        }
        // 1. Gateway Check (Supabase Paywall)
        const isSubscribed = await (0, auth_js_1.verifySubscription)(userId);
        if (!isSubscribed) {
            return {
                content: [{ type: "text", text: "UNAUTHORIZED: Active J&K Advanced Technologies subscription required ($20/mo). Please upgrade to access hardware-level tools." }],
                isError: true
            };
        }
        // 2. Execution logic (Hardware Trigger)
        return new Promise((resolve) => {
            const scriptPath = path_1.default.resolve(__dirname, "../../Run-Transparent.ps1");
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        content: [{ type: "text", text: `Maxion execution failed: ${error.message}` }],
                        isError: true
                    });
                }
                else {
                    resolve({
                        content: [{ type: "text", text: `Maxion Protocol Success: System resources shed. Telemetry: ${stdout}` }]
                    });
                }
            });
        });
    }
    throw new Error("Tool not found");
});
// ─── Connect to Transport ───────────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Maxion Windows Cores MCP Server running on STDIO");
}
main().catch(console.error);
