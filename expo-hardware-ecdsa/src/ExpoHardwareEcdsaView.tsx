import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { ExpoHardwareEcdsaViewProps } from './ExpoHardwareEcdsa.types';

const NativeView: React.ComponentType<ExpoHardwareEcdsaViewProps> =
  requireNativeViewManager('ExpoHardwareEcdsa');

export default function ExpoHardwareEcdsaView(props: ExpoHardwareEcdsaViewProps) {
  return <NativeView {...props} />;
}
