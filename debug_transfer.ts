
import { xlmToStroops } from './src/lib/stellar/network.js';
import { invokeContract, readContract, addrArg, i128Arg } from './src/lib/stellar/soroban.js';
import { nativeToScVal } from '@stellar/stellar-sdk';

async function run() {
  // We'll use the user's address from the screenshot: GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT
  // But wait, we can't sign for them.
  console.log('We need their secret key.');
}
run();
