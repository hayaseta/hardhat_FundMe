const {assert, expect} = require("chai");
const {network, ethers} = require("hardhat");
const path = require("path");

describe("FundMe(staging - sepolia)", function(){
    this.timeout(240000); //240 seconds

    const SEPOLIA_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const SEND_VALUE = ethers.parseEther("0.001"); //0.001 ETH
    
    let fundMe;
    let deployer;
    let fundMeAddress;

    beforeEach(async function(){

        if(network.name !== "sepolia"){
            this.skip();
        }

        [deployer] = await ethers.getSigners();
        
        const deployedJsonPath = path.join(__dirname,"../../ignition/deployments/chain-11155111/deployed_addresses.json");
        const deployed = require(deployedJsonPath);
        const fileAddress = deployed["FundMeModuleV2#FundMe"];
        fundMeAddress = process.env.FUNDME_ADDRESS ?? fileAddress;

        fundMe = await ethers.getContractAt("FundMe",fundMeAddress,deployer);
    });
    it("attaches to the deployed contract and verifies live feed config",async function(){
        const attachedAt = await fundMe.getAddress();
        console.log(`FundMe attached at ${attachedAt}`);
        assert.equal(attachedAt.toLowerCase(),fundMeAddress.toLowerCase());

        const feed = await fundMe.s_priceFeed();
        assert.equal(feed.toLowerCase(),SEPOLIA_FEED.toLowerCase());
    });
    it("fund() succeeds on sepolia with live chainlink price", async function(){
        const beforeMapping = await fundMe.addressToAmountFunded(deployer.address);
        const contractBefore = await ethers.provider.getBalance(fundMeAddress);

        const tx = await fundMe.fund({value: SEND_VALUE});
        await tx.wait(1);


        const afterMapping = await fundMe.addressToAmountFunded(deployer.address);
        const contractAfter = await ethers.provider.getBalance(fundMeAddress);

        assert.equal(afterMapping-beforeMapping ,SEND_VALUE);
        assert.equal(contractAfter - contractBefore ,SEND_VALUE);
    });
    it("withdraw() behave correctly for current account role (owner vs non-owner)", async function(){
        await (await fundMe.fund({value: SEND_VALUE})).wait(1);

        const owner = await fundMe.owner();
        const iAmOwner = owner.toLowerCase() === deployer.address.toLowerCase();

        if(!iAmOwner){
            await expect(fundMe.withdraw()).to.be.rejectedWith("Only withdrawable to owner!");
            return;
        }

        const contractStart = await ethers.provider.getBalance(fundMeAddress);
        const ownerStart = await ethers.provider.getBalance(deployer.address);

        const tx = await fundMe.withdraw();
        const receipt = await tx.wait(1);
        const gasPrice = receipt.effectiveGasPrice ?? tx.gasPrice;
        const gasCost = BigInt(receipt.gasUsed) * BigInt(gasPrice);

        const contractEnd = await ethers.provider.getBalance(fundMeAddress);
        const ownerEnd = await ethers.provider.getBalance(deployer.address);


        assert.equal(contractEnd,0n);

        const expectedOwnerEnd = ownerStart + contractStart - gasCost;
        const delta = 
        ownerEnd > expectedOwnerEnd
        ? ownerEnd - expectedOwnerEnd
        : expectedOwnerEnd - ownerEnd;
        
        const TOL = 1_000_000_000n;
        assert(
            delta<TOL,
            `Owner end balance off by ${delta} wei (expected ${expectedOwnerEnd}, got ${ownerEnd})`
        );

        const mappingAfter = await fundMe.addressToAmountFunded(deployer.address);
        assert.equal(mappingAfter,0n);
    });
    it("receive() path works by sending a plain ETH transfer", async function(){

        const to = await fundMe.getAddress();
        const before = await fundMe.addressToAmountFunded(deployer.address);

        const tx = await deployer.sendTransaction({to,value:SEND_VALUE, data: "0x"});
        await tx.wait(1);

        const after = await fundMe.addressToAmountFunded(deployer.address);
        assert.equal(after - before, SEND_VALUE);
    });

});