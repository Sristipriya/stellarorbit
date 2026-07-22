import { readContract } from './src/lib/stellar/soroban.ts';
async function run() {
  const ta = await readContract('total_assets', [], 'CDYTMJGLGXG4TDQGCSAL6BC7ZXEREK5UNRSEIN2N47FMAOQQLOXAS7CQ');
  console.log('total_assets:', ta);
}
run().catch(console.error);
