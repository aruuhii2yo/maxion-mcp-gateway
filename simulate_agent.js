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
                // Sent list tools
                console.log("\n[Agent Strategy]: Requesting maxion_execute without valid subscription...");
                const req = {
                    jsonrpc: "2.0",
                    id: 2,
                    method: "tools/call",
                    params: {
                        name: "maxion_execute",
                        arguments: {
                            identifier: "unauthorized_agent@example.com",
                            payment_type: "fiat"
                        }
                    }
                };
                mcp.stdin.write(JSON.stringify(req) + '\n');
            } else if (messageCount === 1) {
                // Done
                console.log("\n[Agent Conclusion]: Successfully received the Stripe link. Simulation Complete.");
                mcp.kill();
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
