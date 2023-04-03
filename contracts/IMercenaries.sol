// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMercenaries {
    function setName(uint256 _tokenId, string memory _value) external;

    function setMotto(uint256 tokenId, string memory motto) external;
}