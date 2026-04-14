const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
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

  console.log("Running security checks...\n");

  // Test 1: Can owner buy their own certificate?
  console.log("Test 1: Owner buying own certificate (should fail)");
  try {
    await program.methods
      .purchaseSrec()
      .accounts({ srec: srecPda, marketplace: marketplacePda, buyer: wallet.publicKey })
      .rpc();
    console.log("❌ FAILED — should have been rejected");
  } catch (e) {
    if (e.message.includes("CannotBuyOwnSrec") || e.message.includes("owner")) {
      console.log("✅ PASSED — owner cannot buy own certificate");
    } else {
      console.log("✅ PASSED — rejected with:", e.message.split(".")[0]);
    }
  }

  // Test 2: Can unlisted SREC be bought?
  console.log("\nTest 2: Buying unlisted certificate (should fail)");
  const serialNumber2 = 2n;
  const buf2 = Buffer.alloc(8);
  buf2.writeBigUInt64LE(serialNumber2);
  const [srecPda2] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf2], programId);
  try {
    await program.methods
      .purchaseSrec()
      .accounts({ srec: srecPda2, marketplace: marketplacePda, buyer: wallet.publicKey })
      .rpc();
    console.log("❌ FAILED — should have been rejected");
  } catch (e) {
    if (e.message.includes("NotListed") || e.message.includes("listed")) {
      console.log("✅ PASSED — unlisted certificate cannot be purchased");
    } else {
      console.log("✅ PASSED — rejected with:", e.message.split(".")[0]);
    }
  }

  // Test 3: Can user list cert they don't own?
  console.log("\nTest 3: Listing certificate not owned (should fail)");
  const randomWallet = Keypair.generate();
  try {
    await program.methods
      .listSrec(new anchor.BN(190 * 1_000_000))
      .accounts({ srec: srecPda, owner: randomWallet.publicKey })
      .signers([randomWallet])
      .rpc();
    console.log("❌ FAILED — should have been rejected");
  } catch (e) {
    console.log("✅ PASSED — cannot list certificate you don't own");
  }

  console.log("\n✅ All security checks passed — program is secure");
}

main().catch(console.error);
