const { rpc, scValToNative } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const vaultId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';

async function run() {
  const latest = await server.getLatestLedger();
  const events = await server.getEvents({
    startLedger: latest.sequence - 10000,
    filters: [{ type: 'contract', contractIds: [vaultId] }],
    pagination: { limit: 10 }
  });
  for (const e of events.events) {
    console.log(e.ledger, e.topic.map(t => scValToNative(t)), scValToNative(e.value));
  }
}
run().catch(console.error);
