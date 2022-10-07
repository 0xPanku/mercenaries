const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Mercenaries", function () {

    let Mercenaries, mercenaries;
    let Demo20, demo20;
    let ErgoSum, ergoSum;
    let Demo721, demo721;
    let owner, lupicaire, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11;

    beforeEach(async () => {

        [owner, lupicaire, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11] = await ethers.getSigners();

        Demo20 = await ethers.getContractFactory("Demo20");
        demo20 = await Demo20.deploy();
        await demo20.deployed();

        Demo721 = await ethers.getContractFactory("Demo721");
        demo721 = await Demo721.deploy();
        await demo721.deployed();

        Mercenaries = await ethers.getContractFactory("Mercenaries");
        mercenaries = await Mercenaries.deploy(lupicaire.address);
        await mercenaries.deployed();

        ErgoSum = await ethers.getContractFactory("ErgoSum");
        ergoSum = await ErgoSum.deploy(mercenaries.address, demo20.address, 10, 12);
        await ergoSum.deployed();
        await mercenaries.setErgoSum(ergoSum.address);
    });

    describe("Check initial parameters and update the contract parameters.", () => {

        it("Check initial public value ", async function () {

            console.log('MAX_SUPPLY = 999')
            expect(await mercenaries.MAX_SUPPLY()).to.equal(999);

            console.log('INITIAL_RECRUITMENT_PRICE = 0.01 ether')
            expect(await mercenaries.INITIAL_RECRUITMENT_PRICE()).to.be.equal(ethers.utils.parseEther("0.01"));

            console.log('GRANDES_COMPAGNIES | 10')
            expect(await mercenaries.GRANDES_COMPAGNIES()).to.equal(10);

            console.log('TROUPE | 5')
            expect(await mercenaries.TROUPE()).to.equal(5);

            console.log('INCREMENT = 1000')
            expect(await mercenaries.INCREMENT()).to.equal(1000);

            console.log('BASE_CAPTAIN = 50%')
            expect(await mercenaries.BASE_CAPTAIN()).to.equal(5000);

            console.log('BASE_SENSEI = 10%')
            expect(await mercenaries.BASE_SENSEI()).to.equal(1000);

            console.log('BASE_CREDITOR_1 = 20%')
            expect(await mercenaries.BASE_CREDITOR_1()).to.equal(2000);

            console.log('BASE_CREDITOR_2 = 12.5%')
            expect(await mercenaries.BASE_CREDITOR_2()).to.equal(1250);

            console.log('BASE_CREDITOR_3 = 7.5%')
            expect(await mercenaries.BASE_CREDITOR_3()).to.equal(750);

            console.log('ergoSum addr ')
            expect(await mercenaries.ergoSum()).to.equal(ergoSum.address);
        });

        // change lupicaire to public to test that.
        /*
        it.only('Update Lupicaire', async function () {
            expect(await mercenaries.lupicaire()).to.equal(lupicaire.address);
            await mercenaries.setLupicaire(addr1.address);
            expect(await mercenaries.lupicaire()).to.equal(addr1.address);
        });
        */

        it('Update ergoSum contract', async function () {
            expect(await mercenaries.ergoSum()).to.equal(ergoSum.address);
            await mercenaries.setErgoSum(addr1.address);
            expect(await mercenaries.ergoSum()).to.equal(addr1.address);
        });

        it('Update setBaseURI', async function () {
            await mercenaries.connect(addr1).mint();
            expect(await mercenaries.tokenURI(1)).to.equal('');
            await mercenaries.setBaseURI('ipfs://LoremIpsum/');
            expect(await mercenaries.tokenURI(1)).to.equal('ipfs://LoremIpsum/1');
        });

        it('Not the owner should not be able to update the Lupicaire address', async function () {
            await expect(mercenaries.connect(addr1).setLupicaire(addr1.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Not the owner should not be able to update the ergoSum address', async function () {
            await expect(mercenaries.connect(addr1).setErgoSum(addr1.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Not the owner should not be able to update the BaseURI', async function () {
            await expect(mercenaries.connect(addr1).setBaseURI('nono')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('SetName and GetName on a non existing token should trigger 404', async function () {
            await expect(mercenaries.connect(addr1).setName(1, 'bayard')).to.be.revertedWith("404");
            await expect(mercenaries.connect(addr1).getName(1)).to.be.revertedWith("404");
        });

        it('Not ergoSum contract should not be able to update the name', async function () {
            await mercenaries.connect(addr1).mint();
            await expect(mercenaries.setName(1, 'bayard')).to.be.revertedWith("403");
            await expect(mercenaries.connect(addr1).setName(1, 'bayard')).to.be.revertedWith("403");
        });
    });

    describe("Check mint function", () => {

        it("Mint one token", async function () {
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.connect(addr1).mint()).to.emit(mercenaries, "Transfer");
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['recruitmentPrice']).to.be.equal(ethers.utils.parseEther("0.01"));
        });

        it("Mint 2 token with same wallet | should fail", async function () {
            await mercenaries.connect(addr1).mint();
            await expect(mercenaries.connect(addr1).mint()).to.be.revertedWith("429");
        });

        /*
        it("Mint max+1 token | should fail 410", async function(){

            // NOTE : adapt MAX_SUPPLY in contract for faster test.
            let nb = 9;

            expect(await mercenaries._tokenIds()).to.equal(0);

            let wallet;

            for( let i=0; i < nb; i++){
                wallet = ethers.Wallet.createRandom();
                wallet =  wallet.connect(ethers.provider);
                await addr1.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
                await mercenaries.connect(wallet).mint();
            }

            expect(await mercenaries._tokenIds()).to.equal(nb);
            wallet = ethers.Wallet.createRandom();
            wallet =  wallet.connect(ethers.provider);
            await addr1.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
            await expect(mercenaries.connect(wallet).mint()).to.be.revertedWith("410");
        });
         */
    });

    describe("Check simple recruitment", () => {

        it("first recruitment | expect to work", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(0);

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(0);

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);
        });

        it("Call recruit function with non existing token | revert => 404", async function () {
            await expect(mercenaries.connect(addr1).recruit(1, 0, 0, 0)).to.be.revertedWith("404");
        });

        it("Call recruit function with not enough fund | revert => 404", async function () {
            await mercenaries.connect(addr1).mint();
            await expect(mercenaries.connect(addr2).recruit(1, 0, 0, 0)).to.be.revertedWith("402");
            await expect(mercenaries.connect(addr2).recruit(1, 0, 0, 0, {value: ethers.utils.parseEther("0.00999")})).to.be.revertedWith("402");
            await expect(mercenaries.connect(addr2).recruit(1, 0, 0, 0, {value: ethers.utils.parseEther("0.00999")})).to.be.revertedWith("402");
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther("0.01")})
            ).to.emit(mercenaries, "Recruited");
        });
    });

    describe("Check recruitment - owner refund", () => {

        it("1st recruitment. Owner should not receive eth, lupicaire should receive 0.01 ", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let balance_lupicaire = await ethers.provider.getBalance(lupicaire.address);

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            let balance_addr1 = await ethers.provider.getBalance(addr1.address);

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_lupicaire_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(lupicaire.address)));
            let balance_lupicaire_expected = parseFloat(ethers.utils.formatEther(balance_lupicaire)) + parseFloat(amount_claim);

            let balance_addr1_2 = await ethers.provider.getBalance(addr1.address);

            expect(balance_lupicaire_2).to.equal(balance_lupicaire_expected);
            expect(balance_addr1).to.equal(balance_addr1_2);
        });

        it("2nd recruitment - Owner has 1 mercenary he should receive -4%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(0);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01 - (0.01 * 0.04); // -4%
            let balance_addr2_expected = balance_addr2 + refund_amount;
            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 2 mercenaries he should receive -3%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr3).mint();

            //CLAIM 2 token with addr2.
            //Become the seinsei of token 2 but not of token 1.
            await expect(
                mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(2);

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01 - (0.01 * 0.03); // -3%

            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 3 mercenaries he should receive -2%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();

            //CLAIM 2 token with addr2.
            //Become the seinsei of token 2 but not of token 1.
            await expect(
                mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(3, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(3);

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(2);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01 - (0.01 * 0.02); // -2%

            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 4 mercenaries he should receive -1%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();
            await mercenaries.connect(addr5).mint();

            //CLAIM 2 token with addr2.
            //Become the sensei of token 2 but not of token 1.
            await expect(
                mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(3, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(4, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(4);

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(3);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01 - (0.01 * 0.01); // -1%

            let balance_addr2_expected = balance_addr2 + refund_amount;
            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 5 mercenaries he should receive 100% of money back", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();
            await mercenaries.connect(addr5).mint();
            await mercenaries.connect(addr6).mint();

            //CLAIM 2 token with addr2.
            //Become the seinsei of token 2 but not of token 1.
            await expect(
                mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(3, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(4, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(5, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(5);

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(4);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01;
            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 6 mercenaries he should receive 100% of money back", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();
            await mercenaries.connect(addr5).mint();
            await mercenaries.connect(addr6).mint();
            await mercenaries.connect(addr7).mint();

            //CLAIM 2 token with addr2.
            //Become the seinsei of token 2 but not of token 1.
            await expect(
                mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(3, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(4, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(5, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr2).recruit(6, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(6);

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(5);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.01;
            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("3rd recruitment - Owner has 1 mercenary he should receive -4%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";
            let amount_claim_3 = "0.0121";

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            await expect(
                mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            let balance_addr1 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));

            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_3)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr1_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));
            let refund_amount = 0.011 - (0.011 * 0.04); // -4%
            let balance_addr1_expected = balance_addr1 + refund_amount;
            expect(balance_addr1_2.toFixed(8)).to.equal(balance_addr1_expected.toFixed(8));
        });
    });

    describe("Check recruitment - SENSEI", () => {

        it("become sensei | expect to work", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER

            //MINT x2
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK SENSEI
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['sensei']).to.equal('0x0000000000000000000000000000000000000000');

            // RECRUIT
            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 2, 2, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(2);

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['sensei']).to.equal(addr2.address);
        });

        it("2nd recruitment | expect SENSEI should not change | SENSEI should receive 1%", async function () {

            let amount_claim = "0.01";   // 0.01 ETHER
            let amount_claim_2 = '' + (parseFloat(amount_claim) * 1.1); // +10%
            let amount_claim_3 = '' + (parseFloat(amount_claim_2) * 1.1); // +10%

            //MINT x2
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();

            //CHECK SENSEI
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['sensei']).to.equal('0x0000000000000000000000000000000000000000');

            // RECRUIT 1st time
            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            // ADDR2 IS SENSEI OF TOKEN 1
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['sensei']).to.equal(addr2.address);

            // RECRUIT  2nd time  refund + 1%
            await mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)});

            let balance_sensei = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            // RECRUIT  3rd time 1% only to sensei
            await mercenaries.connect(addr3).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_3)});

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr3.address)).to.equal(1);

            // CONTRACT ZERO
            expect(await ethers.provider.getBalance(mercenaries.address)).to.equal(0);

            // CHECK SENSEI STILL ADDR2
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['sensei']).to.equal(addr2.address);

            // CHECK BALANCE
            let balance_sensei_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let one_percent_claim_3 = (parseFloat(amount_claim_3) - parseFloat(amount_claim_2)) * 0.1;

            // compute the real balance is complicated. As addr3 get a refund -4%.
            // and those 4% are shared among seisen and lupicaire.
            // in the end sensei should received a bit more than 1%
            let balance_sensei_expected = balance_sensei + one_percent_claim_3;

            expect(balance_sensei_2).to.be.greaterThan(balance_sensei_expected);
        });
    });

    describe("Check recruitment - TROUPE & GRANDES_COMPAGNIES", () => {

        it("When recruiting your 5th mercenary 2 lends action are performed.\n" +
            "When recruiting your 10th mercenary 3 lend actions are performed."
            , async function () {

                let amount_claim_1 = "0.01";   // 0.01 ETHER

                await mercenaries.connect(addr1).mint();
                await mercenaries.connect(addr2).mint();
                await mercenaries.connect(addr3).mint();
                await mercenaries.connect(addr4).mint();
                await mercenaries.connect(addr5).mint();
                await mercenaries.connect(addr6).mint();
                await mercenaries.connect(addr7).mint();
                await mercenaries.connect(addr8).mint();
                await mercenaries.connect(addr9).mint();
                await mercenaries.connect(addr10).mint();
                await mercenaries.connect(addr11).mint();

                let mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor1IsLocked']).to.equal(false);
                expect(mercenary['creditor2IsLocked']).to.equal(false);
                expect(mercenary['creditor3IsLocked']).to.equal(false);

                // 2 token
                await expect(mercenaries.connect(addr1).recruit(2, 2, 2, 2, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(2);

                mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(false);
                expect(mercenary['creditor3IsLocked']).to.equal(false);

                // 3 token
                await expect(mercenaries.connect(addr1).recruit(3, 3, 3, 3, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                // 4 token
                await expect(mercenaries.connect(addr1).recruit(4, 4, 4, 4, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(4);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(false);
                expect(mercenary['creditor3IsLocked']).to.equal(false);

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(4);

                // 5 token
                await expect(mercenaries.connect(addr1).recruit(5, 5, 5, 5, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(5);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(true);
                expect(mercenary['creditor3IsLocked']).to.equal(false);

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(5);

                // 6 token
                await expect(mercenaries.connect(addr1).recruit(6, 6, 6, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                // 7 token
                await expect(mercenaries.connect(addr1).recruit(7, 7, 7, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                // 8 token
                await expect(mercenaries.connect(addr1).recruit(8, 8, 8, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                // 9 token
                await expect(mercenaries.connect(addr1).recruit(9, 9, 9, 9, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(9);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(true);
                expect(mercenary['creditor3IsLocked']).to.equal(false);

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(9);

                // 10 token
                await expect(mercenaries.connect(addr1).recruit(10, 10, 10, 10, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(10);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal(addr1.address);
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(true);
                expect(mercenary['creditor3IsLocked']).to.equal(true);

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(10);

                await expect(mercenaries.connect(addr1).recruit(11, 11, 11, 11, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(11);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal(addr1.address);
                expect(mercenary['sensei']).to.equal(addr1.address);
                expect(mercenary['creditor1IsLocked']).to.equal(true);
                expect(mercenary['creditor2IsLocked']).to.equal(true);
                expect(mercenary['creditor3IsLocked']).to.equal(true);

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(11);
            });
    });

    describe("Check recruitment - multiple recruit", () => {

        it("recruit x5 the same mercenary. Test creditor  ", async function () {

            let amount_claim_1 = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER
            let amount_claim_3 = "0.0121";   // 0.01 ETHER
            let amount_claim_4 = "0.01331";   // 0.01 ETHER
            let amount_claim_5 = "0.014641";   // 0.01 ETHER

            //MINT
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint(); // so addr2 become seinsei
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();
            await mercenaries.connect(addr5).mint();

            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor1IsLocked']).to.equal(false);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // addr2 sensei and creditor 1
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr2.address);
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr1).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_2)}))
                .to.emit(mercenaries, "Recruited");

            // addr1 replace creditor 1
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr3).recruit(2, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(true);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);


            await expect(mercenaries.connect(addr2).recruit(3, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal(addr2.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(true);
            expect(mercenary['creditor3IsLocked']).to.equal(true);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr4).recruit(5, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // It's all locked. addr4 don't get a spot.
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal(addr2.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(true);
            expect(mercenary['creditor3IsLocked']).to.equal(true);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_3)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr2.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal(addr2.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr1).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_4)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal(addr2.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);

            await expect(mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim_5)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal(addr2.address);
            expect(mercenary['creditor2']).to.equal(addr3.address);
            expect(mercenary['creditor3']).to.equal(addr2.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);
            expect(mercenary['sensei']).to.equal(addr2.address);
        });

        it("mint x10 and recruit", async function () {

            let amount_claim_1 = "0.01";   // 0.01 ETHER
            let amount_claim_2 = "0.011";   // 0.01 ETHER

            //MINT
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();
            await mercenaries.connect(addr3).mint();
            await mercenaries.connect(addr4).mint();
            await mercenaries.connect(addr5).mint();
            await mercenaries.connect(addr6).mint();
            await mercenaries.connect(addr7).mint();
            await mercenaries.connect(addr8).mint();
            await mercenaries.connect(addr9).mint();
            await mercenaries.connect(addr10).mint();

            // 2 token
            await expect(mercenaries.connect(addr1).recruit(2, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 3 token
            await expect(mercenaries.connect(addr1).recruit(3, 3, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 4 token
            await expect(mercenaries.connect(addr1).recruit(4, 4, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 5 token
            await expect(mercenaries.connect(addr1).recruit(5, 5, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 6 token
            await expect(mercenaries.connect(addr1).recruit(6, 6, 6, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 7 token
            await expect(mercenaries.connect(addr1).recruit(7, 7, 7, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 8 token
            await expect(mercenaries.connect(addr1).recruit(8, 8, 8, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 9 token
            await expect(mercenaries.connect(addr1).recruit(9, 9, 9, 9, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 10 token
            await expect(mercenaries.connect(addr1).recruit(10, 10, 10, 10, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr1.address)).to.equal(10);

            let mercenary = await mercenaries.mercenaries(10);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr1.address);
            expect(mercenary['creditor3']).to.equal(addr1.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(true);
            expect(mercenary['creditor3IsLocked']).to.equal(true);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(0);


            await expect(mercenaries.connect(addr2).recruit(9, 10, 10, 10, {value: ethers.utils.parseEther(amount_claim_2)}))
                .to.emit(mercenaries, "Recruited");

            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            mercenary = await mercenaries.mercenaries(10);
            expect(mercenary['creditor1']).to.equal(addr1.address);
            expect(mercenary['creditor2']).to.equal(addr1.address);
            expect(mercenary['creditor3']).to.equal(addr1.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(true);
            expect(mercenary['creditor3IsLocked']).to.equal(true);

            await expect(mercenaries.connect(addr2).recruit(10, 10, 10, 10, {value: ethers.utils.parseEther(amount_claim_2)}))
                .to.emit(mercenaries, "Recruited");

            mercenary = await mercenaries.mercenaries(10);
            expect(mercenary['creditor1']).to.equal(addr2.address);
            expect(mercenary['creditor2']).to.equal(addr1.address);
            expect(mercenary['creditor3']).to.equal(addr1.address);
            expect(mercenary['creditor1IsLocked']).to.equal(true);
            expect(mercenary['creditor2IsLocked']).to.equal(false);
            expect(mercenary['creditor3IsLocked']).to.equal(false);

        });
    });

    describe("Check withdraw functions", () => {

        it('Perform 3 rename actions then withdraw all Erc20 from the contract', async function () {

            let amount_claim_1 = "0.01";   // 0.01 ETHER

            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();
            await mercenaries.connect(addr3).mint();

            // 2 token
            await expect(mercenaries.connect(addr1).recruit(2, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            // 3 token
            await expect(mercenaries.connect(addr1).recruit(3, 3, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                .to.emit(mercenaries, "Recruited");

            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '');

            await expect(mercenaries.connect(addr1).glorify(2, 'requiem', 2, 2, 2))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(2, 'requiem', '');

            await expect(mercenaries.connect(addr1).glorify(3, 'guts', 3, 3, 3))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(3, 'guts', '');

            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal(30);
            expect(await demo20.balanceOf(lupicaire.address)).to.be.equal(0);
            await mercenaries.withdraw20(demo20.address);
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal(0);
            expect(await demo20.balanceOf(lupicaire.address)).to.be.equal(30);
        });

        it('Withdraw Erc721 of the given addr from the contract', async function () {

            // Mint 2 tokens with addr1
            expect(await demo721.balanceOf(addr1.address)).to.equal(0);
            await demo721.connect(addr1).mint();
            await demo721.connect(addr1).mint();
            expect(await demo721.balanceOf(addr1.address)).to.equal(2);

            // Transfer the tokens to the  mercenaries contract
            await demo721.connect(addr1).transferFrom(addr1.address, mercenaries.address, 1);
            await demo721.connect(addr1).transferFrom(addr1.address, mercenaries.address, 2);
            expect(await demo721.balanceOf(addr1.address)).to.equal(0);
            expect(await demo721.balanceOf(mercenaries.address)).to.equal(2);

            // Call withdraw721 from mercenaries contract
            expect(await demo721.balanceOf(lupicaire.address)).to.equal(0);
            await mercenaries.withdraw721(demo721.address, [1, 2]);
            expect(await demo721.balanceOf(lupicaire.address)).to.equal(2);
            expect(await demo721.balanceOf(mercenaries.address)).to.equal(0);
        });
    });
});