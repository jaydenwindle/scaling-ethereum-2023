import "fast-text-encoding";

import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import {
  keccak256,
  toHex,
  toBytes,
  createPublicClient,
  http,
  formatEther,
  parseAbi,
} from "viem";
import { localhost } from "viem/chains";

import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle, Send, X } from "@tamagui/lucide-icons";
import { generateSlug } from "random-word-slugs";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";

import * as ExpoHardwareEcdsa from "expo-hardware-ecdsa";

import {
  Button,
  XStack,
  YStack,
  H2,
  H4,
  Sheet,
  Paragraph,
  Input,
  Label,
} from "tamagui";

const client = createPublicClient({
  chain: localhost,
  transport: http(),
});

function AccountListItem({
  keyName,
  onPress,
}: {
  keyName: string;
  onPress: () => void;
}) {
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    async function getWalletData() {
      const pk = await ExpoHardwareEcdsa.getPublicKey(keyName);
      setPublicKey(pk);

      const abi = parseAbi([
        "function predict(bytes calldata publicKey) external view returns (address)",
      ]);

      const remoteAddress = await client.readContract({
        address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        abi: abi,
        functionName: "predict",
        args: [pk as `0x${string}`],
      });

      setAddress(remoteAddress);

      const remoteBalance = await client.getBalance({
        address: remoteAddress,
      });

      setBalance(formatEther(remoteBalance).toString());
    }

    getWalletData();
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={async () => {
        Burnt.toast({
          title: "Address copied",
        });
        await Clipboard.setStringAsync(address);
      }}
    >
      <YStack px="$4" py="$4" borderBottomWidth={1} borderBottomColor="$gray2">
        <XStack flex={1} flexDirection="row">
          <YStack flex={1} pr="$6">
            <Paragraph flex={1} numberOfLines={1}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Paragraph>
          </YStack>
          <Paragraph fontSize="$7">{balance} ETH</Paragraph>
        </XStack>
      </YStack>
    </TouchableOpacity>
  );
}

function AccountSheet({
  keyName,
  onPress,
}: {
  keyName: string;
  onPress: () => void;
}) {
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (keyName) {
      ExpoHardwareEcdsa.getPublicKey(keyName).then((pk) => {
        setPublicKey(pk);
        setAddress(pk.slice(0, 44));
      });
    }
  }, [keyName]);

  return (
    <YStack p="$4">
      <XStack jc="space-between">
        <Paragraph fontSize="$7" numberOfLines={1} mb="$4">
          {address.slice(0, 6)}...{address.slice(-4)}
        </Paragraph>
        <TouchableOpacity onPress={onPress}>
          <X />
        </TouchableOpacity>
      </XStack>
      <YStack>
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input id="recipient" placeholder="0xabc..." />
      </YStack>
      <YStack mb="$4">
        <Label htmlFor="value">Value (ETH)</Label>
        <Input id="value" placeholder="0.1" />
      </YStack>
      <Button icon={Send} size="$5" theme="blue">
        Transfer
      </Button>
    </YStack>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState<Array<string>>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>();

  const { getItem, setItem, removeItem } = useAsyncStorage("@accounts");

  const readAccountsFromStorage = async () => {
    const item = await getItem();
    setAccounts(JSON.parse(item ?? "[]"));
  };

  const writeAccountsToStorage = async (newValue: Array<string>) => {
    await setItem(JSON.stringify(newValue ?? "[]"));
    setAccounts(newValue);
  };

  useEffect(() => {
    readAccountsFromStorage();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1}>
        <YStack flex={1}>
          <H2 px="$4" my="$3" fontFamily="InterBold">
            My Wallets
          </H2>
          <FlatList
            data={accounts}
            renderItem={({ item }) => (
              <AccountListItem
                keyName={item}
                onPress={() => setSelectedAccount(item)}
              />
            )}
            keyExtractor={(item) => item}
          />
        </YStack>
        <YStack px="$4" py="$2">
          <Button
            icon={PlusCircle}
            size="$5"
            theme="blue"
            onPress={() => {
              writeAccountsToStorage([...accounts, generateSlug()]);
              const data =
                "0x791cb696b21a4c9d467bcc78ce053cd033b6d74fe268f179415d9731f370a653";
              console.log("data", data);

              ExpoHardwareEcdsa.getPublicKey("testing").then(console.log);
              ExpoHardwareEcdsa.sign(
                "testing",
                keccak256(toHex("hello world"))
              ).then(console.log);
            }}
          >
            New Wallet
          </Button>
        </YStack>
      </YStack>
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={selectedAccount !== undefined}
        onRequestClose={() => {
          setSelectedAccount(undefined);
        }}
      >
        <AccountSheet
          keyName={selectedAccount || ""}
          onPress={() => setSelectedAccount(undefined)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
