// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.28;
import "./PriceConverter.sol";

contract FundMe {
  using PriceConverter for uint256;

  address public owner;
  address []public funders;
  mapping (address => uint) public addressToAmountFunded;

  uint256 minimumUsd = 1 * 1e18;

  constructor() {
    owner = msg.sender;
  }

  function fund() public payable{
    require(msg.value.getConversionRate() >= minimumUsd, "Not enough ETH sent!");
    funders.push(msg.sender);
    addressToAmountFunded[msg.sender] = msg.value;
  }

  function withdraw() public onlyOwner {
    for(uint256 i = 0; i<funders.length; i++){
      addressToAmountFunded[funders[i]] = 0;
    }

    funders = new address[](0);

    (bool callSuccess,) = payable(msg.sender).call{value: address(this).balance}("");
    require(callSuccess, "Call failed");
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Only withdrawable to owner!");
    _;
  }

  receive() external payable {
    fund();
  }
  fallback() external payable {
    fund();
  }

}