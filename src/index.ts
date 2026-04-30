import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
    ListToolsRequestSchema, 
    CallToolRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import { verifySubscription } from "./auth.js";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server({
    name: "Maxion Windows Cores",
    version: "16.0.0"
}, {
    capabilities: { tools: {} }
});

// ─── Define the Maxion Skill for Claude ─────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "run_ending_thrasher") {
        const { userId } = request.params.arguments as { userId: string };
        
        if (!userId) {
            return {
                content: [{ type: "text", text: "UNAUTHORIZED: User ID missing. Please authenticate." }],
                isError: true
            };
        }

        // 1. Gateway Check (Supabase Paywall)
        const isSubscribed = await verifySubscription(userId);
        if (!isSubscribed) {
            return {
                content: [{ type: "text", text: "UNAUTHORIZED: Active J&K Advanced Technologies subscription required ($20/mo). Please upgrade to access hardware-level tools." }],
                isError: true
            };
        }

        // 2. Execution logic (Hardware Trigger)
        return new Promise((resolve) => {
            const scriptPath = path.resolve(__dirname, "../../Run-Transparent.ps1");
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        content: [{ type: "text", text: `Maxion execution failed: ${error.message}` }],
                        isError: true
                    });
                } else {
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
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Maxion Windows Cores MCP Server running on STDIO");
}

main().catch(console.error);
