# FundMe – Network-aware deployment, tests, coverage, and verification

This repo deploys FundMe with environment-aware config and full test/coverage support:
- Local (hardhat/localhost): deploys a Chainlink MockV3Aggregator and injects it into FundMe.
- Sepolia: uses Chainlink’s ETH/USD feed at 0x694AA1769357215DE4FAC081bf1f309aDC325306.

Contracts use Solidity 0.8.28 (also compiles 0.8.0 for Chainlink mocks). Gas reporter and solidity-coverage are enabled.

## Contracts

- contracts/FundMe.sol
  - Constructor takes an AggregatorV3Interface and stores it as s_priceFeed.
  - Uses PriceConverter to require a minimumUsd = 1e18 (1 USD, 18 decimals).
  - Owner-only withdraw; receive/fallback forward to fund().

- contracts/PriceConverter.sol
  - latestRoundData() returns an 8-decimal price; library scales by 1e10 to 18 decimals.
  - getConversionRate(ethAmount) returns ETH amount in USD (18 decimals).

- contracts/mocks/MockV3Aggregator.sol
  - Local testing mock. Decimals = 8, initial answer = 2000e8.

## Ignition (network-aware)

- ignition/modules/FundMe.js (module id: FundMeModuleV2)
  - Local: deploys MockV3Aggregator(8, 2000e8) then FundMe(mock).
  - Sepolia (chainId 11155111): deploys FundMe with the real price feed address.

## Prerequisites

- Node.js and npm
- .env (not committed) with:
  - SEPOLIA_RPC_URL
  - SEPOLIA_PRIVATE_KEY (has Sepolia ETH)
  - ETHERSCAN_API_KEY

Hardhat plugins: @nomicfoundation/hardhat-toolbox, ignition, gas-reporter, solidity-coverage.

## Install

```bash
npm install
```

## Local development

```bash
# Run unit tests
npx hardhat test

# Start a node and deploy locally with Ignition
npx hardhat node
npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost
```

## Test suites

- Unit tests (local, with mock):
  - tests/unit/FundMe.test.js
  - Run: npx hardhat test tests/unit/FundMe.test.js

- Staging tests (live Sepolia):
  - tests/staging/FundMe.staging.test.js
  - Skips automatically unless --network sepolia is used.
  - Uses FUNDME_ADDRESS if set, otherwise reads ignition/deployments/chain-11155111/deployed_addresses.json.
  - Run:
    ```bash
    # optionally set your deployed address
    export FUNDME_ADDRESS=0xYourFundMeAddress
    npx hardhat test tests/staging/FundMe.staging.test.js --network sepolia
    ```

## Coverage and gas report

```bash
# Coverage (outputs coverage/coverage-final.json and summary)
npx hardhat coverage

# Gas report (writes gas-report.txt)
npx hardhat test
```

gas-report.txt is generated with usd currency display and token=MATIC setting.

## Deploy to Sepolia

```bash
npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia
```

Latest recorded deployment (from ignition/deployments/chain-11155111/deployed_addresses.json):
- FundMeModuleV2#FundMe: 0xYourFundMeAddress

Always prefer checking the file for the address you just deployed.

If Ignition complains about changed artifacts, either bump the module id or clear the network’s ignition state:
```bash
rm -rf ignition/deployments/chain-11155111
```

## Verify on Etherscan

The verify task is available via @nomicfoundation/hardhat-toolbox.

```bash
# Replace with your deployed address if different
npx hardhat verify --network sepolia 
0xYourFundMeAddress 0x694AA1769357215DE4FAC081bf1f309aDC325306
```

Constructor arg is the Chainlink ETH/USD feed on Sepolia.

## Interact (examples)

```bash
npx hardhat console --network sepolia

> const c = await ethers.getContractAt("FundMe", "0xYourFundMeAddress")
> await c.s_priceFeed()
'0x694AA1769357215DE4FAC081bf1f309aDC325306'
> await c.fund({ value: ethers.parseEther("0.001") })
> await c.withdraw() // only owner
```

## Notes

- Minimum funding is enforced in USD (1e18 = $1.00 with 18 decimals).
- Do not commit .env. Rotate keys if a secret was exposed.
- Staging test asserts the live Chainlink feed address on Sepolia.
- Solidity compilers: 0.8.28 (primary), 0.8.0 (for Chainlink interface compatibility).

SPDX-License-Identifier: SEE LICENSE IN LICENSE
