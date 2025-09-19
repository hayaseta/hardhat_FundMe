# FundMe – Sepolia Deployment & Verification

This main branch configures FundMe for network-aware deployments and Etherscan verification, with:
- Local networks (hardhat/localhost): deploy a MockV3Aggregator and inject it into FundMe.
- Sepolia: use Chainlink’s ETH/USD feed at 0x694AA1769357215DE4FAC081bf1f309aDC325306 and verify on Etherscan.

## Contracts Overview

- contracts/FundMe.sol
  - Takes an AggregatorV3Interface in the constructor and stores it as s_priceFeed.
  - Uses PriceConverter to enforce a minimum USD value per fund (minimumUsd = 1e18).
  - Owner-only withdraw.

- contracts/PriceConverter.sol
  - Library used by FundMe to convert ETH to USD via the supplied price feed.

- contracts/mocks/MockV3Aggregator.sol
  - Used for local testing with DECIMALS=8 and INITIAL_ANSWER=2000.00000000.

## Ignition Module (network-aware)

- ignition/modules/FundMe.js (module id: FundMeModuleV2)
  - Local: deploys MockV3Aggregator then FundMe(mockAddress).
  - Sepolia: deploys FundMe with the real price feed address.

Key excerpt:
```js
const SEPOLIA_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
module.exports = buildModule("FundMeModuleV2", (m) => {
  const isLocal = network.name === "hardhat" || network.name === "localhost";
  if (isLocal) {
    const mock = m.contract("MockV3Aggregator", [8, 2000n * 10n ** 8n]);
    const fundMe = m.contract("FundMe", [mock]);
    return { mock, fundMe };
  }
  const fundMe = m.contract("FundMe", [SEPOLIA_FEED]);
  return { fundMe };
});
```

## Prerequisites

- Node.js and npm
- Hardhat + plugins installed
- .env with:
  - SEPOLIA_RPC_URL
  - PRIVATE_KEY (with Sepolia ETH)
  - ETHERSCAN_API_KEY

Hardhat config includes the verify plugin:
```js
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
module.exports = {
  etherscan: { apiKey: { sepolia: process.env.ETHERSCAN_API_KEY } },
  // ...networks, solidity, etc.
};
```

## Deploy to Sepolia

Command used:
```bash
npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia
```

Result:
- FundMe deployed at: 0x5C50e0f4C1916e01c57FDBaDbDBCA4C5b8ab7540
- Constructor arg (price feed): 0x694AA1769357215DE4FAC081bf1f309aDC325306

You can always find addresses after deployment here:
- ignition/deployments/chain-11155111/deployed_addresses.json

## Verify on Etherscan

Command used:
```bash
npx hardhat verify --network sepolia 0x5C50e0f4C1916e01c57FDBaDbDBCA4C5b8ab7540 0x694AA1769357215DE4FAC081bf1f309aDC325306
```

What verification does:
- Recompiles your sources with the same compiler/settings and constructor args.
- Confirms the bytecode matches the on-chain contract.
- Publishes source and ABI to the explorer.

## Interact (examples)

- Read the configured price feed:
```solidity
// at 0x5C50e0f4C1916e01c57FDBaDbDBCA4C5b8ab7540
function s_priceFeed() external view returns (address)
```

- Fund the contract (Sepolia):
```bash
# Using Hardhat console
npx hardhat console --network sepolia
> const c = await ethers.getContractAt("FundMe", "0x5C50e0f4C1916e01c57FDBaDbDBCA4C5b8ab7540");
> (await c.s_priceFeed())
'0x694AA1769357215DE4FAC081bf1f309aDC325306'
> await c.fund({ value: ethers.parseEther("0.01") })
```

- Withdraw (owner only):
```bash
> await c.withdraw()
```

## Local Development

- Start a local node and deploy:
```bash
npx hardhat node
npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost
```
This will deploy MockV3Aggregator (8 decimals, 2000e8) and then FundMe(mock).

## Troubleshooting

- Ignition reconciliation (“Artifact bytecodes have been changed”):
  - Update the module id (e.g., FundMeModuleV2) or remove ignition/deployments/chain-11155111 and redeploy.

- “Cannot verify contracts for nonexistant deployment”:
  - Ensure you deployed on the same network and module path before running verify.
  - If needed, verify directly with: hardhat verify --network sepolia <ADDRESS> <CONSTRUCTOR_ARGS...>

- CLI gotcha:
  - Keep flags on one line; don’t split commands across lines.

## Project Structure (key files)

- contracts/FundMe.sol
- contracts/PriceConverter.sol
- contracts/mocks/MockV3Aggregator.sol
- ignition/modules/FundMe.js
- hardhat.config.js

SPDX-License-Identifier: SEE LICENSE IN LICENSE
