// REAL CPU STRESS TEST THREAD
// This script runs a continuous mathematical loop to peg a single CPU core to 100%.
// It automatically terminates itself after 32 seconds as a fail-safe.

const stopTime = Date.now() + 32000;
while (Date.now() < stopTime) {
    Math.sqrt(Math.random() * Math.random());
}
process.exit(0);
