// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IErgoSum {
    function namePrice() external view returns (uint256);

    function erc20Address() external view returns (address);

    function glorify(uint256 _tokenId, string memory _newName, string memory _oldName) external;
}