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
  getAccount,
  concat,
  getAddress,
} from "viem";
import { foundry, goerli, hardhat, localhost } from "viem/chains";
import axios from "axios";

import EntryPoint from "../EntryPoint.json";
import Account from "../Account.json";
import AccountFactory from "../AccountFactory.json";

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

// goreli
// const FACTORY_CONTRACT = "0xcea50e40Db753b8C12fa94256e878B7997a91c1F";
// const ENTRYPOINT_CONTRACT = "0x0576a174D229E3cFA37253523E645A78A0C91B57";
// const VERIFIER_CONTRACT = "0x36f58b5164b151Be83723210342fF62c7Ea6BC35";
//
// const client = createPublicClient({
//   chain: goerli,
//   transport: http(
//     "https://eth-goerli.g.alchemy.com/v2/TJqDABiMUtSB8UgZosMt8u4CwN7Dca3Z"
//   ),
// });

// hardhat
// const FACTORY_CONTRACT = "0x4299b09BFBeAdD466c66a6188eC7D13E13Fa5AD2";
// const ENTRYPOINT_CONTRACT = "0x81b630c4e08BCD6BF96e7E1d1a5E957E5FA33AEC";
// const VERIFIER_CONTRACT = "0x2eeEDF7e075A469707ef143B2085779e5edACc53";
//
// const client = createPublicClient({
//   chain: hardhat,
//   transport: http("http://localhost:8545"),
// });

// OP R1
const CHAIN_ID = 42069;
const FACTORY_CONTRACT = "0xdAdEFB407Fa99A08C1728e5d7BaA7a11341262D3";
const ENTRYPOINT_CONTRACT = "0xE9B9924982e8935B65cBEf09D7319739be35a8A7";
const VERIFIER_CONTRACT = "0x0000000000000000000000000000000000000100";

const client = createPublicClient({
  chain: {
    ...localhost,
    id: 42069,
  },
  transport: http("http://137.220.41.117:8545"),
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
          <Paragraph fontSize="$7">
            {Number(parseFloat(balance).toFixed(4))} ETH
          </Paragraph>
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
          let initCode = "0x";
          let nonce = 0;
          const bytecode = await client.getBytecode({
            address: address as `0x${string}`,
          });
          const initCodeCalldata = encodeFunctionData({
            abi: AccountFactory.abi,
            functionName: "create",
            args: [publicKey as `0x${string}`],
          });

          const account = getAccount(
            "0x1e9830Cd7c1b945c7640a1d7383616Cc2A194527"
          );

          const creationGasCost = await client.estimateContractGas({
            address: FACTORY_CONTRACT,
            abi: AccountFactory.abi,
            functionName: "create",
            args: [publicKey as `0x${string}`],
            account,
          });

          console.log(creationGasCost);

          if (bytecode === undefined) {
            initCode = encodePacked(
              ["address", "bytes"],
              [FACTORY_CONTRACT, initCodeCalldata]
            );
          } else {
            const accountNonce = await client.readContract({
              address: address as `0x${string}`,
              abi: Account.abi,
              functionName: "nonce",
            });
            nonce = Number(accountNonce);
          }

          const gasPrice = await client.getGasPrice();
          const maxPriorityFeePerGas = Number(parseGwei("1"));
          const maxFeePerGas = Number(gasPrice) + maxPriorityFeePerGas;

          const callData = encodeFunctionData({
            abi: Account.abi,
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
            callGasLimit: 50000,
            verificationGasLimit: 300000,
            preVerificationGas: 50000,
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

          const userOpHash = getUserOpHash(
            userOp,
            ENTRYPOINT_CONTRACT,
            CHAIN_ID
          );

          console.log("here", userOpHash, userOpHashContract);

          const signature = await ExpoHardwareEcdsa.sign(keyName, userOpHash);

          console.log(signature.length);

          userOp.signature = signature;

          console.log(signature, publicKey, userOpHash);

          const data = await client.call({
            account,
            data: concat([
              signature,
              publicKey as `0x${string}`,
              userOpHash as `0x${string}`,
            ]),
            to: getAddress("0x0000000000000000000000000000000000000100"),
          });

          console.log(data);

          // const sigValid = await client.readContract({
          //   address: address as `0x${string}`,
          //   abi: Account.abi,
          //   functionName: "isSigValid",
          //   args: [userOp, userOpHash],
          // });
          //
          // console.log(sigValid);
          //
          // return;

          try {
            (await client.readContract({
              address: ENTRYPOINT_CONTRACT as `0x${string}`,
              abi: EntryPoint.abi,
              functionName: "simulateValidation",
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

          const response = await fetch("http://localhost:4337", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: stringifiedRpcCall,
          });
          const result = await response.json();
          console.log(result);

          Burnt.toast({
            title: "Operation Submitted!",
          });

          onPress();
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

// ["0x098900082A85051dc347fe6E7c2aAC2F2b3Ce734", 0, "0xcea50e40db753b8c12fa94256e878b7997a91c1fcf5ba53f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004098ec4592bc7024e6c28c20fb10c11752e2d38f1063d31b400db98681e467de196c26e48e6570ad7d3f690760f2df6778f5ab42f446fee4d6822765c1a9723413", "0xb61d27f60000000000000000000000005a0d706ce7a9a0df64886e143e6993700ac370a400000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000", 50000, 3000000, 50000, 95877371145, 1, "", "0x6d62c635fc6c2ffa67280f45d1be9dd9e90e4588786cd6363e11b7cb168e541f126a66f65901a05416b6cc4ba04e1bd5d97677775f748aa3a57232399bb53583"]
// {"sender":"0x098900082A85051dc347fe6E7c2aAC2F2b3Ce734","nonce":0,"initCode":"0xcea50e40db753b8c12fa94256e878b7997a91c1fcf5ba53f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004098ec4592bc7024e6c28c20fb10c11752e2d38f1063d31b400db98681e467de196c26e48e6570ad7d3f690760f2df6778f5ab42f446fee4d6822765c1a9723413","callData":"0xb61d27f60000000000000000000000005a0d706ce7a9a0df64886e143e6993700ac370a400000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000","callGasLimit":50000,"verificationGasLimit":3000000,"preVerificationGas":50000,"maxFeePerGas":95877371145,"maxPriorityFeePerGas":1,"paymasterAndData":"0x","signature":"0x6d62c635fc6c2ffa67280f45d1be9dd9e90e4588786cd6363e11b7cb168e541f126a66f65901a05416b6cc4ba04e1bd5d97677775f748aa3a57232399bb53583"}
