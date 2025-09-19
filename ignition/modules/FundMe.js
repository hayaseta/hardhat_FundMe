const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FundMeModule", (m) => {
    // Deploy mock price feed for localhost
    const mockV3Aggregator = m.contract("MockV3Aggregator", [8, 200000000000]);
    
    // Use the mock address for FundMe
    const fundMe = m.contract("FundMe");

    return { fundMe, mockV3Aggregator };
});

// # For localhost - first deploy the mock, then deploy FundMe with mock address
// npx hardhat ignition deploy ignition/modules/MockV3Aggregator.js --network localhost

// # After getting the mock address from above deployment, use it:
// npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost --parameters '{"FundMeModule": {"ethUsdPriceFeed": "MOCK_ADDRESS_FROM_ABOVE"}}'

// # For Sepolia
// npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia --parameters '{"FundMeModule": {"ethUsdPriceFeed": "0x694AA1769357215DE4FAC081bf1f309aDC325306"}}'