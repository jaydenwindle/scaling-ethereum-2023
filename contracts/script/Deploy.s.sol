// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "account-abstraction/core/EntryPoint.sol";
import "../src/AccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("GOERLI_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        AccountFactory factory = new AccountFactory(
            0x0576a174D229E3cFA37253523E645A78A0C91B57
        );

        vm.stopBroadcast();
    }
}
