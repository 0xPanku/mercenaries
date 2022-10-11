# Mercenaries of Efyria

Mercenaries of Efyria is a chaotic collection of 999 unique ERC-721 token on the Ethereum blockchain.

"No gods, no masters — as the saying goes."

They understood it so well, that they engraved it on their souls.
If you have to remember only one thing, then know that you will never be the true master of a mercenary.

You have been warned.

In a kingdom forgotten by the gods, ruled by greedy men, without morals or scruples, wars and skirmishes are commonplace.
In this chaotic context, the free companies and their mercenaries play the game well.
Sometimes highwaymen, local militia or simple cannon fodder, the powerful compete for their services 
but loyalty of these mad dogs is as tenuous as the virtue of a courtesan.


## Sub-folders
`/contracts` - Solidity contracts as deployed on-chain

`/scripts` - Scripts used to deploy the contracts

`/test` - Tests run on the contracts

## Script

> npx hardhat run scripts/deploy_mercenaries.js --network goerli

This script will deploy the Mercenaries contract with the ErgoSum contact and then bind it.

The network is specified with the option --network. 

The parameters must be adjusted in the script before deployment.

Note : you can use any ERC20 token address as a parameter or deploy a dummy ERC20 token with the deploy_demo20.js script before to deploy the mercenary contract.

## Tests

> npx hardhat test test/mercenaries.js

> npx hardhat test test/ergosum.js

## Links

* [Website](https://efyria.net)
* [Twitter - Efyria](https://twitter.com/Efyria_epic)
* [Twitter - 0xPanku](https://twitter.com/0xPanku)
* [Youtube - 0xPanku](https://www.youtube.com/channel/UCfq1idy9ueGyHKwNTt07giA?sub_confirmation=1)
* [Discord](https://discord.gg/RG8MbBKG3z)