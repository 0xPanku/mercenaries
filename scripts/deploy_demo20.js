const hre = require("hardhat");

async function main() {
    await hre.run('compile');
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with the accounts: ${deployer.address}`)
    const Contract = await hre.ethers.getContractFactory("Demo20");
    const ctx = await Contract.deploy();
    await ctx.deployed();
    console.log("Success ! Contract was deployed to : ", ctx.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});