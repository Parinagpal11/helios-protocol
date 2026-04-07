import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletData = JSON.parse(fs.readFileSync(process.env.WALLET_PATH!.replace("~", process.env.HOME!), "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: "confirmed" });
  const programId = new PublicKey(process.env.PROGRAM_ID!);
  const idl = JSON.parse(fs.readFileSync("../helios-program/target/idl/helios_program.json", "utf-8"));
  const program = new anchor.Program(idl, provider);
  const [marketplacePda] = PublicKey.findProgramAddressSync([Buffer.from("marketplace")], programId);
  
  try {
    const tx = await program.methods
      .initializeMarketplace(75)
      .accounts({ marketplace: marketplacePda, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    console.log("✅ Marketplace initialized:", tx);
    console.log("🔗 https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
  } catch (e: any) {
    if (e.message?.includes("already in use")) {
      console.log("✅ Marketplace already initialized — good to go");
    } else {
      console.error("❌ Error:", e.message);
    }
  }
}

main().catch(console.error);
