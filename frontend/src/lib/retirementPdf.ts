// Generates a regulatory retirement proof PDF when a utility purchases an SREC.
// In a real submission, this uses jsPDF. For the hackathon we generate a
// rich HTML receipt and trigger browser print/save as PDF.

interface RetirementParams {
  serialNumber: number;
  systemId: string;
  state: string;
  vintageYear: number;
  priceUsdc: number;
  buyerWallet: string;
  txHash: string;
  retiredAt: Date;
}

export async function generateRetirementPDF(
  params: RetirementParams
): Promise<void> {
  // Build HTML retirement certificate
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SREC Retirement Proof — HELIOS-${params.serialNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: "Georgia", serif;
          background: white;
          color: #0A0F1E;
          padding: 48px;
          max-width: 720px;
          margin: 0 auto;
        }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #F5A623; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
        h1 { font-size: 22px; margin: 24px 0 8px; border-bottom: 2px solid #F5A623; padding-bottom: 8px; }
        .cert-id {
          background: #FFF8EC;
          border: 1px solid #F5A623;
          border-radius: 8px;
          padding: 16px 24px;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          color: #0A0F1E;
          margin: 24px 0;
          letter-spacing: 2px;
        }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        td:first-child { color: #666; width: 180px; }
        td:last-child { font-weight: 600; }
        .tx-hash {
          background: #f5f5f5;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: monospace;
          font-size: 10px;
          word-break: break-all;
          color: #333;
        }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #eee;
          font-size: 11px;
          color: #999;
          text-align: center;
        }
        .seal {
          display: inline-block;
          border: 3px solid #F5A623;
          border-radius: 50%;
          width: 80px; height: 80px;
          line-height: 74px;
          text-align: center;
          font-size: 28px;
          margin: 16px auto;
        }
        .status-retired {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
          border-radius: 20px;
          padding: 4px 16px;
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">☀ HELIOS PROTOCOL</div>
        <div class="subtitle">Solar Renewable Energy Certificate Registry</div>
        <div style="margin-top:12px">
          <span class="status-retired">✓ PERMANENTLY RETIRED</span>
        </div>
      </div>

      <h1>Certificate of Retirement</h1>
      <p style="color:#666;font-size:13px;margin-top:8px">
        This document certifies that the following Solar Renewable Energy
        Certificate (SREC) has been permanently retired on the Solana blockchain
        and may be used for compliance with state Renewable Portfolio Standard
        (RPS) obligations. The certificate cannot be resold, transferred, or
        claimed by any other party.
      </p>

      <div class="cert-id">
        HELIOS-${params.serialNumber}-${params.state}-${params.vintageYear}
      </div>

      <h1>Certificate Details</h1>
      <table>
        <tr><td>Certificate ID</td><td>HELIOS-${params.serialNumber}-${params.state}-${params.vintageYear}</td></tr>
        <tr><td>Serial Number</td><td>#${params.serialNumber}</td></tr>
        <tr><td>Solar System</td><td>${params.systemId}</td></tr>
        <tr><td>State</td><td>${params.state}</td></tr>
        <tr><td>Vintage Year</td><td>${params.vintageYear}</td></tr>
        <tr><td>Energy Generated</td><td>1.000 MWh (1,000 kWh)</td></tr>
        <tr><td>Certificate Type</td><td>SREC (Solar Renewable Energy Certificate)</td></tr>
      </table>

      <h1>Transaction Details</h1>
      <table>
        <tr><td>Purchase Price</td><td>$${params.priceUsdc} USDC</td></tr>
        <tr><td>Buyer</td><td>${params.buyerWallet}</td></tr>
        <tr><td>Retired At</td><td>${params.retiredAt.toLocaleString()}</td></tr>
        <tr>
          <td>On-Chain Tx Hash</td>
          <td><span class="tx-hash">${params.txHash}</span></td>
        </tr>
        <tr><td>Blockchain</td><td>Solana (Devnet)</td></tr>
        <tr><td>Retirement Method</td><td>Atomic burn on purchase (smart contract)</td></tr>
      </table>

      <div style="text-align:center;margin-top:32px">
        <div class="seal">☀</div>
        <p style="font-size:13px;color:#666;margin-top:8px">
          This certificate was permanently burned on the Solana blockchain.<br>
          Double-counting is cryptographically impossible.
        </p>
      </div>

      <div class="footer">
        <p>Helios Protocol · Colosseum Frontier Hackathon 2026 · heliosprotocol.xyz</p>
        <p style="margin-top:4px">
          Verify on Solana Explorer:
          https://explorer.solana.com/tx/${params.txHash}?cluster=devnet
        </p>
      </div>
    </body>
    </html>
  `;

  // Open in new window and trigger print dialog (save as PDF)
  if (typeof window !== "undefined") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  }
}
