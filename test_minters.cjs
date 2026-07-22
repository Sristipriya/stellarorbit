const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);

// The oXLM share token - we need to check WHO is its current minter
const shareTokenId = 'CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ';
const ptTokenId = 'CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL';
const ytTokenId = 'CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR';
const user = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';

async function getMinter(tokenId, name) {
  const c = new Contract(tokenId);
  // Call 'set_minter' won't help, but we can check via simulate a call that checks minter
  // Actually let's check the stored minter by calling something that reveals it
  // We'll test if VAULT is the minter by trying to mint 1 stroop FROM vault address
  const vaultId = 'CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P';
  const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';
  
  for (const [caller, callerName] of [[vaultId, 'vault'], [trancheId, 'tranche']]) {
    const raw = new TransactionBuilder(
      new Account(caller, '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(c.call('mint', 
      new Address(caller).toScVal(), 
      new Address(user).toScVal(), 
      nativeToScVal(1n, { type: 'i128' })
    )).setTimeout(30).build();
    
    const result = await server.simulateTransaction(raw);
    if (result.error) {
      console.log(name + ': ' + callerName + ' is NOT minter: ' + (result.error || '').substring(0, 100));
    } else {
      console.log(name + ': ' + callerName + ' IS the minter ?');
    }
  }
}

async function main() {
  await getMinter(shareTokenId, 'oXLM shareToken');
  await getMinter(ptTokenId, 'PT token');
  await getMinter(ytTokenId, 'YT token');
}
main().catch(console.error);
