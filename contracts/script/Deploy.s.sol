// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MedicineRegistry} from "../src/MedicineRegistry.sol";

contract Deploy is Script {
    function run() external returns (MedicineRegistry registry) {
        // The NMRA wallet: it becomes admin and regulator.
        address regulator = vm.envAddress("REGULATOR_ADDRESS");

        vm.startBroadcast();
        registry = new MedicineRegistry(regulator);
        vm.stopBroadcast();

        console.log("MedicineRegistry deployed at:", address(registry));
    }
}
