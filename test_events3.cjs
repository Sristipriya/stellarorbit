const { rpc, scValToNative } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');

async function run() {
  const events = await server.getEvents({
    startLedger: 3741116,
    pagination: { limit: 10 }
  });
  for (const e of events.events) {
    console.log("Contract:", e.contractId, "| Topics:", e.topic.map(t => scValToNative(t)));
  }
}
run().catch(console.error);
