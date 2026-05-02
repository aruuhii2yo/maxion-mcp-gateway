const { spawn } = require('child_process');

console.log("=================================================");
console.log(" MAXION CENTRAL NERVOUS SYSTEM ONLINE");
console.log("=================================================\n");

const rust = spawn('cargo', ['run', '--release'], { shell: true, windowsHide: true });
rust.stdout.on('data', data => process.stdout.write(`\x1b[36m[RUST CORE]\x1b[0m ${data}`));
rust.stderr.on('data', data => process.stderr.write(`\x1b[36m[RUST CORE]\x1b[0m ${data}`));

// Production environment: We do not launch the MCP Inspector here.
// Users will attach mcp_wrapper.js directly to their AI Agents (Claude Desktop, etc).

const sub = spawn('node', ['subscriber_host.js'], { windowsHide: true });
sub.stdout.on('data', data => process.stdout.write(`\x1b[34m[SUBSCRIBER]\x1b[0m ${data}`));
sub.stderr.on('data', data => process.stderr.write(`\x1b[34m[SUBSCRIBER]\x1b[0m ${data}`));

// Handle exit
process.on('SIGINT', () => {
    rust.kill();
    sub.kill();
    process.exit();
});
