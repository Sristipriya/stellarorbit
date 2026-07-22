const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);

async function test() {
  const ptId = 'CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL';
  const ytId = 'CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR';
  const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';

  // Let's test calling mint on PT token directly from trancheId as minter!
  // We simulate what Tranche contract does when calling PT token.
  const ptContract = new Contract(ptId);
  const user = new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT');
  const trancheAddr = new Address(trancheId);

  const raw = new TransactionBuilder(
    new Account(user.toString(), '0'),
    { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
  ).addOperation(ptContract.call('mint', trancheAddr.toScVal(), user.toScVal(), nativeToScVal(1000000000n, { type: 'i128' }))).setTimeout(30).build();

  try {
    const res = await server.simulateTransaction(raw);
    if (res.error) {
      console.error("Direct PT mint simulation error:", res.error);
    } else {
      console.log("Direct PT mint simulation succeeded!");
    }
  } catch (e) {
    console.error("Direct PT mint error:", e.message || e);
  }
}
test();
