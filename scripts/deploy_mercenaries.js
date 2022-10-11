const hre = require("hardhat");
const {ethers} = require("hardhat");

const DEMO20_ADDR = '0x...';
const LUPICAIRE_ADDR = '0x...';
const ERGOSUM_AMOUNT = '100';
const ERGOSUM_MAX_SIZE = 12;

async function main() {
    await hre.run('compile');
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with the accounts: ${deployer.address}`)
    const Contract = await hre.ethers.getContractFactory("Mercenaries");
    const ctx = await Contract.deploy(LUPICAIRE_ADDR);
    await ctx.deployed();
    console.log("Success ! Mercenaries was deployed to : ", ctx.address);

    const Ergosum = await hre.ethers.getContractFactory("ErgoSum");
    const ergosum = await Ergosum.deploy(ctx.address, DEMO20_ADDR, ethers.utils.parseEther(ERGOSUM_AMOUNT), ERGOSUM_MAX_SIZE);
    await ergosum.deployed();
    console.log("Success ! Ergosum was deployed to : ", ergosum.address);

    console.log("Bind ergosum to mercenaries");
    await ctx.setErgoSum(ergosum.address);
    console.log("Success ! ");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});