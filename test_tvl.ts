import { getVaultState } from './src/lib/stellar/vault.ts';
async function run() {
  const state = await getVaultState(null, 'xlm');
  console.log('State:', state);
}
run().catch(console.error);
