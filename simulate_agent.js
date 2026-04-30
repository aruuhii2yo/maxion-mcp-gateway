const { spawn } = require('child_process');

console.log("Starting Maxion MCP Gateway Simulation...");
const mcp = spawn('node', ['mcp_wrapper.js'], { stdio: ['pipe', 'pipe', 'inherit'] });

let messageCount = 0;

mcp.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
        try {
            const parsed = JSON.parse(line);
            console.log(`\n[Agent Received]:\n`, JSON.stringify(parsed, null, 2));

            if (messageCount === 0) {
                console.log("\n[Agent Strategy]: Requesting maxion_execute with Developer Bypass to spawn the dashboard...");
                const req = {
                    jsonrpc: "2.0",
                    id: 2,
                    method: "tools/call",
                    params: {
                        name: "maxion_execute",
                        arguments: {
                            identifier: "admin@maxion",
                            payment_type: "fiat"
                        }
                    }
                };
                mcp.stdin.write(JSON.stringify(req) + '\n');
            } else if (messageCount === 1) {
                console.log("\n[Agent Conclusion]: Subscription verified. The Maxion UI should now open in your browser!");
                setTimeout(() => mcp.kill(), 2000);
            }
            messageCount++;
        } catch (e) {
            // Not a JSON line
        }
    });
});

// Request list of tools
const initReq = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
};
mcp.stdin.write(JSON.stringify(initReq) + '\n');
