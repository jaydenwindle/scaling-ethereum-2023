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
import { getUserOpHash } from "@account-abstraction/utils";
import {
  keccak256,
  toHex,
  toBytes,
  createPublicClient,
  http,
  formatEther,
  parseAbi,
  encodePacked,
  parseGwei,
  encodeFunctionData,
  parseEther,
} from "viem";
import { foundry, goerli } from "viem/chains";

import EntryPoint from "../EntryPoint.json";

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
import ExpoHardwareEcdsaModule from "expo-hardware-ecdsa/ExpoHardwareEcdsaModule";

const FACTORY_CONTRACT = "0xcea50e40Db753b8C12fa94256e878B7997a91c1F";
const ENTRYPOINT_CONTRACT = "0x0576a174D229E3cFA37253523E645A78A0C91B57";

const client = createPublicClient({
  chain: goerli,
  transport: http(
    "https://eth-goerli.g.alchemy.com/v2/TJqDABiMUtSB8UgZosMt8u4CwN7Dca3Z"
  ),
});

const useWalletData = (keyName: string) => {
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
        address: FACTORY_CONTRACT,
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
  }, [keyName]);

  return { publicKey, address, balance };
};

function AccountListItem({
  keyName,
  onPress,
}: {
  keyName: string;
  onPress: () => void;
}) {
  const { publicKey, address, balance } = useWalletData(keyName);

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
  const { publicKey, address, balance } = useWalletData(keyName);
  const [recipient, setRecipient] = useState("");
  const [value, setValue] = useState("");

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
        <Input
          id="recipient"
          placeholder="0xabc..."
          value={recipient}
          onChangeText={setRecipient}
        />
      </YStack>
      <YStack mb="$4">
        <Label htmlFor="value">Value (ETH)</Label>
        <Input
          id="value"
          placeholder="0.1"
          value={value}
          onChangeText={setValue}
        />
      </YStack>
      <Button
        icon={Send}
        size="$5"
        theme="blue"
        onPress={async () => {
          let initCode = "";
          let nonce = 0;
          const accountAbi = parseAbi([
            "function nonce() public view returns (uint256)",
            "function execute(address target, uint256 value, bytes calldata data) external",
          ]);

          const bytecode = await client.getBytecode({
            address: address as `0x${string}`,
          });

          if (bytecode === undefined) {
            const factoryAbi = parseAbi([
              "function create(bytes calldata publicKey) external returns (address)",
            ]);
            const initCodeCalldata = encodeFunctionData({
              abi: factoryAbi,
              functionName: "create",
              args: [publicKey as `0x${string}`],
            });
            initCode = encodePacked(
              ["address", "bytes"],
              [FACTORY_CONTRACT, initCodeCalldata]
            );
          } else {
            const accountNonce = await client.readContract({
              address: address as `0x${string}`,
              abi: accountAbi,
              functionName: "nonce",
            });
            nonce = Number(accountNonce);
          }

          const gasPrice = await client.getGasPrice();
          const maxPriorityFeePerGas = Number(parseGwei("100"));
          const maxFeePerGas = Number(gasPrice) + maxPriorityFeePerGas;

          const callData = encodeFunctionData({
            abi: accountAbi,
            functionName: "execute",
            args: [
              recipient as `0x${string}`,
              parseEther(value as `${number}`),
              "" as `0x${string}`,
            ],
          });

          const userOp = {
            sender: address,
            nonce,
            initCode,
            callData,
            callGasLimit: 1500000,
            verificationGasLimit: 1500000,
            preVerificationGas: 1500000,
            maxFeePerGas,
            maxPriorityFeePerGas,
            paymasterAndData: "0x",
            signature: "0x",
          };

          const userOpHashContract = (await client.readContract({
            address: ENTRYPOINT_CONTRACT as `0x${string}`,
            abi: EntryPoint.abi,
            functionName: "getUserOpHash",
            args: [userOp],
          })) as `0x${string}`;

          const userOpHash = getUserOpHash(userOp, ENTRYPOINT_CONTRACT, 5);

          console.log("here", userOpHash, userOpHashContract);

          const signature = await ExpoHardwareEcdsa.sign(keyName, userOpHash);

          console.log(signature.length);

          userOp.signature = signature;

          try {
            (await client.readContract({
              address: ENTRYPOINT_CONTRACT as `0x${string}`,
              abi: EntryPoint.abi,
              functionName: "simulateHandleOp",
              args: [userOp],
            })) as `0x${string}`;
          } catch (error) {
            console.log("simulated result: ", error);
          }

          const rpcCall = {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendUserOperation",
            params: [userOp, ENTRYPOINT_CONTRACT],
          };

          const stringifiedRpcCall = JSON.stringify(rpcCall);

          const response = await fetch(
            "https://api.blocknative.com/v1/goerli/bundler",
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: stringifiedRpcCall,
            }
          );

          const result = await response.json();

          console.log(result);
        }}
      >
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
