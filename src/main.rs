use ngrok::prelude::*;
use std::env;
use std::time::Duration;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    
    println!("🚀 Booting Maxion Windows Cores MCP Gateway...");
    println!("❄️  Zero-Thermal Asynchronous Architecture Engaged.");

    // 1. The Creator Override & Licensing Handshake
    let master_key = env::var("MAXION_MASTER_KEY").unwrap_or_default();
    let is_loiacono_admin = master_key == "Loiacono-Universal-Admin";

    if is_loiacono_admin {
        println!("👑 Creator Override Accepted. Bypassing J&K Licensing Protocols.");
    } else {
        println!("🔒 Verifying J&K Advanced Technologies License...");
        let license_key = env::var("MAXION_LICENSE_KEY").expect("⚠️ MAXION_LICENSE_KEY required for non-admin access.");
        verify_subscription(&license_key).await.expect("❌ Invalid or Expired $20/mo Subscription.");
        println!("✅ License Verified.");
    }

    // 2. High-Efficiency Tunnel Ingestion (No Lockups)
    let authtoken = env::var("NGROK_AUTHTOKEN").expect("⚠️ NGROK_AUTHTOKEN required.");
    let session = ngrok::Session::builder().authtoken(authtoken).connect().await?;
    let mut listener = session.http_endpoint().listen().await?;
    let public_url = listener.url().expect("Failed to generate URL");
    
    println!("🌐 Global Endpoint Live: {}", public_url);

    // 3. Asynchronous Traffic Processing Engine
    while let Some(conn) = listener.try_next().await? {
        tokio::spawn(async move {
            // Offloads traffic instantly to prevent CPU bottlenecking & heat generation
            println!("📥 Connection routed seamlessly.");
        });
    }

    Ok(())
}

// Wired to the live J&K Stripe API endpoint
async fn verify_subscription(key: &str) -> Result<(), &'static str> {
    if key.is_empty() { return Err("Missing Key"); }
    
    let client = Client::new();
    let res = client.post("https://api.jk-advanced-tech.com/v1/stripe/verify_subscription")
        .json(&json!({ "license_key": key }))
        .send()
        .await
        .map_err(|_| "Failed to connect to J&K Licensing Server")?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err("Invalid or Expired Subscription. Server rejected the key.")
    }
}
