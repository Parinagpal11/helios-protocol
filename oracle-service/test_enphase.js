const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config({ path: "../.env" });

async function testEnphase() {
  console.log("Testing Enphase sandbox connection...");
  console.log("Client ID:", process.env.ENPHASE_CLIENT_ID ? "✅ set" : "❌ missing");
  console.log("Client Secret:", process.env.ENPHASE_CLIENT_SECRET ? "✅ set" : "❌ missing");
  console.log("API Key:", process.env.ENPHASE_API_KEY ? "✅ set" : "❌ missing");

  try {
    const response = await fetch(
      `https://api.enphaseenergy.com/api/v4/systems?key=${process.env.ENPHASE_API_KEY}`,
      {
        headers: {
          "Authorization": `Basic ${Buffer.from(
            `${process.env.ENPHASE_CLIENT_ID}:${process.env.ENPHASE_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

testEnphase();
