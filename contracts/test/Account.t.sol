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
            memory publicKey = hex"3eda21bf36adefdd7ef9c1b8deaa3b50b512143738358186b26f9c3111c5bb516f66668f1c2a3d40e1d5c869a022081ae91f7680668ee071100b122159748238";
        bytes
            memory signature = hex"8d1dae699cf33a9ec5cffa0affc4b528f8385e733e1778219dd3dfc8e9470b07d19c969d46b72970c158181e459196cf4323addcb11dc450bb2beccccfc16ef3";

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

        console.log(sender);
        console.logBytes(initCode);
        console.logBytes(callData);

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

        console.log("sender balance:", sender.balance);
    }
}
