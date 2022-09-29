// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMercenaries {
    function getName(uint256 _tokenId) external view returns (string memory);

    function setName(uint256 _tokenId, string memory _value) external;
}