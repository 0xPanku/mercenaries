const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Mercenaries", function () {

    const oneDay = 24 * 60 * 60;
    const iprice = 0.01
    const SENSEI_THRESHOLD = 0;

    let Mercenaries, mercenaries;
    let Demo20, demo20;
    let ErgoSum, ergoSum;
    let Motto, motto;
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
        mercenaries = await Mercenaries.deploy(lupicaire.address, SENSEI_THRESHOLD);
        await mercenaries.deployed();

        ErgoSum = await ethers.getContractFactory("ErgoSum");
        ergoSum = await ErgoSum.deploy(mercenaries.address, demo20.address, ethers.utils.parseEther("1"), 12);
        await ergoSum.deployed();
        await mercenaries.setErgoSum(ergoSum.address);

        Motto = await ethers.getContractFactory("Motto");
        motto = await Motto.deploy(mercenaries.address, demo20.address, ethers.utils.parseEther("1"), 99);
        await motto.deployed();
        await mercenaries.setMottoCtx(motto.address);
    });

    describe("Check initial parameters and update the contract parameters.", () => {

        it("Check initial public value ", async function () {

            console.log('MAX_SUPPLY = 999')
            expect(await mercenaries.MAX_SUPPLY()).to.equal(999);

            console.log('INITIAL_RECRUITMENT_PRICE = 0.01 ether')
            expect(await mercenaries.INITIAL_RECRUITMENT_PRICE()).to.be.equal(ethers.utils.parseEther("0.01"));

            console.log('GRANDE_COMPAGNIE | 20')
            expect(await mercenaries.GRANDE_COMPAGNIE()).to.equal(20);

            console.log('PELETON | 10')
            expect(await mercenaries.PELETON()).to.equal(10);

            console.log('TROUPE | 5')
            expect(await mercenaries.TROUPE()).to.equal(5);

            console.log('INCREMENT = 1500')
            expect(await mercenaries.increment()).to.equal(1500);

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

            console.log('SENSEI_THRESHOLD = ' + SENSEI_THRESHOLD)
            expect(await mercenaries.SENSEI_THRESHOLD()).to.equal(SENSEI_THRESHOLD);
        });

        // change lupicaire to public to test that.
        /*
        it('Update Lupicaire', async function () {
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
            await expect(mercenaries.connect(addr1).setMercenaryName(1, 'bayard')).to.be.revertedWith("404");
        });

        it('Not ergoSum contract should not be able to update the name', async function () {
            await mercenaries.connect(addr1).mint();
            await expect(mercenaries.setMercenaryName(1, 'bayard')).to.be.revertedWith("403");
            await expect(mercenaries.connect(addr1).setMercenaryName(1, 'bayard')).to.be.revertedWith("403");
        });
    });

    describe("Check mint function", () => {

        it("Mint one token", async function () {
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.connect(addr1).mint()).to.emit(mercenaries, "Transfer");
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.getRecruitmentPrice(1)).to.be.equal(ethers.utils.parseEther("0.0115"));
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

    describe("Check mint for X function", () => {

        it('Not the owner should not be able to call Mint for X', async function () {
            await expect(mercenaries.connect(addr1).mintForX([addr1.address, addr2.address])).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Mint 150 token for same address", async function () {
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            await mercenaries.mintForX(Array(150).fill(addr1.address));
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(150);
        });
    });

    describe("Check royalties price update", () => {

        it('Check all setIncrement', async function () {

            expect(await mercenaries.increment()).to.equal(1500);

            // FORWARD 1 DAY
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            await ethers.provider.send('evm_mine');

            // MINT 777 TOKENS
            let wallet = [];
            let wallet_addr = [];
            let nb = 777;
            let batch_size = 100;
            for (let i = 1; i <= nb; i++) {
                wallet[i] = ethers.Wallet.createRandom();
                wallet[i] = wallet[i].connect(ethers.provider);
                wallet_addr.push(wallet[i].address);

                if (i % batch_size === 0) {
                    console.log('mint for x batch :' + wallet_addr.length);
                    await mercenaries.mintForX(wallet_addr);
                    wallet_addr = [];
                }
            }

            if (wallet_addr.length > 0) {
                console.log('mint for x batch :' + wallet_addr.length);
                await mercenaries.mintForX(wallet_addr);
            }

            // GIVE ETHER TO WALLET SO IT CAN PERFORM A TX LATTER
            await addr1.sendTransaction({to: wallet[80].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[85].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[90].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[95].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[100].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[105].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[110].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[115].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[120].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[125].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[130].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[135].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[140].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[145].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallet[150].address, value: ethers.utils.parseEther("1")});

            // NOT OWNER TRY TO UPDATE SHOULD FAIL
            await expect(mercenaries.connect(addr1).setIncrement_800()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_850()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_900()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_950()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1000()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1050()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1100()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1150()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1200()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1250()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1300()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1350()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1400()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1450()).to.be.revertedWith('403');
            await expect(mercenaries.connect(addr1).setIncrement_1500()).to.be.revertedWith('403');

            // CHECK INITIAL RECRUITMENT PRICE
            let amount_claim = "0.0115";
            expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther(amount_claim));
            await expect(mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})).to.emit(mercenaries, "Recruited");
            expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther(await getNextPrice(amount_claim)));

            await changeFee(wallet[80], 80, 1500, 800, await getNextPrice(amount_claim, 8)); // "0.01242"
            await changeFee(wallet[85], 85, 800, 850, "0.0124775"); // round fail.
            await changeFee(wallet[90], 90, 850, 900, await getNextPrice(amount_claim, 9));
            await changeFee(wallet[95], 95, 900, 950, await getNextPrice(amount_claim, 9.5));
            await changeFee(wallet[100], 100, 950, 1000, await getNextPrice(amount_claim, 10));
            await changeFee(wallet[105], 105, 1000, 1050, await getNextPrice(amount_claim, 10.5));
            await changeFee(wallet[110], 110, 1050, 1100, await getNextPrice(amount_claim, 11));
            await changeFee(wallet[115], 115, 1100, 1150, await getNextPrice(amount_claim, 11.5));
            await changeFee(wallet[120], 120, 1150, 1200, "0.01288");
            await changeFee(wallet[125], 125, 1200, 1250, await getNextPrice(amount_claim, 12.5));
            await changeFee(wallet[130], 130, 1250, 1300, await getNextPrice(amount_claim, 13));
            await changeFee(wallet[135], 135, 1300, 1350, await getNextPrice(amount_claim, 13.5));
            await changeFee(wallet[140], 140, 1350, 1400, await getNextPrice(amount_claim, 14));
            await changeFee(wallet[145], 145, 1400, 1450, await getNextPrice(amount_claim, 14.5));
            await changeFee(wallet[150], 150, 1450, 1500, await getNextPrice(amount_claim, 15));
        });

        it('Token must exist | Check timeout | Not owner should not be able to update setIncrement_800', async function () {

            // TIMEOUT SHOULD FAIL
            await expect(mercenaries.connect(addr1).setIncrement_800()).to.be.revertedWith('425');

            // FORWARD 1 DAY
            await ethers.provider.send('evm_increaseTime', [oneDay]);
            await ethers.provider.send('evm_mine');

            // TOKEN NOT EXIST SHOULD FAIL
            await expect(mercenaries.connect(addr1).setIncrement_800()).to.be.revertedWith('ERC721: invalid token ID');

            // MINT 777 TOKENS
            let wallet = [];
            let wallet_addr = [];
            let nb = 777;
            let batch_size = 100;
            for (let i = 1; i <= nb; i++) {
                wallet[i] = ethers.Wallet.createRandom();
                wallet[i] = wallet[i].connect(ethers.provider);
                wallet_addr.push(wallet[i].address);

                if (i % batch_size === 0) {
                    console.log('mint for x batch :' + wallet_addr.length);
                    await mercenaries.mintForX(wallet_addr);
                    wallet_addr = [];
                }
            }

            if (wallet_addr.length > 0) {
                console.log('mint for x batch :' + wallet_addr.length);
                await mercenaries.mintForX(wallet_addr);
            }

            let addr80 = wallet[80]
            await addr1.sendTransaction({to: wallet[80].address, value: ethers.utils.parseEther("1")});


            // NOT OWNER TRY TO UPDATE SHOULD FAIL
            await expect(mercenaries.connect(addr1).setIncrement_800()).to.be.revertedWith('403');

            // UNNAMED TOKEN SHOULD FAIL
            await expect(mercenaries.connect(addr80).setIncrement_800()).to.be.revertedWith('400');

            await demo20.connect(addr80).mint(20);
            await demo20.connect(addr80).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await expect(mercenaries.connect(addr80).glorify(80, '0xpanku', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(80, '0xpanku', '');

            // NO MOTTO TOKEN SHOULD FAIL
            await expect(mercenaries.connect(addr80).setIncrement_800()).to.be.revertedWith('400');
            await expect(mercenaries.connect(addr80).mottoMojo(80, 'tartiflette for the win !', 1, 1, 1))
                .to.emit(motto, 'MojoMotto')
                .withArgs(80, 'tartiflette for the win !', '');

            let amount_claim = "0.0115";
            expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther(amount_claim));
            await expect(mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})).to.emit(mercenaries, "Recruited");
            // FEE IS 15%
            expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther("0.013225"));

            // UPDATE WITH RIGHT PERMISSION SHOULD WORK
            expect(await mercenaries.increment()).to.equal(1500);
            await expect(mercenaries.connect(addr80).setIncrement_800()).to.emit(mercenaries, "GreedinessUpdated").withArgs(addr80.address, 1500, 800);
            expect(await mercenaries.increment()).to.equal(800);

            // NOW FEE IS 8% RECRUITMENT PRICE SHOULD CHANGE
            expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther("0.01242"));

            // RE - UPDATE SHOULD FAIL BY TIMEOUT
            await expect(mercenaries.connect(addr80).setIncrement_800()).to.be.revertedWith('425');

        });
    });

    describe("Check simple recruitment", () => {

        it("first recruitment | expect to work", async function () {

            let amount_claim = await getNextPrice();

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
            await expect(mercenaries.connect(addr2).recruit(1, 0, 0, 0, {value: ethers.utils.parseEther("0.011499")})).to.be.revertedWith("402");
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther("0.0115")})
            ).to.emit(mercenaries, "Recruited");
        });
    });

    describe("Check recruitment - owner refund", () => {

        it("1st recruitment. Owner should not receive eth, lupicaire should receive 0.0115 ", async function () {

            let amount_claim = await getNextPrice();   // 0.0115 ETHER
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

            let amount_claim = await getNextPrice();

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            let balance_addr2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1));

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(0);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = 0.0115 - (0.0115 * 0.04); // -4%
            let balance_addr2_expected = balance_addr2 + refund_amount;
            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 2 mercenaries he should receive -3%", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = amount_claim - (amount_claim * 0.03); // -3%

            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 3 mercenaries he should receive -2%", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115
            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(2);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = amount_claim - (amount_claim * 0.02); // -2%

            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 4 mercenaries he should receive -1%", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(3);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = amount_claim - (amount_claim * 0.01); // -1%

            let balance_addr2_expected = balance_addr2 + refund_amount;
            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 5 mercenaries he should receive 100% of money back", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(4);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = await getNextPrice(0, null, false);
            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("2nd recruitment - Owner has 6 mercenaries he should receive 100% of money back", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            //CLAIM TOKEN 1 (owner addr 2) by ADDR1
            await expect(
                mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(5);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr2_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));
            let refund_amount = await getNextPrice(0, null, false);
            let balance_addr2_expected = balance_addr2 + refund_amount;

            expect(balance_addr2_2.toFixed(8)).to.equal(balance_addr2_expected.toFixed(8));
        });

        it("3rd recruitment - Owner has 1 mercenary he should receive -4%", async function () {

            let amount_claim = await getNextPrice();

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //CLAIM TOKEN 1 (owner addr 1) by ADDR2
            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            await expect(
                mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)})
            ).to.emit(mercenaries, "Recruited");

            let balance_addr1 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));

            let amount_claim_3 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.013225

            await expect(
                mercenaries.connect(addr2).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_3)})
            ).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr1_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));
            let refund_amount = parseFloat(amount_claim_2) - (parseFloat(amount_claim_2) * 0.04); // -4%
            let balance_addr1_expected = balance_addr1 + refund_amount;
            expect(balance_addr1_2.toFixed(8)).to.equal(balance_addr1_expected.toFixed(8));
        });
    });

    describe("Check recruitment - SENSEI", () => {

        it("become sensei | expect to work", async function () {

            let amount_claim = await getNextPrice();

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

            let amount_claim = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            // RECRUIT  2nd time  refund + 1%
            await mercenaries.connect(addr1).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_2)});

            let balance_sensei = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr2.address)));

            let amount_claim_3 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

            // RECRUIT  3rd time 1% only to sensei
            await mercenaries.connect(addr3).recruit(1, 2, 0, 0, {value: ethers.utils.parseEther(amount_claim_3)}); //0.013225

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

    describe("Check recruitment - TROUPE & GRANDE_COMPAGNIE", () => {

        it("When recruiting your 5th mercenary 2 lends action are performed.\n" +
            "When recruiting your 10th mercenary 3 lend actions are performed."
            , async function () {

                let amount_claim_1 = await getNextPrice();

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

        it("As a GRANDE_COMPAGNIE when one of my mercenaries is recruited I should get 1% premium.", async function () {

            // ADDR_2 mint one.
            await mercenaries.connect(addr2).mint();
            await mercenaries.connect(addr3).mint();

            // MINT 20 mercenaries for ADDR_1
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(0);
            await mercenaries.mintForX(Array(20).fill(addr1.address));
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(20);


            //Recruit with addr3. (sensei)
            let price_recruit_1 = await getNextPrice();
            await expect(mercenaries.connect(addr3).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(price_recruit_1)})).to.emit(mercenaries, "Recruited");

            let balance_addr1_before_tx = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));

            //Recruit with addr1.
            let price_recruit_2 = await getNextPrice(price_recruit_1, 15);
            await expect(mercenaries.connect(addr1).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(price_recruit_2)})).to.emit(mercenaries, "Recruited");

            let balance_addr1 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));

            //Recruit with addr2.
            let price_recruit_3 = await getNextPrice(price_recruit_2, 15);
            await expect(mercenaries.connect(addr2).recruit(1, 10, 0, 0, {value: ethers.utils.parseEther(price_recruit_3)})).to.emit(mercenaries, "Recruited");

            //CHECK AMOUNT OF TOKEN
            expect(await mercenaries.balanceOf(addr1.address)).to.equal(20);
            expect(await mercenaries.balanceOf(addr2.address)).to.equal(1);
            expect(await mercenaries.balanceOf(addr3.address)).to.equal(1);

            //CHECK BALANCE AFTER CLAIM
            let balance_addr1_2 = parseFloat(ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));
            let refund_amount = parseFloat(price_recruit_2) + (parseFloat(price_recruit_2) * 0.01); // +1%
            let balance_addr1_expected = balance_addr1 + refund_amount;

            expect(balance_addr1_2.toFixed(8)).to.equal(balance_addr1_expected.toFixed(8));
        });
    });

    describe("Check recruitment - multiple recruit", () => {

        it("recruit x5 the same mercenary. Test creditor  ", async function () {

            let amount_claim_1 = await getNextPrice();

            //MINT
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();
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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.0115

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

            let amount_claim_3 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.013225

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

            let amount_claim_4 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); // 0.01520875

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

            let amount_claim_5 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(1)); //0.0174900625

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

            let amount_claim_1 = await getNextPrice();

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

            let amount_claim_2 = ethers.utils.formatEther(await mercenaries.getRecruitmentPrice(9)); // 0.0115

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

        it('Withdraw Erc20 of the given addr from the contract', async function () {

            const dix = ethers.utils.parseEther("10");

            // Mint 2 tokens with addr1
            expect(await demo20.balanceOf(addr1.address)).to.equal(0);
            await demo20.connect(addr1).mint(10);
            expect(await demo20.balanceOf(addr1.address)).to.equal(dix);

            // Transfer the tokens to the  mercenaries contract
            await demo20.connect(addr1).transfer(mercenaries.address, dix);
            expect(await demo20.balanceOf(addr1.address)).to.equal(0);
            expect(await demo20.balanceOf(mercenaries.address)).to.equal(dix);

            // Call withdraw from mercenaries contract
            expect(await demo20.balanceOf(lupicaire.address)).to.equal(0);
            await mercenaries.withdraw20(demo20.address);
            expect(await demo20.balanceOf(lupicaire.address)).to.equal(dix);
            expect(await demo20.balanceOf(mercenaries.address)).to.equal(0);
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

    describe("Check slashing", () => {

        it("Legit recruitment | no slashing", async function () {

            let amount_claim = await getNextPrice();

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //ADDR2 CLAIM TOKEN 1 (owner addr 1)
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //MERCENARY VALUE = amount_claim
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther(amount_claim));

            let amount_claim2 = await getNextPrice(amount_claim, 15);

            //ADDR3 CLAIM TOKEN 1 (owner addr 2)
            await expect(
                mercenaries.connect(addr3).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim2)})
            ).to.emit(mercenaries, "Recruited");
        });

        it("Transfer from owner | no slashing", async function () {

            let amount_claim = await getNextPrice();

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //ADDR2 CLAIM TOKEN 1 (owner addr 1)
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //MERCENARY VALUE = amount_claim
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther(amount_claim));

            //ADDR2(owner) transfert token to addr1
            expect(await mercenaries.connect(addr2).transferFrom(addr2.address, addr1.address, 1)).to.emit(mercenaries, "Transfer");
        });

        it("Transfer from approval | slashing", async function () {

            let amount_claim = await getNextPrice();

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //ADDR2 CLAIM TOKEN 1 (owner addr 1)
            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther(amount_claim)})
            ).to.emit(mercenaries, "Recruited");

            //MERCENARY VALUE = amount_claim
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther(amount_claim));

            //Addr4 transfer to addr 1 - fail
            await expect(mercenaries.connect(addr4).transferFrom(addr2.address, addr1.address, 1))
                .to.be.revertedWith('ERC721: caller is not token owner or approved');

            //Addr2 approve addr4
            await mercenaries.connect(addr2).approve(addr4.address, 1);

            //Addr4 transfer to addr 1 - ok
            expect(await mercenaries.connect(addr4).transferFrom(addr2.address, addr1.address, 1)).to.emit(mercenaries, "Transfer");

            //SLAAAAAAAAASSSSHHHING !!!
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther('0.009775')); // round error
        });

        it("Transfer from approval a never recruited mercenary | no slashing", async function () {

            //ADDR1 MINT 1
            await mercenaries.connect(addr1).mint();

            //MERCENARY VALUE = 0
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther('0'));

            //Addr1 approve addr4
            await mercenaries.connect(addr1).approve(addr4.address, 1);

            //Addr4 transfer to addr 2 - ok
            expect(await mercenaries.connect(addr4).transferFrom(addr1.address, addr2.address, 1)).to.emit(mercenaries, "Transfer");

            // this mercenary is broke
            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['mercenaryPrice']).to.equal(ethers.utils.parseEther('0'));

        });
    });

    // =============================================================
    // UTILS
    // =============================================================

    async function getNextPrice(curPrice = 0, percent = null, str = true) {

        curPrice = parseFloat(curPrice);

        let inc;
        if (percent === null) {
            inc = await mercenaries.increment();
            inc /= 100;
        } else {
            inc = percent;
        }

        let res
        if (!curPrice) {
            res = iprice + (iprice * inc / 100);
        } else {
            res = curPrice + (curPrice * inc / 100);
        }

        return str ? res + '' : res;
    }

    async function changeFee(curWallet, tokenId, previous, percent, expected) {

        const name = 'm' + tokenId;
        await demo20.connect(curWallet).mint(20);
        await demo20.connect(curWallet).approve(mercenaries.address, ethers.utils.parseEther("100"));
        await mercenaries.connect(curWallet).glorify(tokenId, name, 1, 1, 1);
        await mercenaries.connect(curWallet).mottoMojo(tokenId, name, 1, 1, 1);

        switch (tokenId) {
            case 80:
                await expect(mercenaries.connect(curWallet).setIncrement_800()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 85:
                await expect(mercenaries.connect(curWallet).setIncrement_850()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 90:
                await expect(mercenaries.connect(curWallet).setIncrement_900()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 95:
                await expect(mercenaries.connect(curWallet).setIncrement_950()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 100:
                await expect(mercenaries.connect(curWallet).setIncrement_1000()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 105:
                await expect(mercenaries.connect(curWallet).setIncrement_1050()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 110:
                await expect(mercenaries.connect(curWallet).setIncrement_1100()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 115:
                await expect(mercenaries.connect(curWallet).setIncrement_1150()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 120:
                await expect(mercenaries.connect(curWallet).setIncrement_1200()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 125:
                await expect(mercenaries.connect(curWallet).setIncrement_1250()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 130:
                await expect(mercenaries.connect(curWallet).setIncrement_1300()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 135:
                await expect(mercenaries.connect(curWallet).setIncrement_1350()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 140:
                await expect(mercenaries.connect(curWallet).setIncrement_1400()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 145:
                await expect(mercenaries.connect(curWallet).setIncrement_1450()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            case 150:
                await expect(mercenaries.connect(curWallet).setIncrement_1500()).to.emit(mercenaries, "GreedinessUpdated").withArgs(curWallet.address, previous, percent);
                break;
            default:
            // code block
        }
        expect(await mercenaries.increment()).to.equal(percent);
        expect(await mercenaries.getRecruitmentPrice(1)).to.equal(ethers.utils.parseEther(expected));

        // FORWARD 1 DAY
        await ethers.provider.send('evm_increaseTime', [oneDay]);
        await ethers.provider.send('evm_mine');
    }
});