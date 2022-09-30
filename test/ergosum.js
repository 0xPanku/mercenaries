const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tests ErgoSum.sol contract", function () {

    // The mercenary contract
    let Mercenaries, mercenaries;

    // A demo erc20 token to paid naming fee
    let Demo20, demo20;

    // The ErgoSum contract.
    let ErgoSum, ergoSum;

    let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10;

    beforeEach(async () => {

        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10] = await ethers.getSigners();

        Demo20 = await ethers.getContractFactory("Demo20");
        demo20 = await Demo20.deploy();
        await demo20.deployed();

        Mercenaries = await ethers.getContractFactory("Mercenaries");
        mercenaries = await Mercenaries.deploy(owner.address);
        await mercenaries.deployed();

        ErgoSum = await ethers.getContractFactory("ErgoSum");
        ergoSum = await ErgoSum.deploy(mercenaries.address, demo20.address, ethers.utils.parseEther("1"), 12);
        await ergoSum.deployed();
        await mercenaries.setErgoSum(ergoSum.address);
    });

    describe("Check initial parameters value and update the contract parameters.", () => {

        it("Check initial public value : nameMaxLength, namePrice, ERC20 token address, mercenaries contract address", async function(){
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
            await expect( ergoSum.connect(addr1).setErc20Addr('0x0000000000000000000000000000000000000002')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the namePrice', async function () {
            await expect( ergoSum.connect(addr1).setPrice('1000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it('Not the owner should not be able to update the max nameMaxLength', async function () {
            await expect( ergoSum.connect(addr1).setMaxLength(2)).to.be.revertedWith('Ownable: caller is not the owner');
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

    describe("Check glorify() function for required conditions",  () => {
        it('Call glorify function not with the Mercenaries contract | revert => 403', async function () {
            await expect( ergoSum.connect(addr1).glorify(10, '0xpanku')).to.be.revertedWith('403');
        });
        it('Call glorify with a non existent tokenId | revert => ERC721: owner query for nonexistent token', async function () {
            await expect( mercenaries.connect(addr1).glorify(10, '0xpanku', 1,1,1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
        });
        it('Not the owner of the token | revert => 401', async function () {
            await mercenaries.connect(addr1).mint();
            await expect( mercenaries.connect(addr2).glorify(1, '0xpanku', 1,1,1)).to.be.revertedWith('401');
        });
        it('Call glorify with not enough ERC20 token to pay the price | revert => ERC20 Not enough funds', async function () {
            await mercenaries.connect(addr1).mint();
            await expect( mercenaries.connect(addr1).glorify(1, '0xpanku', 1,1,1)).to.be.revertedWith('ERC20 Not enough funds');
        });
        it('Not enough ERC20 allowance | revert => ERC20 Not enough allowance', async function () {
            await demo20.connect(addr1).mint(10);
            await mercenaries.connect(addr1).mint();
            await expect( mercenaries.connect(addr1).glorify(1, '0xpanku', 1,1,1)).to.be.revertedWith('ERC20 Not enough allowance');
        });
        it('Call glorify with invalid name | revert => Invalid name', async function () {
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await mercenaries.connect(addr1).mint();
            await expect( mercenaries.connect(addr1).glorify(1, '0xPanku', 1,1,1)).to.be.revertedWith('Invalid name');
        });
        it('Call glorify with reserved name | revert => Reserved name', async function () {
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr2).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await demo20.connect(addr2).approve(mercenaries.address, ethers.utils.parseEther("100"));
            await mercenaries.connect(addr1).mint();
            await mercenaries.connect(addr2).mint();
            await mercenaries.connect(addr1).glorify(1, '0xpanku', 1,1,1);
            await expect( mercenaries.connect(addr2).glorify(2, '0xpanku', 1,1,1)).to.be.revertedWith('Reserved name');
        });
    });

    describe("Check glorify() - working and complex cases",  () => {

        it("Working naming flow - 1st time naming \n" +
            "-> Check if name is available with isNameReserved return false \n" +
            "-> Mint 1 token \n" +
            "-> Set approval to transfer Demo20 token \n" +
            "-> Change name to 0xpanku \n" +
            "-> Check that the NomenEstOmen event is correctly emitted \n" +
            "-> Check that isNameReserved return true \n" +
            "-> Check that getName return 0xpanku \n", async function () {

            expect( await ergoSum.isNameReserved('0xpanku')).to.be.false;

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("100"));

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1,1,1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '' );

            expect( await ergoSum.isNameReserved('0xpanku')).to.be.true;
            expect( await mercenaries.getName(1)).to.be.equal('0xpanku');
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

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku', 1,1,1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '' );

            expect( await ergoSum.isNameReserved('0xpanku')).to.be.true;

            await expect(mercenaries.connect(addr1).glorify(1, 'jambon', 1,1,1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, 'jambon', '0xpanku' );

            expect( await ergoSum.isNameReserved('0xpanku')).to.be.false;
            expect( await ergoSum.isNameReserved('jambon')).to.be.true;
        });

        it("Working naming flow - Check token balance \n" +
            "-> Mint 1 token \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract \n" +
            "-> Set approval to transfer Moon token \n" +
            "-> Change name to 0xpanku with addr1 \n" +
            "-> Check moon balance addr1 \n" +
            "-> Check moon balance contract", async function () {

            await mercenaries.connect(addr1).mint();
            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000000"));

            expect(await demo20.balanceOf(addr1.address)).to.be.equal(ethers.utils.parseEther("10"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal('0');
            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku',1,1,1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '' );

            expect(await demo20.balanceOf(addr1.address)).to.be.equal(ethers.utils.parseEther("9"));
            expect(await demo20.balanceOf(mercenaries.address)).to.be.equal(ethers.utils.parseEther("1"));
        });

        it("Working naming flow - Check the free Lend action is performed for first time naming only. \n" +
            "-> Mint 1 token \n" +
            "-> Check token_1 creditor_1 = addr0 \n" +
            "-> Check token_1 creditor_2 = addr0 \n" +
            "-> Check token_1 creditor_3 = addr0 \n" +
            "-> Set approval to transfert demo20 token \n" +
            "-> Change name to 0xpanku with addr1 and token 1 nominated as free lend action \n" +
            "-> Check token_1 creditor_1 = addr1 \n" +
            "-> Check token_1 creditor_2 = addr0 \n" +
            "-> Check token_1 creditor_3 = addr0 \n" +
            "-> Change name to jambon with addr1 and token 2 nominated as free lend action \n" +
            "-> Check token_2 creditor_1 = addr0 \n" +
            "-> Check token_2 creditor_2 = addr0 \n" +
            "-> Check token_2 creditor_3 = addr0 \n"
            , async function () {

            await mercenaries.connect(addr1).mint();

            let mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

            await demo20.connect(addr1).mint(10);
            await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));

            await expect(mercenaries.connect(addr1).glorify(1, '0xpanku',1,1,1))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, '0xpanku', '' );

            mercenary = await mercenaries.mercenaries(1);
            expect(mercenary['creditor_1']).to.equal(addr1.address);
            expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

            await expect(mercenaries.connect(addr1).glorify(1, 'jambon',2,2,2))
                .to.emit(ergoSum, 'NomenEstOmen')
                .withArgs(1, 'jambon', '0xpanku' );

            let mercenary2 = await mercenaries.mercenaries(2);
            expect(mercenary2['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary2['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
            expect(mercenary2['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');
        });

        it("Working naming flow - Check that the free Lend action is not performed if the glorify action fail.  \n" +
            "-> Mint 1 token and set approval to transfer demo20 token \n" +
            "-> Check token_1 creditor_1 addr0 \n" +
            "-> Check token_1 creditor_2 addr0 \n" +
            "-> Check token_1 creditor_3 addr0 \n" +
            "-> Fail to change name to 0xPanku \n" +
            "-> Check token_1 creditor_1 addr0 \n" +
            "-> Check token_1 creditor_2 addr0 \n" +
            "-> Check token_1 creditor_3 addr0 \n" +
            "-> Change name to jambon \n" +
            "-> Check token_1 creditor_1 msg.sender \n" +
            "-> Check token_1 creditor_2 addr0 \n" +
            "-> Check token_1 creditor_3 addr0 \n"
            , async function () {

                await mercenaries.connect(addr1).mint();
                await demo20.connect(addr1).mint(10);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));
                let mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenaries.connect(addr1).glorify(1, '0xPanku', 1, 1, 1)

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                await expect(mercenaries.connect(addr1).glorify(1, 'jambon', 1, 1, 1))
                    .to.emit(ergoSum, 'NomenEstOmen')
                    .withArgs(1, 'jambon', '');

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor_1']).to.equal(addr1.address);
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');
            });

        it("Working naming flow - Check the Lend action for 10 mercenaries \n" +
            "-> Mint 10 token and set approval to transfer demo20 token \n" +
            "-> Recruit the 9 token with addr1 \n" +
            "-> Check token_1 creditor_1 = addr0 \n" +
            "-> Check token_2 creditor_1 = addr0 \n" +
            "-> Check token_3 creditor_1 = addr0 \n" +
            "-> Change name to 0xpanku with addr1 and Lend to token_1, token_2, token_3 \n" +
            "-> Check token_1 creditor_1 = addr1 \n" +
            "-> Check token_2 creditor_1 = addr1 \n" +
            "-> Check token_3 creditor_1 = addr1 \n"
            , async function () {

                let amount_claim_1 = "0.01";   // 0.01 ETHER

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

                await demo20.connect(addr1).mint(10);
                await demo20.connect(addr1).approve(mercenaries.address, ethers.utils.parseEther("1000"));

                // 2 token
                await expect(mercenaries.connect(addr1).recruit(2,10,0,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 3 token
                await expect(mercenaries.connect(addr1).recruit(3,10,0,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 4 token
                await expect(mercenaries.connect(addr1).recruit(4,4,0,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 5 token
                await expect(mercenaries.connect(addr1).recruit(5,5,0,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 6 token
                await expect(mercenaries.connect(addr1).recruit(6,6,6,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 7 token
                await expect(mercenaries.connect(addr1).recruit(7,7,7,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 8 token
                await expect(mercenaries.connect(addr1).recruit(8,8,8,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 9 token
                await expect(mercenaries.connect(addr1).recruit(9,9,9,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                // 10 token
                await expect(mercenaries.connect(addr1).recruit(10,10,10,0, { value: ethers.utils.parseEther(amount_claim_1) }))
                    .to.emit(mercenaries, "Recruited");

                expect(await mercenaries.balanceOf(addr1.address)).to.equal(10);

                let mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(3);
                expect(mercenary['creditor_1']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                await mercenaries.connect(addr1).glorify(1, '0xpanku', 1, 2, 3)

                mercenary = await mercenaries.mercenaries(1);
                expect(mercenary['creditor_1']).to.equal(addr1.address);
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(2);
                expect(mercenary['creditor_1']).to.equal(addr1.address);
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');

                mercenary = await mercenaries.mercenaries(3);
                expect(mercenary['creditor_1']).to.equal(addr1.address);
                expect(mercenary['creditor_2']).to.equal('0x0000000000000000000000000000000000000000');
                expect(mercenary['creditor_3']).to.equal('0x0000000000000000000000000000000000000000');
            });
    });
});
