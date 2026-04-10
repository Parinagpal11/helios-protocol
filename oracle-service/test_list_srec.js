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
  idl.address = process.env.PROGRAM_ID;
  const program = new anchor.Program(idl, provider);

  const serialNumber = 1n;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(serialNumber);
  const [srecPda] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf], programId);
  const [marketplacePda] = PublicKey.findProgramAddressSync([Buffer.from("marketplace")], programId);

  console.log("Listing SREC #1 at 190 USDC...");
  
  try {
    const tx = await program.methods
      .listSrec(new anchor.BN(190 * 1_000_000))
      .accounts({
        srec: srecPda,
        marketplace: marketplacePda,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ SREC #1 listed successfully");
    console.log("🔗 https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

main().catch(console.error);
