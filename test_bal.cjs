const { Contract, rpc, Address, scValToNative } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const user = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';

const tokens = [
  'CC53IN3KBMBG2E4CBUKOU6WFH5V5URNKOVWZLNMH7W6T6RVD2FA5XHNA',
  'CDUJ6L2HPZLT5GK52EMTUQ4OENRTEGWMJVNPFOURX4PYYNI4V677MBM2',
  'CBPIUUIZOEBDO4FA2GZLBFJZPN26YXLXQW7TXSWLO63GKJBJMIQ6RX3S',
  'CBCGK6C6UHONKM7NTAPGHHXKQDYLCPFVEYILSQJBF4WSXMP6YI34ZDB4',
  'CDZSELYERCOI4TXLLDMOLIPDYT4I4OY3RNQXXCLS3ELFTJOZWHNKSQCA',
];

async function check() {
  for (const tid of tokens) {
    try {
      const contract = new Contract(tid);
      const res = await server.simulateTransaction(
        new (require('@stellar/stellar-sdk').TransactionBuilder)(
          new (require('@stellar/stellar-sdk').Account)(user, '0'),
          { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
        ).addOperation(contract.call('balance', new Address(user).toScVal())).setTimeout(30).build()
      );
      if (res.result) {
        console.log(tid, ":", scValToNative(res.result.retval));
      } else {
        console.log(tid, ": simulation failed");
      }
    } catch (e) {
      console.log(tid, "error:", e.message);
    }
  }
}
check();
