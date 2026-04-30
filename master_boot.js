const { spawn } = require('child_process');

console.log("=================================================");
console.log(" MAXION CENTRAL NERVOUS SYSTEM ONLINE");
console.log("=================================================\n");

const rust = spawn('cargo', ['run', '--release'], { shell: true });
rust.stdout.on('data', data => process.stdout.write(`\x1b[36m[RUST CORE]\x1b[0m ${data}`));
rust.stderr.on('data', data => process.stderr.write(`\x1b[36m[RUST CORE]\x1b[0m ${data}`));

const telemetry = spawn('node', ['telemetry_server.js'], { shell: true });
telemetry.stdout.on('data', data => process.stdout.write(`\x1b[32m[TELEMETRY]\x1b[0m ${data}`));
telemetry.stderr.on('data', data => process.stderr.write(`\x1b[32m[TELEMETRY]\x1b[0m ${data}`));

const inspector = spawn('npx', ['@modelcontextprotocol/inspector', 'node', 'mcp_wrapper.js', '--stdio'], { shell: true });
inspector.stdout.on('data', data => process.stdout.write(`\x1b[35m[INSPECTOR]\x1b[0m ${data}`));
inspector.stderr.on('data', data => process.stderr.write(`\x1b[35m[INSPECTOR]\x1b[0m ${data}`));

// Handle exit
process.on('SIGINT', () => {
    rust.kill();
    telemetry.kill();
    inspector.kill();
    process.exit();
});
