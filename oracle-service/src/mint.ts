import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// ── CONNECTION SETUP ──────────────────────────────────────────

function getConnection(): Connection {
  return new Connection(
    process.env.SOLANA_RPC || "https://api.devnet.solana.com",
    "confirmed"
  );
}

function getWallet(): Keypair {
  const walletPath = process.env.WALLET_PATH || "~/.config/solana/id.json";
  const expanded = walletPath.replace("~", process.env.HOME || "");
  const keypairData = JSON.parse(fs.readFileSync(expanded, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

function getProgramId(): PublicKey {
  const programId = process.env.PROGRAM_ID;
  if (!programId || programId === "REPLACE_WITH_YOUR_PROGRAM_ID") {
    // Return a placeholder for dev mode before deployment
    console.warn("⚠️  PROGRAM_ID not set — running in simulation mode");
    return SystemProgram.programId;
  }
  return new PublicKey(programId);
}

// ── MINT SREC ─────────────────────────────────────────────────

export interface MintResult {
  success: boolean;
  txHash: string;
  serialNumber: number;
  simulated?: boolean;
}

export async function mintSrec(params: {
  systemId: string;
  ownerWallet: string;
  state: string;
  vintageYear: number;
  mwhGenerated: number;
  serialNumber: number;
}): Promise<MintResult> {
  const programId = getProgramId();

  // If program not deployed yet, simulate the mint
  if (programId.equals(SystemProgram.programId)) {
    const fakeTx = `SIMULATED_${Date.now()}_${params.serialNumber}`;
    console.log(`   [SIMULATED] Would mint SREC #${params.serialNumber} on-chain`);
    return {
      success: true,
      txHash: fakeTx,
      serialNumber: params.serialNumber,
      simulated: true,
    };
  }

  try {
    const connection = getConnection();
    const wallet = getWallet();
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(wallet),
      { commitment: "confirmed" }
    );

    // Load IDL from built artifacts
    // After `anchor build`, IDL is at helios-program/target/idl/helios_program.json
    let idl: anchor.Idl;
    try {
      idl = JSON.parse(
        fs.readFileSync(
          "../helios-program/target/idl/helios_program.json",
          "utf-8"
        )
      );
    } catch {
      throw new Error(
        "IDL not found. Run `anchor build` in helios-program/ first."
      );
    }

    const program = new anchor.Program(idl, provider);

    // Derive marketplace PDA
    const [marketplacePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      programId
    );

    // Derive SREC PDA
    const serialNumberBuffer = Buffer.alloc(8);
    serialNumberBuffer.writeBigUInt64LE(BigInt(params.serialNumber));
    const [srecPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("srec"), serialNumberBuffer],
      programId
    );

    const ownerPubkey = new PublicKey(params.ownerWallet);

    // Call mint_srec instruction
    const tx = await program.methods
      .mintSrec({
        systemId: params.systemId,
        state: params.state,
        vintageYear: params.vintageYear,
        mwhGenerated: new anchor.BN(params.mwhGenerated),
        serialNumber: new anchor.BN(params.serialNumber),
      })
      .accounts({
        srec: srecPda,
        marketplace: marketplacePda,
        owner: ownerPubkey,
        oracle: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`   ✅ On-chain tx: ${tx}`);
    console.log(`   🔗 https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return {
      success: true,
      txHash: tx,
      serialNumber: params.serialNumber,
      simulated: false,
    };
  } catch (err) {
    console.error(`   ❌ Mint failed:`, err);
    return {
      success: false,
      txHash: "",
      serialNumber: params.serialNumber,
    };
  }
}
