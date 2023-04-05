// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMotto {
    function actionPrice() external view returns (uint256);

    function erc20Address() external view returns (address);

    function motto(uint256 _tokenId, string memory _newMotto, string memory _oldMotto) external;
}