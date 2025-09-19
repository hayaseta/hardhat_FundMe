const { buildModule } = require( "@nomicfoundation/hardhat-ignition/modules");    
const{network} = require("hardhat");
const SEPOLIA_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

module.exports = buildModule("FundMeModuleV2", (m) => {//Used V2 to avoid caching issues
    const isLocal = network.name === "hardhat" || network.name === "localhost";
    const chainId = network.config.chainId;

    let fundMe;

    if (isLocal) {
        // For local network, deploy MockV3Aggregator first
        const DECIMALS = 8;
        const INITIAL_ANSWER = 2000n * 10n ** 8n; // 2000.00000000 with 8 decimals
        const mock = m.contract("MockV3Aggregator", [DECIMALS, INITIAL_ANSWER]);
        fundMe = m.contract("FundMe", [mock]);
        return { mock, fundMe };
    }
    else if (chainId === 11155111) {
        // For Sepolia, use the real price feed address
        fundMe = m.contract("FundMe", [SEPOLIA_FEED]);
        return { fundMe };
    }
    throw new Error("Unsupported network");
    
});

// # For localhost - first deploy the mock, then deploy FundMe with mock address
// npx hardhat ignition deploy ignition/modules/MockV3Aggregator.js --network localhost

// # After getting the mock address from above deployment, use it:
// npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost --parameters '{"FundMeModule": {"ethUsdPriceFeed": "MOCK_ADDRESS_FROM_ABOVE"}}'

// # For Sepolia
// npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia --parameters '{"FundMeModule": {"ethUsdPriceFeed": "0x694AA1769357215DE4FAC081bf1f309aDC325306"}}'