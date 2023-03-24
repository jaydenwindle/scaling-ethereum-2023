import { StyleSheet, Text, View, Button } from "react-native";

import "fast-text-encoding";
import { keccak256, toHex, toBytes } from "viem";

import * as ExpoHardwareEcdsa from "expo-hardware-ecdsa";

export default function App() {
  return (
    <View style={styles.container}>
      <Button
        onPress={() => {
          const data = keccak256(toHex("hello world"));
          console.log("data", data);

          ExpoHardwareEcdsa.getPublicKey("testing").then(console.log);
          ExpoHardwareEcdsa.sign(
            "testing",
            keccak256(toHex("hello world"))
          ).then(console.log);
        }}
        title="Generate Key"
        color="#841584"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
