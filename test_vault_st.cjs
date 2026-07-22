const { Contract, rpc, Address, xdr, scValToNative } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const vaultId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';

async function test() {
  const contract = new Contract(vaultId);
  const user = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';
  
  // Let's test calling alance on all 5 known share token IDs for user GBIR...
  const tokens = [
    'CC6723AJ66YQD5XRHFK2IEWHBFOMXVZ7R4H75FMERSANYRSRSXRUHHGQ',
    'CC53IN3KBMBG2E4CBUKOU6WFH5V5URNKOVWZLNMH7W6T6RVD2FA5XHNA',
    'CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I',
    'CA7ON47YJBCHPOCLC47JD36TTI44GJOFFP5DY3BOUGIO4NNGQSL3K5OZ',
    'CBCGK6C6UHONKM7NTAPGHHXKQDYLCPFVEYILSQJBF4WSXMP6YI34ZDB4',
  ];

  for (const tid of tokens) {
    try {
      const c = new Contract(tid);
      const res = await server.simulateTransaction(
        new (require('@stellar/stellar-sdk').TransactionBuilder)(
          new (require('@stellar/stellar-sdk').Account)(user, '0'),
          { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
        ).addOperation(c.call('balance', new Address(user).toScVal())).setTimeout(30).build()
      );
      if (res.result) {
        console.log(tid, "=> balance:", scValToNative(res.result.retval));
      }
    } catch (e) {}
  }
}
test();
