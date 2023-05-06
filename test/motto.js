const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Tests Motto.sol contract", function () {

    const SENSEI_THRESHOLD = 0;

    // The mercenary contract
    let Mercenaries, mercenaries;

    // A demo erc20 token to paid motto fee
    let Demo20, demo20;

    // The Motto contract.
    let Motto, motto;

    let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11;

    beforeEach(async () => {

        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11] = await ethers.getSigners();

        Demo20 = await ethers.getContractFactory("Demo20");
        demo20 = await Demo20.deploy();
        await demo20.deployed();

        Mercenaries = await ethers.getContractFactory("Mercenaries");
        mercenaries = await Mercenaries.deploy(owner.address, SENSEI_THRESHOLD);
        await mercenaries.deployed();

        Motto = await ethers.getContractFactory("Motto");
        motto = await Motto.deploy(mercenaries.address, demo20.address, ethers.utils.parseEther("1"), 96);
        await motto.deployed();
        await mercenaries.setMottoCtx(motto.address);
    });

    describe("Check initial parameters value and update the contract parameters.", () => {

        it("Check initial public value : mottoMaxLength, actionPrice, ERC20 token address, mercenaries contract address", async function () {
            expect(await motto.mottoMaxLength()).to.equal(96);
            expect(await motto.actionPrice()).to.equal(ethers.utils.parseEther("1"));
            expect(await motto.erc20Address()).to.equal(demo20.address);
            expect(await motto.mercenaries()).to.equal(mercenaries.address);
        });

        it('---- Happy case ', async function () {
        });
        it('Update ERC20 token address', async function () {
            await motto.setErc20Addr('0x0000000000000000000000000000000000000001');
            expect(await motto.erc20Address()).to.equal('0x0000000000000000000000000000000000000001');
        });
        it('Update actionPrice', async function () {
            await motto.setPrice('2000000000000000000');
            expect(await motto.actionPrice()).to.equal('2000000000000000000'); // 2 demo20
        });
        it('Update mottoMaxLength', async function () {
            await motto.setMaxLength(20);
            expect(await motto.mottoMaxLength()).to.equal(20);
        });

        it('---- Check modifiers', async function () {
        });
        it('Not the owner should not be able to update the ERC20 token address', async function () {
            await expect(motto.connect(addr1).setErc20Addr('0x0000000000000000000000000000000000000002')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the actionPrice', async function () {
            await expect(motto.connect(addr1).setPrice('1000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the max mottoMaxLength', async function () {
            await expect(motto.connect(addr1).setMaxLength(2)).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe("Check isReserved() function for not reserved motto", () => {

        it('---- Happy case ', async function () {
        });
        it('A valid and not reserved motto - punks not dead | should be false', async function () {
            expect(await motto.isReserved('punks not dead')).to.be.false;
        });

        it('---- Edge case ', async function () {
        });
        it('An empty motto, should be false.', async function () {
            expect(await motto.isReserved('')).to.be.false;
        });
        it('A motto > mottoMaxLength, should be false.', async function () {
            expect(await motto.isReserved('punks not dead punks not dead punks not dead punks not dead punks not dead punks not dead punks not dead')).to.be.false;
        });
        it('An unvalid motto not reserved : 0xPanku . should be false.', async function () {
            expect(await motto.isReserved('0xPanku')).to.be.false;
        });
    });

    describe("Check validateMotto() function", () => {
        it('A valid motto : punks not dead | true.', async function () {
            expect(await motto.validateMotto('punks not dead')).to.be.true;
        });
        it('An empty motto | false', async function () {
            expect(await motto.validateMotto('')).to.be.false;
        });
        it('A size 1 motto | true', async function () {
            expect(await motto.validateMotto('a')).to.be.true;
        });
        it('A size max-1 motto | true', async function () {
            expect(await motto.validateMotto('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).to.be.true;
        });
        it('A size max motto | true', async function () {
            expect(await motto.validateMotto('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).to.be.true;
        });
        it('A size max+1 motto | false', async function () {
            expect(await motto.validateMotto('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).to.be.false;
        });
        it('Check leading space | false', async function () {
            expect(await motto.validateMotto(' aaa')).to.be.false;
        });
        it('Check trailing space | false', async function () {
            expect(await motto.validateMotto('aaa ')).to.be.false;
        });
        it('Check continuous space | false', async function () {
            expect(await motto.validateMotto('aaa  aaa')).to.be.false;
        });
        it('Check special char !., | true', async function () {
            expect(await motto.validateMotto("punk's not dead! ... but, bien raide.")).to.be.true;
        });
        it('Check special char | false', async function () {
            expect(await motto.validateMotto(';')).to.be.false;
        });
        it('Check reserved word | true', async function () {
            expect(await motto.validateMotto('false')).to.be.true;
        });
        it('A motto containing uppercase letter: 0xPanku | false', async function () {
            expect(await motto.validateMotto('0xPanku')).to.be.false;
        });
        it('A motto containing number : 0xpanku | true', async function () {
            expect(await motto.validateMotto('0xpanku')).to.be.true;
        });
        it('An only number motto : 22 | true', async function () {
            expect(await motto.validateMotto('22')).to.be.true;
        });
        it('A motto containing whitespace x1 : 0x panku | true', async function () {
            expect(await motto.validateMotto('0x panku')).to.be.true;
        });
        it('A motto containing whitespace x2 : 0x pan ku | true', async function () {
            expect(await motto.validateMotto('0x pan ku')).to.be.true;
        });
        it('Check hexadecimal code: 0x30 0x78 | true', async function () {
            expect(await motto.validateMotto('0x30 0x78')).to.be.true;
        });
    });

    describe("Check mottoMojo() function for required conditions", () => {

        it('Check revert', async function () {

            let wallets = await mint666();

            await addr1.sendTransaction({to: wallets[1].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallets[2].address, value: ethers.utils.parseEther("1")});

            console.log('Call motto function not with the Mercenaries contract | revert => 403');
            await expect(motto.connect(addr1).motto(10, '0xpanku', '')).to.be.revertedWith('403');

            console.log('Call mottoMojo with a non existent tokenId | revert => ERC721: invalid token ID');
            await expect(mercenaries.connect(addr1).mottoMojo(999, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC721: invalid token ID');

            console.log('Not the owner of the token | revert => 401');
            await expect(mercenaries.connect(addr1).mottoMojo(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('401');

            console.log('Call mottoMojo with not enough ERC20 token to pay the price | revert => ERC20 Not enough funds');
            await expect(mercenaries.connect(wallets[1]).mottoMojo(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC20 Not enough funds');

            console.log('Not enough ERC20 allowance | revert => ERC20 Not enough allowance');
            await demo20.connect(wallets[1]).mint(10);
            await demo20.connect(wallets[2]).mint(10);
            await expect(mercenaries.connect(wallets[1]).mottoMojo(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC20 Not enough allowance');

            console.log('Call mottoMojo with invalid motto | revert => Invalid motto');
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("100"));

            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

            await expect(mercenaries.connect(wallets[1]).mottoMojo(1, '0xPanku', 1, 1, 1)).to.be.revertedWith('Invalid motto');

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

            console.log('Call mottoMojo with reserved name | revert => Reserved name');
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await demo20.connect(wallets[2]).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await mercenaries.connect(wallets[1]).mottoMojo(1, '0xpanku', 1, 1, 1);
            await expect(mercenaries.connect(wallets[2]).mottoMojo(2, '0xpanku', 1, 1, 1)).to.be.revertedWith('Reserved motto');
        });

    });

    describe("Check mottoMojo() - working and complex cases", () => {

        it("Working flow - 1st time giving a motto \n" +
            "-> Check if motto is available with isReserved return false \n" +
            "-> Mint 1 token \n" +
            "-> Set approval to transfer Demo20 token \n" +
            "-> Change motto to 0xpanku \n" +
            "-> Check that the MojoMotto event is correctly emitted \n" +
            "-> Check that isReserved return true \n" +
            "-> Check that getmotto return 0xpanku \n", async function () {

            expect(await motto.isReserved("punk's not dead!")).to.be.false;

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await mint666();

            await expect(mercenaries.connect(addr1).mottoMojo(1, "punk's not dead!", 1, 1, 1))
                .to.emit(motto, 'MojoMotto')
                .withArgs(1, "punk's not dead!", '');

            expect(await motto.isReserved("punk's not dead!")).to.be.true;
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary.motto).to.be.equal("punk's not dead!");
            expect(mercenary.mottoBy).to.be.equal(addr1.address);
        });

        it("Working flow - update a motto \n" +
            "-> Mint 1 token \n" +
            "-> Set approval to transfer demo20 token \n" +
            "-> Change motto to 0xpanku \n" +
            "-> Check that the MojoMotto event is correctly emitted \n" +
            "-> Check that isReserved for 0xpanku return true \n" +
            "-> Check that mottoBy is addr1 \n" +
            "-> Recruit the mercenary with addr2\n" +
            "-> Change motto to jambon \n" +
            "-> Check that the MojoMotto event is correctly emitted with the oldmotto parameter to 0xpanku \n" +
            "-> Check that isReserved for jambon return true \n" +
            "-> Check that isReserved for 0xpanku return false \n" +
            "-> Check that mottoBy is addr2  \n", async function () {

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr2).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));
            await demo20.connect(addr2).approve(mercenaries.address, ethers.utils.parseEther("1000"));
            await mint666();

            await expect(mercenaries.connect(addr1).mottoMojo(1, '0xpanku', 1, 1, 1))
                .to.emit(motto, 'MojoMotto')
                .withArgs(1, '0xpanku', '');

            expect(await motto.isReserved('0xpanku')).to.be.true;

            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary.motto).to.be.equal('0xpanku');
            expect(mercenary.mottoBy).to.be.equal(addr1.address);

            await expect(
                mercenaries.connect(addr2).recruit(1, 1, 1, 1, {value: ethers.utils.parseEther('0.015')})
            ).to.emit(mercenaries, "Recruited");

            await expect(mercenaries.connect(addr2).mottoMojo(1, 'jambon', 1, 1, 1))
                .to.emit(motto, 'MojoMotto')
                .withArgs(1, 'jambon', '0xpanku');

            expect(await motto.isReserved('0xpanku')).to.be.false;
            expect(await motto.isReserved('jambon')).to.be.true;

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary.motto).to.be.equal('jambon');
            expect(mercenary.mottoBy).to.be.equal(addr2.address);
        });

        it("Working flow - Check token balance \n" +
            "-> Mint 1 token \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract \n" +
            "-> Set approval to transfer Moon token \n" +
            "-> Change motto to 0xpanku with addr1 \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract", async function () {

            let wallets = await mint666();
            await addr1.sendTransaction({to: wallets[1].address, value: ethers.utils.parseEther("1")});

            await demo20.connect(wallets[1]).mint(10);
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("1000000"));

            expect(await demo20.balanceOf(wallets[1].address)).to.be.equal(ethers.utils.parseEther("10"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal('0');

            await expect(mercenaries.connect(wallets[1]).mottoMojo(1, '0xpanku', 1, 1, 1))
                .to.emit(motto, 'MojoMotto')
                .withArgs(1, '0xpanku', '');

            expect(await demo20.balanceOf(wallets[1].address)).to.be.equal(ethers.utils.parseEther("9"));
            expect(await demo20.balanceOf(wallets[666].address)).to.be.equal(ethers.utils.parseEther("0.333333333333333333"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal(ethers.utils.parseEther("0"));
        });

        it("Working flow - Check the free Lend action is performed for first time only. \n" +
            "-> Mint 1 token \n" +
            "-> Check token_1 creditor1 = addr0 \n" +
            "-> Check token_1 creditor2 = addr0 \n" +
            "-> Check token_1 creditor3 = addr0 \n" +
            "-> Set approval to transfert demo20 token \n" +
            "-> Change motto to 0xpanku with addr1 and token 1 nominated as free lend action \n" +
            "-> Check token_1 creditor1 = addr1 \n" +
            "-> Check token_1 creditor2 = addr0 \n" +
            "-> Check token_1 creditor3 = addr0 \n" +
            "-> Change motto to jambon with addr1 and token 2 nominated as free lend action \n" +
            "-> Check token_2 creditor1 = addr0 \n" +
            "-> Check token_2 creditor2 = addr0 \n" +
            "-> Check token_2 creditor3 = addr0 \n"
            , async function () {

                await mercenaries.connect(addr1).mint();

                let mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await demo20.connect(addr1).mint(10);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));
                await mint666();

                await expect(mercenaries.connect(addr1).mottoMojo(1, '0xpanku', 1, 1, 1))
                    .to.emit(motto, 'MojoMotto')
                    .withArgs(1, '0xpanku', '');

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await expect(mercenaries.connect(addr1).mottoMojo(1, 'jambon', 2, 2, 2))
                    .to.emit(motto, 'MojoMotto')
                    .withArgs(1, 'jambon', '0xpanku');

                let mercenary2 = await mercenaries.mercenaries(2);
                expect(mercenary2['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary2['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary2['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            });

        it("Working flow - Check that the free Lend action is not performed if the mottoMojo action fail.  \n" +
            "-> Mint 1 token and set approval to transfer demo20 token \n" +
            "-> Check token_1 creditor1 addr0 \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n" +
            "-> Fail to change motto to 0xPanku \n" +
            "-> Check token_1 creditor1 addr0 \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n" +
            "-> Change motto to jambon \n" +
            "-> Check token_1 creditor1 msg.sender \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n"
            , async function () {

                await mercenaries.connect(addr1).mint();
                await demo20.connect(addr1).mint(10);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));
                await mint666();

                let mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenaries.connect(addr1).mottoMojo(1, '0xPanku', 1, 1, 1)

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await expect(mercenaries.connect(addr1).mottoMojo(1, 'jambon', 1, 1, 1))
                    .to.emit(motto, 'MojoMotto')
                    .withArgs(1, 'jambon', '');

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            });

        it("Working flow - Check the Lend action for 10 mercenaries \n" +
            "-> Mint 10 token and set approval to transfer demo20 token \n" +
            "-> Recruit the 9 token with addr1 \n" +
            "-> Check token_1 creditor1 = addr0 \n" +
            "-> Check token_2 creditor1 = addr0 \n" +
            "-> Check token_3 creditor1 = addr0 \n" +
            "-> Change motto to 0xpanku with addr1 and Lend to token_1, token_2, token_3 \n" +
            "-> Check token_1 creditor1 = addr1 \n" +
            "-> Check token_2 creditor1 = addr1 \n" +
            "-> Check token_3 creditor1 = addr1 \n"
            , async function () {

                let amount_claim_1 = "0.0115";   // 0.01 ETHER

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
                await mercenaries.connect(addr11).mint();

                await demo20.connect(addr1).mint(100);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));

                // 2 token
                await expect(mercenaries.connect(addr1).recruit(2, 10, 0, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                // 3 token
                await expect(mercenaries.connect(addr1).recruit(3, 8, 8, 8, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                let mercenary = await mercenaries.mercenaries(8);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mint666();
                await mercenaries.connect(addr1).mottoMojo(3, 'test1', 8, 8, 8)

                mercenary = await mercenaries.mercenaries(8);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');


                // 4 token
                await expect(mercenaries.connect(addr1).recruit(4, 4, 4, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(7);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mercenaries.connect(addr1).mottoMojo(4, 'test2', 7, 7, 7)

                mercenary = await mercenaries.mercenaries(7);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                // 5 token
                await expect(mercenaries.connect(addr1).recruit(5, 5, 4, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");


                mercenary = await mercenaries.mercenaries(6);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mercenaries.connect(addr1).mottoMojo(5, 'test3', 6, 6, 6)

                // 2 lend action from now
                mercenary = await mercenaries.mercenaries(6);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

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
                await expect(mercenaries.connect(addr1).recruit(9, 9, 9, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                mercenary = await mercenaries.mercenaries(11);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mercenaries.connect(addr1).mottoMojo(2, 'test4', 11, 11, 11)
                expect(await mercenaries.balanceOf(addr1.address)).to.equal(9);

                // 2 lend action
                mercenary = await mercenaries.mercenaries(11);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal(addr1.address);
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                // 10 token
                await expect(mercenaries.connect(addr1).recruit(10, 10, 10, 0, {value: ethers.utils.parseEther(amount_claim_1)}))
                    .to.emit(mercenaries, "Recruited");

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(10);

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(3);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mercenaries.connect(addr1).mottoMojo(1, '0xpanku', 1, 2, 3)

                // 3 lend actions
                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(3);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            });
    });

    async function mint666() {

        // MINT 777 TOKENS
        let wallet = [];
        let wallet_addr = [];
        let nb = 666;
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
        return wallet;
    }
});
