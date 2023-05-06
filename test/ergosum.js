const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Tests ErgoSum.sol contract", function () {

    const SENSEI_THRESHOLD = 0;

    // The mercenary contract
    let Mercenaries, mercenaries;

    // A demo erc20 token to paid naming fee
    let Demo20, demo20;

    // The ErgoSum contract.
    let ErgoSum, ergoSum;

    let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11;

    beforeEach(async () => {

        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11] = await ethers.getSigners();

        Demo20 = await ethers.getContractFactory("Demo20");
        demo20 = await Demo20.deploy();
        await demo20.deployed();

        Mercenaries = await ethers.getContractFactory("Mercenaries");
        mercenaries = await Mercenaries.deploy(owner.address, SENSEI_THRESHOLD);
        await mercenaries.deployed();

        ErgoSum = await ethers.getContractFactory("ErgoSum");
        ergoSum = await ErgoSum.deploy(mercenaries.address, demo20.address, ethers.utils.parseEther("1"), 12);
        await ergoSum.deployed();
        await mercenaries.setErgoSum(ergoSum.address);
    });

    async function mint777() {

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
        return wallet;
    }

    describe("Check initial parameters value and update the contract parameters.", () => {

        it("Check initial public value : nameMaxLength, namePrice, ERC20 token address, mercenaries contract address", async function () {
            expect(await ergoSum.nameMaxLength()).to.equal(12);
            expect(await ergoSum.namePrice()).to.equal(ethers.utils.parseEther("1"));
            expect(await ergoSum.erc20Address()).to.equal(demo20.address);
            expect(await ergoSum.mercenaries()).to.equal(mercenaries.address);
        });

        it('---- Happy case ', async function () {});
        it('Update ERC20 token address', async function () {
            await ergoSum.setErc20Addr('0x0000000000000000000000000000000000000001');
            expect(await ergoSum.erc20Address()).to.equal('0x0000000000000000000000000000000000000001');
        });
        it('Update namePrice', async function () {
            await ergoSum.setPrice('2000000000000000000');
            expect(await ergoSum.namePrice()).to.equal('2000000000000000000'); // 2 demo20
        });
        it('Update nameMaxLength', async function () {
            await ergoSum.setMaxLength(20);
            expect(await ergoSum.nameMaxLength()).to.equal(20);
        });

        it('---- Check modifiers', async function () {});
        it('Not the owner should not be able to update the ERC20 token address', async function () {
            await expect(ergoSum.connect(addr1).setErc20Addr('0x0000000000000000000000000000000000000002')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the namePrice', async function () {
            await expect(ergoSum.connect(addr1).setPrice('1000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the max nameMaxLength', async function () {
            await expect(ergoSum.connect(addr1).setMaxLength(2)).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe("Check isNameReserved() function for not reserved name", () => {

        it('---- Happy case ', async function () {});
        it('A valid and not reserved name - 0xpanku | should be false', async function () {
            expect(await ergoSum.isNameReserved('0xpanku')).to.be.false;
        });

        it('---- Edge case ', async function () {});
        it('An empty name, should be false.', async function () {
            expect(await ergoSum.isNameReserved('')).to.be.false;
        });
        it('A name > nameMaxLength, should be false.', async function () {
            expect(await ergoSum.isNameReserved('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).to.be.false;
        });
        it('An unvalid name not reserved : 0xPanku . should be false.', async function () {
            expect(await ergoSum.isNameReserved('0xPanku')).to.be.false;
        });
    });

    describe("Check validateName() function", () => {
        it('A valid name : panku | true.', async function () {
            expect(await ergoSum.validateName('panku')).to.be.true;
        });
        it('An empty name | false', async function () {
            expect(await ergoSum.validateName('')).to.be.false;
        });
        it('A size 1 name | true', async function () {
            expect(await ergoSum.validateName('a')).to.be.true;
        });
        it('A size max-1 name | true', async function () {
            expect(await ergoSum.validateName('aaaaaaaaaaa')).to.be.true;
        });
        it('A size max name | true', async function () {
            expect(await ergoSum.validateName('aaaaaaaaaaaa')).to.be.true;
        });
        it('A size max+1 name | false', async function () {
            expect(await ergoSum.validateName('aaaaaaaaaaaab')).to.be.false;
        });
        it('Check leading space | false', async function () {
            expect(await ergoSum.validateName(' aaa')).to.be.false;
        });
        it('Check trailing space | false', async function () {
            expect(await ergoSum.validateName('aaa ')).to.be.false;
        });
        it('Check continuous space | false', async function () {
            expect(await ergoSum.validateName('aaa  aaa')).to.be.false;
        });
        it('Check special char | false', async function () {
            expect(await ergoSum.validateName(';')).to.be.false;
        });
        it('Check reserved word | true', async function () {
            expect(await ergoSum.validateName('false')).to.be.true;
        });
        it('A name containing uppercase letter: 0xPanku | false', async function () {
            expect(await ergoSum.validateName('0xPanku')).to.be.false;
        });
        it('A name containing number : 0xpanku | true', async function () {
            expect(await ergoSum.validateName('0xpanku')).to.be.true;
        });
        it('An only number name : 22 | true', async function () {
            expect(await ergoSum.validateName('22')).to.be.true;
        });
        it('A name containing whitespace x1 : 0x panku | true', async function () {
            expect(await ergoSum.validateName('0x panku')).to.be.true;
        });
        it('A name containing whitespace x2 : 0x pan ku | true', async function () {
            expect(await ergoSum.validateName('0x pan ku')).to.be.true;
        });
        it('Check hexadecimal code: 0x30 0x78 | true', async function () {
            expect(await ergoSum.validateName('0x30 0x78')).to.be.true;
        });
    });

    describe("Check glorify() function for required conditions", () => {

        it('Check revert', async function () {

            let wallets = await mint777();

            await addr1.sendTransaction({to: wallets[1].address, value: ethers.utils.parseEther("1")});
            await addr1.sendTransaction({to: wallets[2].address, value: ethers.utils.parseEther("1")});

            console.log('Call glorify function not with the Mercenaries contract | revert => 403');
            await expect(ergoSum.connect(addr1).glorify(10, '0xpanku', '')).to.be.revertedWith('403');

            console.log('Call glorify with a non existent tokenId | revert => ERC721: invalid token ID');
            await expect(mercenaries.connect(addr1).glorify(999, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC721: invalid token ID');

            console.log('Not the owner of the token | revert => 401');
            await expect(mercenaries.connect(addr2).glorify(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('401');

            console.log('Call glorify with not enough ERC20 token to pay the price | revert => ERC20 Not enough funds');
            await expect(mercenaries.connect(wallets[1]).glorify(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC20 Not enough funds');

            console.log('Not enough ERC20 allowance | revert => ERC20 Not enough allowance');
            await demo20.connect(wallets[1]).mint(10);
            await demo20.connect(wallets[2]).mint(10);
            await expect(mercenaries.connect(wallets[1]).glorify(1, '0xpanku', 1, 1, 1)).to.be.revertedWith('ERC20 Not enough allowance');

            console.log('Call glorify with invalid name | revert => Invalid name');
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("100"));

            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

            await expect(mercenaries.connect(wallets[1]).glorify(1, '0xPanku', 1, 1, 1)).to.be.revertedWith('Invalid name');

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

            console.log('Call glorify with reserved name | revert => Reserved name');
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await demo20.connect(wallets[2]).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await mercenaries.connect(wallets[1]).glorify(1, '0xpanku', 1, 1, 1);
            await expect(mercenaries.connect(wallets[2]).glorify(2, '0xpanku', 1, 1, 1)).to.be.revertedWith('Reserved name');
        });
    });

    describe("Check glorify() - working and complex cases", () => {

        it("Working naming flow - 1st time naming \n" +
            "-> Check if name is available with isNameReserved return false \n" +
            "-> Mint 1 token \n" +
            "-> Set approval to transfer Demo20 token \n" +
            "-> Change name to 0xpanku \n" +
            "-> Check that the NomenEstOmen event is correctly emitted \n" +
            "-> Check that isNameReserved return true \n" +
            "-> Check that getName return 0xpanku \n", async function () {

            expect(await ergoSum.isNameReserved('0xpanku')).to.be.false;

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));

            await mint777();

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '');

            expect(await ergoSum.isNameReserved('0xpanku')).to.be.true;
            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary.name).to.be.equal('0xpanku');
        });

        it("Working naming flow - Renaming a token \n" +
            "-> Mint 1 token \n" +
            "-> Set approval to transfer demo20 token \n" +
            "-> Change name to 0xpanku \n" +
            "-> Check that the NomenEstOmen event is correctly emitted \n" +
            "-> Check that isNameReserved for 0xpanku return true \n" +
            "-> Change name to jambon \n" +
            "-> Check that the NomenEstOmen event is correctly emitted with the oldName parameter to 0xpanku \n" +
            "-> Check that isNameReserved for jambon return true \n" +
            "-> Check that isNameReserved for 0xpanku return false \n", async function () {

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));

            await mint777();

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '');

            expect(await ergoSum.isNameReserved('0xpanku')).to.be.true;

            await expect(mercenaries.connect(addr1).glorify(1, 'jambon', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, 'jambon', '0xpanku');

            expect(await ergoSum.isNameReserved('0xpanku')).to.be.false;
            expect(await ergoSum.isNameReserved('jambon')).to.be.true;
        });

        it("Working naming flow - Check token balance \n" +
            "-> Mint 1 token \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract \n" +
            "-> Set approval to transfer Moon token \n" +
            "-> Change name to 0xpanku with addr1 \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract", async function () {

            let wallets = await mint777();

            await addr1.sendTransaction({to: wallets[1].address, value: ethers.utils.parseEther("1")});

            await demo20.connect(wallets[1]).mint(10);
            await demo20.connect(wallets[1]).approve(mercenaries.address, ethers.utils.parseEther("1000000"));

            expect(await demo20.balanceOf(wallets[1].address)).to.be.equal(ethers.utils.parseEther("10"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal('0');

            await expect(mercenaries.connect(wallets[1]).glorify(1, '0xpanku', 1, 1, 1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '');

            expect(await demo20.balanceOf(wallets[1].address)).to.be.equal(ethers.utils.parseEther("9"));
            expect(await demo20.balanceOf(wallets[777].address)).to.be.equal(ethers.utils.parseEther("0.333333333333333333"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal(ethers.utils.parseEther("0"));
        });

        it("Working naming flow - Check the free Lend action is performed for first time naming only. \n" +
            "-> Mint 1 token \n" +
            "-> Check token_1 creditor1 = addr0 \n" +
            "-> Check token_1 creditor2 = addr0 \n" +
            "-> Check token_1 creditor3 = addr0 \n" +
            "-> Set approval to transfert demo20 token \n" +
            "-> Change name to 0xpanku with addr1 and token 1 nominated as free lend action \n" +
            "-> Check token_1 creditor1 = addr1 \n" +
            "-> Check token_1 creditor2 = addr0 \n" +
            "-> Check token_1 creditor3 = addr0 \n" +
            "-> Change name to jambon with addr1 and token 2 nominated as free lend action \n" +
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

                await mint777();

                await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 1, 1))
                    .to.emit(ergoSum, 'NomenEstOmen')
                    .withArgs(1, '0xpanku', '');

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await expect(mercenaries.connect(addr1).glorify(1, 'jambon', 2, 2, 2))
                    .to.emit(ergoSum, 'NomenEstOmen')
                    .withArgs(1, 'jambon', '0xpanku');

                let mercenary2 = await mercenaries.mercenaries(2);
                expect(mercenary2['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary2['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary2['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            });

        it("Working naming flow - Check that the free Lend action is not performed if the glorify action fail.  \n" +
            "-> Mint 1 token and set approval to transfer demo20 token \n" +
            "-> Check token_1 creditor1 addr0 \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n" +
            "-> Fail to change name to 0xPanku \n" +
            "-> Check token_1 creditor1 addr0 \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n" +
            "-> Change name to jambon \n" +
            "-> Check token_1 creditor1 msg.sender \n" +
            "-> Check token_1 creditor2 addr0 \n" +
            "-> Check token_1 creditor3 addr0 \n"
            , async function () {

                await mercenaries.connect(addr1).mint();
                await demo20.connect(addr1).mint(10);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));
                let mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await mint777();

                mercenaries.connect(addr1).glorify(1, '0xPanku', 1, 1, 1)

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');

                await expect(mercenaries.connect(addr1).glorify(1, 'jambon', 1, 1, 1))
                    .to.emit(ergoSum, 'NomenEstOmen')
                    .withArgs(1, 'jambon', '');

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor1']).to.equal(addr1.address);
                expect(mercenary['creditor2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor3']).to.equal('0x0000000000000000000000000000000000000000');
            });

        it("Working naming flow - Check the Lend action for 10 mercenaries \n" +
            "-> Mint 10 token and set approval to transfer demo20 token \n" +
            "-> Recruit the 9 token with addr1 \n" +
            "-> Check token_1 creditor1 = addr0 \n" +
            "-> Check token_2 creditor1 = addr0 \n" +
            "-> Check token_3 creditor1 = addr0 \n" +
            "-> Change name to 0xpanku with addr1 and Lend to token_1, token_2, token_3 \n" +
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

                await mint777();

                await mercenaries.connect(addr1).glorify(3, 'test1', 8, 8, 8)

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

                await mercenaries.connect(addr1).glorify(4, 'test2', 7, 7, 7)

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

                await mercenaries.connect(addr1).glorify(5, 'test3', 6, 6, 6)

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

                await mercenaries.connect(addr1).glorify(2, 'test4', 11, 11, 11)
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

                await mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 2, 3)

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
});
