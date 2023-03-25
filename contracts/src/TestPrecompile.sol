// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract TestPrecompile {
    function secp256r1Verify(
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y,
        bytes32 hash
    ) public view returns (uint8) {
        uint8 output;

        bytes memory args = abi.encodePacked(r, s, x, y, hash);

        assembly {
            if iszero(
                // 0x10 for the precompile address
                // add(args, 32) for ???
                // 0xa0 for the size of the input (160 bytes)
                // output for the output
                // 0x01 for the size of the output flag (1 byte)
                staticcall(not(0), 0x10, add(args, 32), 0xa0, output, 0x01)
            ) {
                revert(0, 0)
            }
        }

        return output;
    }
}
