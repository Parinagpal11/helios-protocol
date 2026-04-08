const { Connection, PublicKey } = require("@solana/web3.js");

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const programId = new PublicKey("9uqoQXYJP3sgdU6zBBwLx1D1TvoWBN9EPHrK69d8C7F8");

async function checkSrecs() {
  for (let serial = 1; serial <= 3; serial++) {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(serial));
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("srec"), buf], programId);
    const account = await connection.getAccountInfo(pda);
    if (account) {
      console.log(`✅ SREC #${serial} exists on-chain`);
      console.log(`   PDA: ${pda.toString()}`);
      console.log(`   https://explorer.solana.com/address/${pda.toString()}?cluster=devnet`);
    } else {
      console.log(`❌ SREC #${serial} not found`);
    }
  }
}

checkSrecs().catch(console.error);
