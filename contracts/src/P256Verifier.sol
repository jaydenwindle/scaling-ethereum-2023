// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./lib/Secp256r1.sol";

contract P256Verifier {
    fallback() external {
        (uint256 r, uint256 s, uint256 X, uint256 Y, uint256 hash) = abi.decode(
            msg.data,
            (uint256, uint256, uint256, uint256, uint256)
        );

        bool valid = Secp256r1.verify(X, Y, r, s, hash);

        assembly {
            mstore(0, valid)
            return(0, 32)
        }
    }
}
