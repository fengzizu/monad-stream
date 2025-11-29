// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamPay} from "../src/StreamPay.sol";

contract DeployStreamPay is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        StreamPay streamPay = new StreamPay();
        console.log("StreamPay deployed to:", address(streamPay));

        vm.stopBroadcast();
    }
}


