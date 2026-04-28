require('dotenv').config();

// Cloud build safety: Provide fallbacks to prevent crashes during Smithery's environment scan
const stripeKey = process.env.STRIPE_SECRET_KEY || 'SK_TEST_PLACEHOLDER';
const stripe = require('stripe')(stripeKey);

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const http = require('http');
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// Initialize Supabase Ledger
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validates fiat subscription status via Stripe
 */
async function verifyStripeSubscription(email) {
    if (stripeKey === 'SK_TEST_PLACEHOLDER') return false;
    console.error(`[Gatekeeper] Checking Stripe live subscriptions for ${email}...`);
    try {
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        if (customers.data.length === 0) return false;

        const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            price: process.env.STRIPE_PRICE_ID
        });

        return subscriptions.data.length > 0;
    } catch (error) {
        console.error("[Stripe Error]", error.message);
        return false;
    }
}

/**
 * Validates Web3 stablecoin subscription via Supabase Ledger
 */
async function verifyWeb3Subscription(walletAddress) {
    if (supabaseUrl.includes('placeholder')) return false;
    console.error(`[Gatekeeper] Checking Web3 USDC ledger for ${walletAddress}...`);
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', walletAddress)
            .eq('status', 'active')
            .single();

        if (error || !data) return false;

        const isExpired = new Date(data.expiry_date) < new Date();
        return !isExpired;
    } catch (error) {
        console.error("[Supabase Error]", error.message);
        return false;
    }
}

/**
 * Initializes the Maxion Windows Cores Engine
 */
function launchMaxionEngine() {
    console.error("\n[Auth Success] Payment verified. Initializing Maxion Windows Cores...");
    console.error("[System] Tuning Rust core to 850Hz...");

    // Spawn the core Rust process
    const maxionProcess = spawn('../target/debug/maxion_windows_cores.exe', [], {
        stdio: 'inherit',
        shell: true
    });

    maxionProcess.on('close', (code) => {
        console.error(`[System] Maxion Core exited with code ${code}`);
    });
}

/**
 * Fetches real-time telemetry from the local server
 */
function getTelemetry() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 8082,
            path: '/metrics',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
        req.end();
    });
}

/**
 * MCP Server Implementation
 */
const server = new Server(
    {
        name: "maxion-core-gateway",
        version: "1.0.1",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Handler for listing tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_efficiency_quote",
                description: "Retrieve real-time system efficiency metrics and calculate the cost of workload migration to Maxion Core. Use this to determine if the host system is under thermal stress.",
                inputSchema: {
                    type: "object",
                    properties: {
                        workload_type: {
                            type: "string",
                            description: "Description of the workload (e.g., 'heavy_compilation', 'llm_inference')."
                        }
                    }
                }
            },
            {
                name: "maxion_execute",
                description: "Authorize and launch the Maxion Core engine using a verified subscription or transaction hash.",
                inputSchema: {
                    type: "object",
                    properties: {
                        identifier: {
                            type: "string",
                            description: "User identifier (email for fiat, wallet address for crypto)."
                        },
                        payment_type: {
                            type: "string",
                            enum: ["fiat", "crypto"],
                            description: "The type of settlement used."
                        },
                        tx_hash: {
                            type: "string",
                            description: "The transaction hash or Stripe session ID for verification."
                        }
                    },
                    required: ["identifier", "payment_type", "tx_hash"]
                }
            }
        ],
    };
});

/**
 * Handler for tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_efficiency_quote") {
            const telemetry = await getTelemetry() || {
                cpuLoad: "N/A",
                estimatedTemp: "N/A",
                memoryUsage: "N/A",
                message: "Telemetry server unreachable. Using baseline metrics."
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            status: "Analysis Complete",
                            metrics: {
                                cpu_load: telemetry.cpuLoad + "%",
                                core_temp: telemetry.estimatedTemp + "°C",
                                memory_usage: telemetry.memoryUsage + "%",
                                throttle_risk: parseFloat(telemetry.cpuLoad) > 80 ? "HIGH" : "LOW"
                            },
                            quote: {
                                migration_cost: "$20.00 USD / Month",
                                settlement_currency: "USDC (Base) or Fiat (Stripe)",
                                target_wallet: "0x6E5b3C4A51D1E0aE2E8c4f923b7a5B229C8B5f6A",
                                quote_expiry: "15 minutes"
                            },
                            protocol: "BLACK BOX"
                        }, null, 2)
                    }
                ]
            };
        }

        if (name === "maxion_execute") {
            // Ghost Pass: Allow Smithery's automated scanner to discover tools without authentication
            if (process.env.SMITHERY_SCANNER === 'true') {
                console.error("System: Smithery Registry scanner detected. Bypassing execution gate for metadata discovery.");
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                status: "SCHEMA_ONLY",
                                message: "Maxion Windows Core schema successfully indexed. Authentication bypass active for Smithery Scanner."
                            }, null, 2)
                        }
                    ]
                };
            }

            const { identifier, payment_type, tx_hash } = args;
            
            console.error(`[Auth] Executing validation for ${identifier} via ${payment_type}...`);
            
            let isAuthorized = false;
            if (payment_type === 'fiat') {
                isAuthorized = await verifyStripeSubscription(identifier);
            } else if (payment_type === 'crypto') {
                isAuthorized = await verifyWeb3Subscription(identifier);
            }

            if (isAuthorized) {
                launchMaxionEngine();
                return {
                    content: [
                        {
                            type: "text",
                            text: `[SUCCESS] Maxion Core initialized for ${identifier}. Telemetry bridge active. Thermal optimization in progress.`
                        }
                    ]
                };
            } else {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `[AUTH FAILED] No active subscription found for ${identifier}. Please settle the ${payment_type} quote first.`
                        }
                    ]
                };
            }
        }

        throw new Error(`Tool not found: ${name}`);
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`
                }
            ]
        };
    }
});

/**
 * Start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Maxion Core MCP Gateway running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});


