// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import "account-abstraction/core/EntryPoint.sol";
import "../src/AccountFactory.sol";

/* struct UserOperation { */
/*     address sender; */
/*     uint256 nonce; */
/*     bytes initCode; */
/*     bytes callData; */
/*     uint256 callGasLimit; */
/*     uint256 verificationGasLimit; */
/*     uint256 preVerificationGas; */
/*     uint256 maxFeePerGas; */
/*     uint256 maxPriorityFeePerGas; */
/*     bytes paymasterAndData; */
/*     bytes signature; */
/* } */

contract AccountTest is Test {
    EntryPoint entryPoint;
    AccountFactory factory;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new AccountFactory(address(entryPoint));
    }

    function testAccountExecution() public {
        address recipient = vm.addr(1);
        address beneficiary = vm.addr(2);

        bytes
            memory publicKey = hex"98ec4592bc7024e6c28c20fb10c11752e2d38f1063d31b400db98681e467de196c26e48e6570ad7d3f690760f2df6778f5ab42f446fee4d6822765c1a9723413";
        bytes
            memory signature = hex"af569fc8f91f6456160ddf6ef115470af791bf1d0665fea93c7cd371bc79c42fd140836cfa88560491462c7c451359a398dcfeae8e66ac4fdcbf04df2824ec0c";

        bytes memory initCode = abi.encodePacked(
            address(factory),
            abi.encodeWithSignature("create(bytes)", publicKey)
        );

        address sender = factory.predict(publicKey);

        bytes memory callData = abi.encodeWithSignature(
            "execute(address,uint256,bytes)",
            recipient,
            0.1 ether,
            ""
        );

        UserOperation memory op = UserOperation({
            sender: sender,
            nonce: 0,
            initCode: initCode,
            callData: callData,
            callGasLimit: 1000000,
            verificationGasLimit: 1000000,
            preVerificationGas: 1000000,
            maxFeePerGas: block.basefee + 10,
            maxPriorityFeePerGas: 10,
            paymasterAndData: "",
            signature: signature
        });

        bytes32 opHash = entryPoint.getUserOpHash(op);

        console.logBytes32(opHash);

        vm.deal(sender, 10 ether);

        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = op;

        entryPoint.handleOps(ops, payable(beneficiary));

        assertEq(recipient.balance, 0.1 ether);
    }
}
