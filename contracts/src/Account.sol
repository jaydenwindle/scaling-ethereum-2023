// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "account-abstraction/core/BaseAccount.sol";
import "openzeppelin-contracts/proxy/utils/Initializable.sol";

contract Account is Initializable, BaseAccount {
    bytes public publicKey;
    uint256 _nonce;
    address _entryPoint;
    address verifier;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        bytes calldata _publicKey,
        address entryPoint_,
        address _verifier
    ) public initializer {
        publicKey = _publicKey;
        _entryPoint = entryPoint_;
        verifier = _verifier;
    }

    function nonce() public view override returns (uint256) {
        return _nonce;
    }

    function entryPoint() public view override returns (IEntryPoint) {
        return IEntryPoint(_entryPoint);
    }

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external {
        require(
            msg.sender == address(entryPoint()),
            "account: invalid EntryPoint"
        );
        _call(target, value, data);
    }

    function _call(
        address target,
        uint256 value,
        bytes memory data
    ) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function isSigValid(UserOperation calldata userOp, bytes32 userOpHash)
        public
        returns (
            uint256 validationData,
            bytes memory callData,
            bool success,
            bool valid
        )
    {
        callData = abi.encodePacked(userOp.signature, publicKey, userOpHash);
        (bool success, bytes memory data) = verifier.staticcall(callData);

        bool valid = abi.decode(data, (bool));

        if (!valid) return (SIG_VALIDATION_FAILED, callData, success, valid);

        return (0, callData, success, valid);
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal override returns (uint256 validationData) {
        (bool success, bytes memory data) = verifier.staticcall(
            abi.encodePacked(userOp.signature, publicKey, userOpHash)
        );

        bool valid = abi.decode(data, (bool));

        if (!valid) return SIG_VALIDATION_FAILED;

        return 0;
    }

    function _validateAndUpdateNonce(UserOperation calldata userOp)
        internal
        override
    {
        require(_nonce++ == userOp.nonce, "account: invalid nonce");
    }
}
