// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {MedicineRegistry} from "../src/MedicineRegistry.sol";

/// @dev The fuzzer calls these functions in random order with random inputs.
contract Handler is Test {
    MedicineRegistry public reg;
    address public pharmacy;
    bytes16[] public serials;

    uint256 public successfulSales;
    mapping(bytes16 => bool) public sold;
    uint256 public doubleSales; // must stay 0

    constructor(MedicineRegistry _reg, address _pharmacy, bytes16[] memory _serials) {
        reg = _reg;
        pharmacy = _pharmacy;
        serials = _serials;
    }

    function dispense(uint256 index) external {
        bytes16 s = serials[bound(index, 0, serials.length - 1)];
        vm.prank(pharmacy);
        try reg.dispense(s) {
            if (sold[s]) doubleSales++;
            sold[s] = true;
            successfulSales++;
        } catch {}
    }

    function dispenseRandom(bytes16 s) external {
        vm.prank(pharmacy);
        try reg.dispense(s) {
            if (sold[s]) doubleSales++;
            sold[s] = true;
            successfulSales++;
        } catch {}
    }
}

contract MedicineRegistryInvariantTest is StdInvariant, Test {
    MedicineRegistry reg;
    Handler handler;
    uint256 batchId;

    function setUp() public {
        address nmra = makeAddr("nmra");
        address maker = makeAddr("maker");
        address pharmacy = makeAddr("pharmacy");

        reg = new MedicineRegistry(nmra);
        vm.startPrank(nmra);
        reg.registerParticipant(maker, reg.MANUFACTURER_ROLE(), "Maker");
        reg.registerParticipant(pharmacy, reg.PHARMACY_ROLE(), "Pharmacy");
        vm.stopPrank();

        bytes16[] memory serials = new bytes16[](20);
        bytes32[] memory hashes = new bytes32[](20);
        for (uint256 i; i < 20; ++i) {
            serials[i] = bytes16(keccak256(abi.encode("serial", i)));
            hashes[i] = reg.hashSerial(serials[i]);
        }
        vm.prank(maker);
        batchId = reg.registerBatch(
            "Amoxicillin 250mg", "AMOX-01", uint64(block.timestamp + 365 days), hashes
        );
        vm.prank(nmra);
        reg.approveBatch(batchId);
        vm.prank(maker);
        reg.transferBatch(batchId, pharmacy);

        handler = new Handler(reg, pharmacy, serials);
        targetContract(address(handler));
    }

    function invariant_NeverSellMoreThanRegistered() public view {
        MedicineRegistry.Batch memory b = reg.getBatch(batchId);
        assertLe(b.dispensedCount, b.unitCount);
    }

    function invariant_NoPackIsSoldTwice() public view {
        assertEq(handler.doubleSales(), 0);
    }

    function invariant_ContractCountMatchesRealSales() public view {
        assertEq(reg.getBatch(batchId).dispensedCount, handler.successfulSales());
    }
}
