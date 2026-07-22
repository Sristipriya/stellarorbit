const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);

const shareTokenId = 'CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ';
const ptTokenId = 'CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL';
const ytTokenId = 'CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR';
const vaultId = 'CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P';
const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';
// The user whose account we use to build txs (needs valid account on-chain)
const userAddr = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';

async function checkMinter(tokenId, tokenName) {
  const c = new Contract(tokenId);
  const userAccount = await server.getAccount(userAddr);
  
  for (const [caller, callerName] of [[vaultId, 'vault'], [trancheId, 'tranche']]) {
    // simulate a mint from the given caller
    const tx = new TransactionBuilder(
      userAccount,
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(c.call('mint',
      new Address(caller).toScVal(),
      new Address(userAddr).toScVal(),
      nativeToScVal(1n, { type: 'i128' })
    )).setTimeout(30).build();
    
    const result = await server.simulateTransaction(tx);
    const errStr = result.error ? result.error.substring(0, 150) : '';
    const isOnlyMinter = errStr.includes('only minter can call this');
    const isNoError = !result.error;
    
    if (isNoError) {
      console.log(tokenName + ': [' + callerName + '] IS minter ?');
    } else if (isOnlyMinter) {
      console.log(tokenName + ': [' + callerName + '] is NOT minter ?');
    } else {
      console.log(tokenName + ': [' + callerName + '] other error: ' + errStr.substring(0, 80));
    }
  }
}

async function main() {
  await checkMinter(shareTokenId, 'oXLM');
  await checkMinter(ptTokenId, 'PT ');
  await checkMinter(ytTokenId, 'YT ');
}
main().catch(console.error);
