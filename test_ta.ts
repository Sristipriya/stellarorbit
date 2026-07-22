import { readContract } from './src/lib/stellar/soroban.ts';
async function run() {
  const ta = await readContract('total_assets', [], 'CDRDDSKIZW4Q2PTA2B3RFAX4ILY5ZPGJF2IQNPQPNKJ3EQFTORD3MCIX');
  console.log('total_assets:', ta);
}
run().catch(console.error);
