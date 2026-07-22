const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal, Keypair } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';
const contract = new Contract(trancheId);

async function test() {
  const user = new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT');
  const account = await server.getAccount(user.toString());
  const raw = new TransactionBuilder(
      account,
      { fee: '10000', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('mint', user.toScVal(), nativeToScVal(100000000n, { type: 'i128' }))).setTimeout(30).build();
  
  const prepared = await server.prepareTransaction(raw);
  console.log("Tx simulation succeeded! Required auth entries:", prepared.operations[0].auth ? prepared.operations[0].auth.length : 0);
}
test().catch(console.error);
