const{network} = require("hardhat");

module.exports = async({getNamedAccounts,deployments})=>{
    const {deploy,log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    if(chainId === 31337){
        log("Local network detected! Deploying Mocks...");
        await deploy("MockV3Aggregator",{
            contract:"MockV3Aggregator",
            from:deployer,
            log:true,
            args:[8,200000000000], // 8 decimal places, 2000.00000000 price
        });
        log("Mocks Deployed!");
        log("----------------------------------------------------");
    }
}