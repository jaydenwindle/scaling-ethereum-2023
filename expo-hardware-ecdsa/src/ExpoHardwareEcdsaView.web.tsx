import * as React from 'react';

import { ExpoHardwareEcdsaViewProps } from './ExpoHardwareEcdsa.types';

export default function ExpoHardwareEcdsaView(props: ExpoHardwareEcdsaViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
