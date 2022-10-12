// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @dev This contract is not intended for deployment. It is a dummy contract used for testing purposes.
 */
contract Demo721 is ERC721 {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("Demo721", "D721") {}

    function mint() public {
        _tokenIds.increment();
        _mint(msg.sender, _tokenIds.current());
    }
}