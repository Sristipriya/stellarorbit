const { rpc } = require('@stellar/stellar-sdk');
async function run() {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const events = await server.getEvents({
    startLedger: 3730000,
    filters: [
      {
        type: 'contract',
        contractIds: ['CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX'],
      }
    ],
    limit: 1
  });
  console.log(JSON.stringify(events.events[0], null, 2));
}
run().catch(console.error);
