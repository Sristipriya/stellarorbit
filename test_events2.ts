import { fetchContractEvents, latestLedger } from './src/lib/stellar/soroban.ts';
import { rpcServer } from './src/lib/stellar/soroban.ts';
async function run() {
  const head = await latestLedger();
  const startLedger = Math.max(1, head - 100000);
  console.log('Fetching from ledger:', startLedger, 'to', head);
  
  const server = rpcServer();
  const res = await server.getEvents({
    startLedger,
    filters: [{ type: 'contract', contractIds: ['CDRDDSKIZW4Q2PTA2B3RFAX4ILY5ZPGJF2IQNPQPNKJ3EQFTORD3MCIX'] }],
    limit: 10000,
  });
  console.log('Found', res.events.length, 'events');
  if (res.events.length > 0) {
    console.log('First event topics length:', res.events[0].topic.length);
  }
}
run().catch(console.error);
