# FundMe (Hardhat + Chainlink)

A minimal crowdfunding contract using Chainlink price feeds to enforce a USD-denominated minimum.

- Solidity: 0.8.28
- Deployments: Hardhat Ignition
- Tests: Mocha/Chai
- Networks: hardhat, sepolia

## Setup

- Node.js LTS
- Install deps
  - npm install
- Configure .env (never commit secrets)
  - SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, ETHERSCAN_API_KEY

## Deploy

Local (hardhat in-process):
- npx hardhat ignition deploy ignition/modules/FundMe.js --network hardhat

Local (persistent localhost):
- Terminal 1: npx hardhat node
- Terminal 2: npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost

Sepolia:
- Ensure .env is set
- npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia

Ignition stores addresses under ignition/deployments/chain-<chainId>/deployed_addresses.json (31337 for local, 11155111 for sepolia).

## Interactions

Use scripts/Fund.js to query and interact with the deployed contract. The script auto-resolves the FundMe address from Ignition’s deployed_addresses.json for the current network.

Notes:
- Minimum contribution is 1 USD worth of ETH (uses Chainlink feed).
- Always specify the network to match where you deployed.

Show info:
- npx hardhat run scripts/Fund.js --network hardhat info
- npx hardhat run scripts/Fund.js --network localhost info
- npx hardhat run scripts/Fund.js --network sepolia info

Fund (examples):
- npx hardhat run scripts/Fund.js --network hardhat fund 0.001
- npx hardhat run scripts/Fund.js --network sepolia fund 0.005
Or with env:
- ACTION=fund AMOUNT=0.001 npx hardhat run scripts/Fund.js --network hardhat

Withdraw (owner only):
- npx hardhat run scripts/Fund.js --network hardhat withdraw
- npx hardhat run scripts/Fund.js --network sepolia withdraw

List funders:
- npx hardhat run scripts/Fund.js --network hardhat funders

Example output (info):
Network: hardhat (chainId: 31337)
Signer: 0x...
FundMe address: 0xe7f1...
Owner: 0x...
Price Feed: 0x...
Contract Balance: 0.002 ETH
My Funded Amount: 0.001 ETH

Troubleshooting:
- “No deployed addresses found…”: Deploy with Ignition for that network first.
- “FundMe address not found…”: Ensure you used ignition/modules/FundMe.js and the resulting file contains FundMeModuleV2#FundMe.

## Tests

- Unit (local): npx hardhat test
- Coverage: npx hardhat coverage
- Gas report: generated to gas-report.txt
- Staging (Sepolia, optional): set .env and run tests with --network sepolia or run the staging spec directly after deployment.

```// filepath: /home/sovan/fundme_yt/README.md
# FundMe (Hardhat + Chainlink)

A minimal crowdfunding contract using Chainlink price feeds to enforce a USD-denominated minimum.

- Solidity: 0.8.28
- Deployments: Hardhat Ignition
- Tests: Mocha/Chai
- Networks: hardhat, sepolia

## Setup

- Node.js LTS
- Install deps
  - npm install
- Configure .env (never commit secrets)
  - SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, ETHERSCAN_API_KEY

## Deploy

Local (hardhat in-process):
- npx hardhat ignition deploy ignition/modules/FundMe.js --network hardhat

Local (persistent localhost):
- Terminal 1: npx hardhat node
- Terminal 2: npx hardhat ignition deploy ignition/modules/FundMe.js --network localhost

Sepolia:
- Ensure .env is set
- npx hardhat ignition deploy ignition/modules/FundMe.js --network sepolia

Ignition stores addresses under ignition/deployments/chain-<chainId>/deployed_addresses.json (31337 for local, 11155111 for sepolia).

## Interactions

Use scripts/Fund.js to query and interact with the deployed contract. The script auto-resolves the FundMe address from Ignition’s deployed_addresses.json for the current network.

Notes:
- Minimum contribution is 1 USD worth of ETH (uses Chainlink feed).
- Always specify the network to match where you deployed.

Show info:
- ACTION=info npx hardhat run scripts/Fund.js --network <NETWORK>


Fund (examples):
- ACTION=fund AMOUNT=0.001 npx hardhat run scripts/Fund.js --network <NETWORK>

Withdraw (owner only):
- ACTION=withdraw npx hardhat run scripts/Fund.js --network <NETWORK>


List funders:
- ACTION=funders npx hardhat run scripts/Fund.js --network <NETWORK>

Example output (info):
Network: hardhat (chainId: 31337)
Signer: 0x...
FundMe address: 0xe7f1...
Owner: 0x...
Price Feed: 0x...
Contract Balance: 0.002 ETH
My Funded Amount: 0.001 ETH

Troubleshooting:
- “No deployed addresses found…”: Deploy with Ignition for that network first.
- “FundMe address not found…”: Ensure you used ignition/modules/FundMe.js and the resulting file contains FundMeModuleV2#FundMe.

## Tests

- Unit (local): npx hardhat test
- Coverage: npx hardhat coverage
- Gas report: generated to gas-report.txt
- Staging (Sepolia, optional): set .env and run tests with --network sepolia or run the staging spec directly after deployment.
