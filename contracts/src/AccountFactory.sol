// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "openzeppelin-contracts/proxy/Clones.sol";
import "./Account.sol";
import "./P256Verifier.sol";

contract AccountFactory {
    address implementation;
    address entryPoint;
    address verifier;

    constructor(address _entryPoint) {
        entryPoint = _entryPoint;

        implementation = address(new Account());

        if (block.chainid == 42069) {
            // use precompile if available
            verifier = address(0x0100);
        } else {
            verifier = address(new P256Verifier());
        }
    }

    function create(bytes calldata publicKey) external returns (address) {
        address account = Clones.predictDeterministicAddress(
            implementation,
            keccak256(publicKey)
        );

        if (account.code.length == 0) {
            account = Clones.cloneDeterministic(
                implementation,
                keccak256(publicKey)
            );

            Account(account).initialize(publicKey, entryPoint, verifier);
        }

        return account;
    }
}
