const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");
require("dotenv").config({ path: "../.env" });

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletPath = process.env.WALLET_PATH.replace("~", process.env.HOME);
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: "confirmed" });
  
  const programId = new PublicKey(process.env.PROGRAM_ID);
  const idl = JSON.parse(fs.readFileSync("../helios-program/target/idl/helios_program.json", "utf-8"));
  
  // Anchor v0.30 requires address in IDL
  idl.address = process.env.PROGRAM_ID;
  
  const program = new anchor.Program(idl, provider);
  const [marketplacePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")], 
    programId
  );

  console.log("Program ID:", programId.toString());
  console.log("Marketplace PDA:", marketplacePda.toString());
  console.log("Wallet:", wallet.publicKey.toString());

  try {
    const tx = await program.methods
      .initializeMarketplace(75)
      .accounts({ 
        marketplace: marketplacePda, 
        authority: wallet.publicKey, 
        systemProgram: SystemProgram.programId 
      })
      .rpc();
    console.log("✅ Marketplace initialized:", tx);
    console.log("🔗 https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
  } catch (e) {
    if (e.message && e.message.includes("already in use")) {
      console.log("✅ Marketplace already initialized — good to go");
    } else {
      console.error("❌ Error:", e.message);
    }
  }
}

main().catch(console.error);
