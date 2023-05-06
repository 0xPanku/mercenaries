// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMercenaries.sol";

/**
 * @title Motto
 * @author 0xPanku
 * @notice The owner of this contract cannot censor a motto.
 * @notice It is important to note that by design, this contract does not receive any payment
 * @notice When a motto is assigned, the MojoMotto event is emitted.
 *
 * @dev The purpose of this contract is to provide a motto to an ERC-721 token.
 * This contract does not work alone, it must be associated to another contract
 * that will store the motto in his own structure (in our case Mercenaries).
 *
 * In order to work the other contract must simply expose one function
 * setMotto(uint256 _tokenId, string memory _value).
 *
 * To give a motto to a token you should call motto(uint256 _tokenId, string memory _newMotto)
 * but only the associated contract can do it.
 *
 * ---> This implies that the owner of the contract cannot censor a motto !!!
 *
 * Besides the associated contract, this contract has 3 parameters that are publicly available.
 * But only the owner can change them. This is :
 *  - The maximum size of the motto
 *  - The price to perform the motto action
 *  - The ERC20 token to use for payment.
 *
 * A mapping keeps track of every motto used to ensure the uniqueness of a motto.
 * it can be queried via the isReserved(string memory _needle) function.
 *
 * IMPORTANT : It is important to note that by design, this contract does not receive any payment
 * whether in Ether or Erc20. This is the responsibility of the associated contract.
 * There is no way to withdraw fund from this contract.
 *
 * When a motto is assigned, the MojoMotto event is emitted.
 *
 */

contract Motto is Ownable {

    // The maximum size of the motto
    uint256 public mottoMaxLength;

    // The price to perform the action.
    uint256 public actionPrice;

    // The address of the ERC20 token used for payment.
    address public erc20Address;

    // The address of the mercenaries contract.
    address public immutable mercenaries;

    // If a motto has already been reserved
    mapping(bytes32 => bool) private mottoReserved;

    event  MojoMotto(uint256 indexed tokenId, string newMotto, string oldMotto);

    constructor(address _mercenariesContract, address _erc20Addr, uint256 _price, uint256 _maxLength) {
        mercenaries = _mercenariesContract;
        erc20Address = _erc20Addr;
        actionPrice = _price;
        mottoMaxLength = _maxLength;
    }

    //--------------------------------------------------------------------------------------------//
    // SETTER - onlyOwner
    //--------------------------------------------------------------------------------------------//

    /**
     * @dev Update the price. Only the owner of the contract can perform this action.
     */
    function setPrice(uint256 _newPrice) external onlyOwner {
        actionPrice = _newPrice;
    }

    /**
     * @dev Set the size max. Only the owner of the contract can perform this action.
     */
    function setMaxLength(uint256 _newSize) external onlyOwner {
        mottoMaxLength = _newSize;
    }

    /**
     * @dev Change the ERC20 token used for payment. Only the owner of the contract can perform this action.
     */
    function setErc20Addr(address _newAddress) external onlyOwner {
        erc20Address = _newAddress;
    }

    //--------------------------------------------------------------------------------------------//
    // UTILS
    //--------------------------------------------------------------------------------------------//

    /**
    * @dev Returns true if the motto is reserved or false if it is available.
    */
    function isReserved(string memory _needle) public view returns (bool) {
        return mottoReserved[keccak256(abi.encode(_needle))];
    }

    /**
     * @dev Returns true if the motto is valid.
     * Allowed characters are [0-9], [a-z] and spaces.
     * Leading spaces, trailing spaces, or more than one space in a row are not allowed.
     */
    function validateMotto(string memory _str) public view returns (bool) {

        bytes memory b = bytes(_str);

        if (b.length < 1) return false;
        if (b.length > mottoMaxLength) return false;

        // Leading space
        if (b[0] == 0x20) return false;

        // Trailing space
        if (b[b.length - 1] == 0x20) return false;

        bytes1 lastChar = b[0];

        for (uint i; i < b.length; i++) {
            bytes1 char = b[i];

            // Checks for the presence of two continuous spaces
            if (char == 0x20 && lastChar == 0x20) return false;

            if (!(char >= 0x30 && char <= 0x39) && //9-0
            !(char >= 0x61 && char <= 0x7A) && //a-z
            !(char == 0x20) && //space
            !(char == 0x21) && //exclamation
            !(char == 0x27) && //apostrophe
            !(char == 0x2c) && //comma
            !(char == 0x2e) //period
            )
                return false;

            lastChar = char;
        }

        return true;
    }

    //--------------------------------------------------------------------------------------------//
    // CHANGE MOTTO
    //--------------------------------------------------------------------------------------------//

    /**
     * @notice It is recommended to call validateMotto and isReserved from the frontend before calling
     * this function to avoid an avoidable failure.
     * @dev Change the motto of the given token
     * Emit MojoMotto if successful
     */
    function motto(uint256 _tokenId, string memory _newMotto, string memory _oldMotto) public {
        require(msg.sender == mercenaries, "403");
        require(validateMotto(_newMotto), "Invalid motto");
        require(!isReserved(_newMotto), "Reserved motto");

        IMercenaries mercenariesCtx = IMercenaries(mercenaries);

        if (bytes(_oldMotto).length > 0) {
            mottoReserved[keccak256(abi.encode(_oldMotto))] = false;
        }

        mottoReserved[keccak256(abi.encode(_newMotto))] = true;
        mercenariesCtx.setMotto(_tokenId, _newMotto);

        emit MojoMotto(_tokenId, _newMotto, _oldMotto);
    }
}