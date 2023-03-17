import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ExpoHardwareEcdsa.web.ts
// and on native platforms to ExpoHardwareEcdsa.ts
import ExpoHardwareEcdsaModule from "./ExpoHardwareEcdsaModule";
import ExpoHardwareEcdsaView from "./ExpoHardwareEcdsaView";
import {
  ChangeEventPayload,
  ExpoHardwareEcdsaViewProps,
} from "./ExpoHardwareEcdsa.types";

// Get the native constant value.
export const PI = ExpoHardwareEcdsaModule.PI;

export function hello(): string {
  return ExpoHardwareEcdsaModule.hello();
}

export async function generateKey(name: string) {
  return await ExpoHardwareEcdsaModule.generateKey(name);
}

export async function setValueAsync(value: string) {
  return await ExpoHardwareEcdsaModule.setValueAsync(value);
}

const emitter = new EventEmitter(
  ExpoHardwareEcdsaModule ?? NativeModulesProxy.ExpoHardwareEcdsa
);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}

export {
  ExpoHardwareEcdsaView,
  ExpoHardwareEcdsaViewProps,
  ChangeEventPayload,
};
