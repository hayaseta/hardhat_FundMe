const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MockV3AggregatorModule",(m)=>{
    const DECIMALS = m.getParameter("decimals",8);
    const INITIAL_ANSWER = m.getParameter("initialAnswer",200000000000); // 2000.00000000

    const mockV3Aggregator = m.contract("MockV3Aggregator",[DECIMALS,INITIAL_ANSWER]);

    return {mockV3Aggregator};
});