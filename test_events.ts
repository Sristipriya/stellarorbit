import { fetchContractEvents, latestLedger } from './src/lib/stellar/soroban.ts';
async function run() {
  const head = await latestLedger();
  const start = Math.max(1, head - 100000);
  console.log('Fetching from ledger:', start, 'to', head);
  const { events } = await fetchContractEvents(start, 'CDRDDSKIZW4Q2PTA2B3RFAX4ILY5ZPGJF2IQNPQPNKJ3EQFTORD3MCIX');
  console.log('Found', events.length, 'events');
  if (events.length > 0) {
    console.log('First event:', events[0]);
  }
}
run().catch(console.error);
