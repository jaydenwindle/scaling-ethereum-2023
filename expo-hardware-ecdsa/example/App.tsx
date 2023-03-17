import { StyleSheet, Text, View, Button } from "react-native";

import * as ExpoHardwareEcdsa from "expo-hardware-ecdsa";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{ExpoHardwareEcdsa.hello()}</Text>
      <Button
        onPress={() => ExpoHardwareEcdsa.generateKey("testing")}
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
