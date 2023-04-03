// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMercenaries.sol";

/**
 * Nomen habeo, ergo sum / I have a name, therefore I am
 *
 * @author 0xPanku
 *
 * @dev The purpose of this contract is to provide a name to an ERC-721 token.
 * This contract does not work alone, it must be associated to another contract
 * that will store the name in his own structure (in our case Mercenaries).
 *
 * In order to work the other contract must simply expose one function
 * setName(uint256 _tokenId, string memory _value).
 *
 * To name a token you should call glorify(uint256 _tokenId, string memory _newName)
 * but only the associated contract can do it.
 *
 * ---> This implies that the owner of the contract cannot censor a name !!!
 *
 * Besides the associated contract, this contract has 3 parameters that are publicly available.
 * But only the owner can change them. This is :
 *  - The maximum size of the name
 *  - The price to perform the glorify action
 *  - The ERC20 token to use for payment.
 *
 * A mapping keeps track of every name used to ensure the uniqueness of a name.
 * it can be queried via the isNameReserved(string memory _needle) function.
 *
 * IMPORTANT : It is important to note that by design, this contract does not receive any payment
 * whether in Ether or Erc20. This is the responsibility of the associated contract.
 * There is no way to withdraw fund from this contract.
 *
 * When a name is assigned, the NomenEstOmen event is emitted.
 *
 * Titus Maccius Plautus (c. 254 – 184 BC)
 * “Nōmen atque ōmen quantīvīs iam est pretī” (“The name and the omen are worth any price”).
 */
contract ErgoSum is Ownable {

    // The maximum size of the name
    uint256 public nameMaxLength;

    // The price to perform the glorify action.
    uint256 public namePrice;

    // The address of the ERC20 token used for payment.
    address public erc20Address;

    // The address of the mercenaries contract.
    address public mercenaries;

    // If a name has already been reserved
    mapping(bytes32 => bool) private nameReserved;

    event NomenEstOmen (uint256 indexed tokenId, string newName, string oldName);

    constructor(address _mercenariesContract, address _erc20Addr, uint256 _price, uint256 _maxLength) {
        mercenaries = _mercenariesContract;
        erc20Address = _erc20Addr;
        namePrice = _price;
        nameMaxLength = _maxLength;
    }

    //--------------------------------------------------------------------------------------------//
    // SETTER - onlyOwner
    //--------------------------------------------------------------------------------------------//

    /**
     * @dev Update the price. Only the owner of the contract can perform this action.
     */
    function setPrice(uint256 _newPrice) external onlyOwner {
        namePrice = _newPrice;
    }

    /**
     * @dev Set the size max. Only the owner of the contract can perform this action.
     */
    function setMaxLength(uint256 _newSize) external onlyOwner {
        nameMaxLength = _newSize;
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
    * @dev Returns true if the name is reserved or false if it is available.
    */
    function isNameReserved(string memory _needle) public view returns (bool) {
        return nameReserved[keccak256(abi.encode(_needle))];
    }

    /**
     * @dev Returns true if the name is valid.
     * Allowed characters are [0-9], [a-z] and spaces.
     * Leading spaces, trailing spaces, or more than one space in a row are not allowed.
     */
    function validateName(string memory _str) public view returns (bool) {

        bytes memory b = bytes(_str);

        if (b.length < 1) return false;
        if (b.length > nameMaxLength) return false;

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
            !(char == 0x20) //space
            )
                return false;

            lastChar = char;
        }

        return true;
    }

    //--------------------------------------------------------------------------------------------//
    // CHANGE NAME
    //--------------------------------------------------------------------------------------------//

    /**
     * @notice It is recommended to call validateName and isNameReserved from the frontend before calling
     * this function to avoid an avoidable failure.
     * @dev Change the name of the given token
     * Emit NomenEstOmen if successful
     */
    function glorify(uint256 _tokenId, string memory _newName, string memory _oldName) public {
        require(msg.sender == mercenaries, "403");
        require(validateName(_newName), "Invalid name");
        require(!isNameReserved(_newName), "Reserved name");

        IMercenaries mercenariesCtx = IMercenaries(mercenaries);

        if (bytes(_oldName).length > 0) {
            nameReserved[keccak256(abi.encode(_oldName))] = false;
        }

        nameReserved[keccak256(abi.encode(_newName))] = true;
        mercenariesCtx.setName(_tokenId, _newName);

        emit NomenEstOmen(_tokenId, _newName, _oldName);
    }
}