// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/P256Verifier.sol";

contract P256VerifierTest is Test {
    function testVerify() public {
        address verifier = address(new P256Verifier());

        uint256 hash = 0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9;
        uint256 X = 51464126346833034610403746633987674135478156615825160336655607949955827445984;
        uint256 Y = 98463248934177300549577374328964885269554720017140314648637159213943028871813;
        uint256 r = 49481763381921737314451753573573838078231659053096009407668998631892829001245;
        uint256 s = 85216614240283288281172811643406195580512980335191870602833302607587475234187;

        (bool success, bytes memory data) = verifier.call(
            abi.encode(r, s, X, Y, hash)
        );

        bool valid = abi.decode(data, (bool));

        assertEq(success, true);
        assertEq(valid, true);
    }
}
