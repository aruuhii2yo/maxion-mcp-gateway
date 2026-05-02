const fs = require('fs');
let host = fs.readFileSync('subscriber_host.js', 'utf8');

// Use a regex to delete the entire playBootAnimation function and its invocation
host = host.replace(/\/\/ Exciting Terminal Boot Sequence[\s\S]*?playBootAnimation\(\);/, 
    "console.log('\\x1b[36m%s\\x1b[0m', '>> MAXION CORE ONLINE <<');\nconsole.log('\\x1b[1m\\x1b[32m>> SYSTEM STABLE <<\\x1b[0m\\n');");

fs.writeFileSync('subscriber_host.js', host);
console.log('Matrix boot removed safely.');
