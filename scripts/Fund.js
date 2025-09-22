const{ ethers, network } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function getFundMeAddress(){

    const {chainId} = await ethers.provider.getNetwork();
    const deployedPath = path.join(
        __dirname,
        `../ignition/deployments/chain-${chainId}/deployed_addresses.json`
    );

    if(!fs.existsSync(deployedPath)){
        throw new Error(`No deployed addresses found for chain ID ${chainId}`);
    }
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedPath, "utf8"));

    let addr = deployedAddresses["FundMeModuleV2#FundMe"];

    if(!addr){
        throw new Error(`FundMe address not found in deployed addresses for chain ID ${chainId}`);
    }
    return addr;
}

async function getFundMe(){
    const [signer] = await ethers.getSigners();
    const addr = await getFundMeAddress();
    const fundMe = await ethers.getContractAt("FundMe", addr, signer);
    return {fundMe, signer, addr};
}

async function cmdInfo(){
    const {fundMe, signer, addr} = await getFundMe();
    const [owner, priceFeed] = await Promise.all([fundMe.owner(), fundMe.s_priceFeed()]);
    const contractBal = await ethers.provider.getBalance(addr);
    const myFunded = await fundMe.addressToAmountFunded(signer.address);

    console.log(`Network: ${network.name} (chainId: ${network.config.chainId})`);
    console.log(`Signer: ${signer.address}`);
    console.log(`FundMe address: ${addr}`);
    console.log(`Owner: ${owner}`);
    console.log(`Price Feed: ${priceFeed}`);
    console.log(`Contract Balance: ${ethers.formatEther(contractBal)} ETH`);
    console.log(`My Funded Amount: ${ethers.formatEther(myFunded)} ETH`);
}

async function cmdFund(amountEthStr){
    if(!amountEthStr){
        throw new Error("Please provide an amount in ETH to fund");
    }
    const{fundMe, addr} = await getFundMe();
    const value = ethers.parseEther(amountEthStr);
    console.log(`Funding ${addr} with ${amountEthStr} ETH...`);
    const tx = await fundMe.fund({value});
    await tx.wait();
    console.log("Funded successfully.",tx.hash);
}

async function cmdWithdraw(){
    const {fundMe} = await getFundMe();
    console.log(`Withdrawing funds from ${fundMe.target}...`);
    const tx = await fundMe.withdraw();
    await tx.wait();
    console.log("Withdrawn successfully.",tx.hash);
}

async function cmdFunders(){
    const {fundMe} = await getFundMe();

    const funders = [];
    for(let i=0; i<1000; i++){
        try{
            const f = await fundMe.funders(i);
            funders.push(f);
        } catch {
            break;
        }
    }

    if(funders.length === 0){
        console.log("No funders found.");
        return;
    }
    console.log(`Found ${funders.length} funders:`);
    for(const f of funders){
        const amt = await fundMe.addressToAmountFunded(f);
        console.log(`- ${f}: ${ethers.formatEther(amt)} ETH`);
    }

}

async function main() {

    //Use await/ return here

    const action = process.argv[2] || process.env.ACTION || "help";
    if(action === "info") return cmdInfo();
    if(action === "fund") return cmdFund(process.argv[3] || process.env.AMOUNT);
    if(action === "withdraw") return cmdWithdraw();
    if(action === "funders") return cmdFunders();

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

