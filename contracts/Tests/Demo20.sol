// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is not intended for deployment. It is a dummy contract used for testing purposes.
 */
contract Demo20 is ERC20, Ownable {

    uint256 public constant MAX_TOKEN = 21000000;
    uint256 public constant MAX_MINT = 200;
    uint256 public constant COOL_DOWN_INTERVAL = 10 minutes;
    uint256 public nbToken = 0;
    mapping(address => uint256) public coolDown;

    constructor() ERC20("DEMO20", "\xCE\xA3\x57\x47") {}

    // Free Money !
    function mint(uint256 amount) public {
        require(amount <= MAX_MINT, "Everybody be Cool, This is a Robbery!");
        require(amount > 0, "Sorry, no refund");
        require(nbToken <= MAX_TOKEN - amount, "Sorry the bank is broke");
        require(coolDown[msg.sender] <= block.timestamp, "It's not pay day yet.");
        coolDown[msg.sender] = block.timestamp + COOL_DOWN_INTERVAL;
        nbToken += amount;
        _mint(msg.sender, amount * 10 ** decimals());
    }
}
