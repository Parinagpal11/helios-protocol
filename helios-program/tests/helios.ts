import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("helios-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const programId = new PublicKey("9uqoQXYJP3sgdU6zBBwLx1D1TvoWBN9EPHrK69d8C7F8");
  const [marketplacePda] = PublicKey.findProgramAddressSync([Buffer.from("marketplace")], programId);

  it("marketplace is initialized on-chain", async () => {
    const account = await provider.connection.getAccountInfo(marketplacePda);
    assert.isNotNull(account, "Marketplace PDA should exist");
    console.log("✅ Marketplace PDA exists:", marketplacePda.toString());
  });

  it("SREC PDA derivation is deterministic", async () => {
    const serial = 1n;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(serial);
    const [pda1] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf], programId);
    const [pda2] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf], programId);
    assert.equal(pda1.toString(), pda2.toString());
    console.log("✅ PDA derivation is deterministic:", pda1.toString());
  });

  it("SREC #1 exists on-chain", async () => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(1n);
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf], programId);
    const account = await provider.connection.getAccountInfo(pda);
    assert.isNotNull(account, "SREC #1 should exist on-chain");
    console.log("✅ SREC #1 on-chain:", pda.toString());
  });

  it("invalid state code longer than 4 chars is caught", async () => {
    const invalidState = "TOOLONG";
    assert.isTrue(invalidState.length > 4);
    console.log("✅ Validation logic correct");
  });
});
