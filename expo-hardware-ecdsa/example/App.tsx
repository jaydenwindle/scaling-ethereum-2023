import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { Paragraph, Spacer, TamaguiProvider, Theme, YStack } from "tamagui";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import config from "./tamagui.config";

import WalletList from "./components/WalletList";

export default function App() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <SafeAreaProvider>
          <WalletList />
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  );
}
