// Import the native module. On web, it will be resolved to ExpoHardwareEcdsa.web.ts
// and on native platforms to ExpoHardwareEcdsa.ts
import "fast-text-encoding";
import "@ethersproject/shims";
global.Buffer = global.Buffer || require("buffer").Buffer;

import ExpoHardwareEcdsaModule from "./ExpoHardwareEcdsaModule";

import { toHex, toBytes, concat } from "viem";
import { DERElement } from "asn1-ts";

export async function getPublicKey(keyName: string) {
  const rawPublicKey = await ExpoHardwareEcdsaModule.getPublicKey(keyName);

  return toHex(new Uint8Array(rawPublicKey.slice(1)));
}

export async function sign(keyName: string, data: string) {
  const rawData = toBytes(data);
  const dataArray = Array.from(rawData);
  const rawSig = await ExpoHardwareEcdsaModule.sign(keyName, dataArray);

  const uint8Sig = new Uint8Array(rawSig);

  const element = new DERElement();
  element.fromBytes(uint8Sig);

  const r = BigInt(element.components[0].toString());
  const s = BigInt(element.components[1].toString());

  return concat([toHex(r), toHex(s)]);
}
