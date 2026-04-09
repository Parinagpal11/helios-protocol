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

  console.log("SREC PDA:", srecPda.toString());
  console.log("Marketplace PDA:", marketplacePda.toString());

  const account = await connection.getAccountInfo(srecPda);
  if (account) {
    console.log("✅ SREC #1 exists on-chain — ready to purchase");
    console.log("   Data size:", account.data.length, "bytes");
  } else {
    console.log("❌ SREC #1 not found");
  }
}

main().catch(console.error);
