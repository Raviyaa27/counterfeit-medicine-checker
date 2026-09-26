// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MedicineRegistry} from "../src/MedicineRegistry.sol";

contract MedicineRegistryTest is Test {
    MedicineRegistry reg;

    address nmra = makeAddr("nmra");
    address maker = makeAddr("maker");
    address distributor = makeAddr("distributor");
    address pharmacyA = makeAddr("pharmacyA");
    address pharmacyB = makeAddr("pharmacyB");

    bytes16 constant SERIAL = bytes16(0x8f3a1c2b4d5e6f708192a3b4c5d6e7f8);

    function setUp() public {
        reg = new MedicineRegistry(nmra);
        vm.startPrank(nmra);
        reg.registerParticipant(maker, reg.MANUFACTURER_ROLE(), "CeyPharma Ltd");
        reg.registerParticipant(distributor, reg.DISTRIBUTOR_ROLE(), "Island Distributors");
        reg.registerParticipant(pharmacyA, reg.PHARMACY_ROLE(), "Pharmacy A, Galle");
        reg.registerParticipant(pharmacyB, reg.PHARMACY_ROLE(), "Pharmacy B, Matara");
        vm.stopPrank();
    }

    // ------------------------------------------------------------------ helpers

    function _register() internal returns (uint256 id) {
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = reg.hashSerial(SERIAL);
        vm.prank(maker);
        id = reg.registerBatch(
            "Paracetamol 500mg", "PARA-2026-001", uint64(block.timestamp + 365 days), hashes
        );
    }

    function _readyAtPharmacyA() internal returns (uint256 id) {
        id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        vm.prank(maker);
        reg.transferBatch(id, distributor);
        vm.prank(distributor);
        reg.transferBatch(id, pharmacyA);
    }

    function _verdict(bytes16 serial) internal view returns (MedicineRegistry.Verdict v) {
        (v,,,,) = reg.verify(reg.hashSerial(serial));
    }

    // ------------------------------------------------------------------ happy path

    function test_GenuinePackVerifies() public {
        _readyAtPharmacyA();
        assertEq(uint8(_verdict(SERIAL)), uint8(MedicineRegistry.Verdict.Genuine));
    }

    function test_CustodyTrailIsRecorded() public {
        uint256 id = _readyAtPharmacyA();
        MedicineRegistry.Handover[] memory trail = reg.getTrail(id);
        assertEq(trail.length, 2);
        assertEq(trail[0].to, distributor);
        assertEq(trail[1].to, pharmacyA);
        assertEq(reg.getBatch(id).holder, pharmacyA);
    }

    function test_UnapprovedBatchShowsNotApproved() public {
        _register();
        assertEq(uint8(_verdict(SERIAL)), uint8(MedicineRegistry.Verdict.NotApproved));
    }

    function test_ExpiredPackShowsExpired() public {
        _readyAtPharmacyA();
        vm.warp(block.timestamp + 366 days);
        assertEq(uint8(_verdict(SERIAL)), uint8(MedicineRegistry.Verdict.Expired));
    }

    // ------------------------------------------------------------------ attack scenarios (demo slide)

    function test_Attack_FakeCodeIsNotFound() public {
        _readyAtPharmacyA();
        assertEq(
            uint8(_verdict(bytes16(0xdeadbeefdeadbeefdeadbeefdeadbeef))),
            uint8(MedicineRegistry.Verdict.NotFound)
        );
    }

    function test_Attack_ClonedQrCodeIsFlaggedAfterSale() public {
        _readyAtPharmacyA();
        vm.prank(pharmacyA);
        reg.dispense(SERIAL);

        (MedicineRegistry.Verdict v,,, address soldBy,) = reg.verify(reg.hashSerial(SERIAL));
        assertEq(uint8(v), uint8(MedicineRegistry.Verdict.Dispensed));
        assertEq(soldBy, pharmacyA);
    }

    function test_Attack_CannotSellSamePackTwice() public {
        _readyAtPharmacyA();
        vm.prank(pharmacyA);
        reg.dispense(SERIAL);

        vm.prank(pharmacyA);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.AlreadyDispensed.selector, pharmacyA, uint64(block.timestamp)
            )
        );
        reg.dispense(SERIAL);
    }

    function test_Attack_RoguePharmacyCannotSellOthersStock() public {
        _readyAtPharmacyA();
        vm.prank(pharmacyB);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.NotHolder.selector, pharmacyA));
        reg.dispense(SERIAL);
    }

    function test_Attack_UnregisteredFactoryCannotRegisterBatch() public {
        address fakeFactory = makeAddr("fakeFactory");
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = keccak256("fake");
        vm.prank(fakeFactory);
        vm.expectRevert(); // AccessControlUnauthorizedAccount
        reg.registerBatch("Fake Paracetamol", "FAKE-1", uint64(block.timestamp + 365 days), hashes);
    }

    function test_Attack_CannotHijackExistingSerial() public {
        _register();
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = reg.hashSerial(SERIAL);
        vm.prank(maker);
        vm.expectRevert(
            abi.encodeWithSelector(MedicineRegistry.DuplicateSerial.selector, hashes[0])
        );
        reg.registerBatch("Copy", "COPY-1", uint64(block.timestamp + 365 days), hashes);
    }

    function test_Attack_RecalledBatchCannotBeSold() public {
        uint256 id = _readyAtPharmacyA();
        vm.prank(nmra);
        reg.recallBatch(id, "Failed quality test");

        assertEq(uint8(_verdict(SERIAL)), uint8(MedicineRegistry.Verdict.Recalled));
        vm.prank(pharmacyA);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.InvalidStatus.selector, MedicineRegistry.BatchStatus.Recalled
            )
        );
        reg.dispense(SERIAL);
    }

    function test_Attack_RevokedDistributorCannotShip() public {
        uint256 id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        vm.prank(maker);
        reg.transferBatch(id, distributor);

        vm.startPrank(nmra);
        reg.revokeParticipant(distributor, reg.DISTRIBUTOR_ROLE());
        vm.stopPrank();

        vm.prank(distributor);
        vm.expectRevert(MedicineRegistry.NotAuthorized.selector);
        reg.transferBatch(id, pharmacyA);
    }

    function test_Attack_CannotShipToUnregisteredAddress() public {
        uint256 id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        address stranger = makeAddr("stranger");
        vm.prank(maker);
        vm.expectRevert(
            abi.encodeWithSelector(MedicineRegistry.InvalidRecipient.selector, stranger)
        );
        reg.transferBatch(id, stranger);
    }

    // ------------------------------------------------------------------ input validation

    function test_RevertWhen_BatchIsEmptyOrTooLarge() public {
        vm.startPrank(maker);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.InvalidUnitCount.selector, 0));
        reg.registerBatch("X", "X", uint64(block.timestamp + 1 days), new bytes32[](0));

        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.InvalidUnitCount.selector, 201));
        reg.registerBatch("X", "X", uint64(block.timestamp + 1 days), new bytes32[](201));
        vm.stopPrank();
    }

    function test_RevertWhen_ExpiryInPast() public {
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = reg.hashSerial(SERIAL);
        vm.prank(maker);
        vm.expectRevert(MedicineRegistry.InvalidExpiry.selector);
        reg.registerBatch("X", "X", uint64(block.timestamp), hashes);
    }

    function test_RevertWhen_NonRegulatorApproves() public {
        uint256 id = _register();
        vm.prank(maker);
        vm.expectRevert();
        reg.approveBatch(id);
    }

    // ------------------------------------------------------------------ remaining revert branches

    function test_RevertWhen_ApprovingTwice() public {
        uint256 id = _register();
        vm.startPrank(nmra);
        reg.approveBatch(id);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.InvalidStatus.selector, MedicineRegistry.BatchStatus.Approved
            )
        );
        reg.approveBatch(id);
        vm.stopPrank();
    }

    function test_RevertWhen_BatchDoesNotExist() public {
        vm.prank(nmra);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.UnknownBatch.selector, 99));
        reg.approveBatch(99);
    }

    function test_RecallRules() public {
        uint256 id = _register();

        vm.prank(pharmacyA);
        vm.expectRevert(MedicineRegistry.NotAuthorized.selector);
        reg.recallBatch(id, "not mine");

        vm.prank(maker);
        reg.recallBatch(id, "Labelling error");
        assertEq(uint8(_verdict(SERIAL)), uint8(MedicineRegistry.Verdict.Recalled));

        vm.prank(nmra);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.InvalidStatus.selector, MedicineRegistry.BatchStatus.Recalled
            )
        );
        reg.recallBatch(id, "again");
    }

    function test_RevertWhen_TransferBeforeApproval() public {
        uint256 id = _register();
        vm.prank(maker);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.InvalidStatus.selector, MedicineRegistry.BatchStatus.Pending
            )
        );
        reg.transferBatch(id, distributor);
    }

    function test_RevertWhen_TransferByNonHolder() public {
        uint256 id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        vm.prank(distributor);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.NotHolder.selector, maker));
        reg.transferBatch(id, pharmacyA);
    }

    function test_RevertWhen_TransferToSelf() public {
        uint256 id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        vm.prank(maker);
        reg.transferBatch(id, distributor);
        vm.prank(distributor);
        vm.expectRevert(
            abi.encodeWithSelector(MedicineRegistry.InvalidRecipient.selector, distributor)
        );
        reg.transferBatch(id, distributor);
    }

    function test_RevertWhen_PharmacyTransfersOnward() public {
        uint256 id = _readyAtPharmacyA();
        vm.prank(pharmacyA);
        vm.expectRevert(MedicineRegistry.NotAuthorized.selector);
        reg.transferBatch(id, pharmacyB);
    }

    function test_RevertWhen_TransferAfterExpiry() public {
        uint256 id = _register();
        vm.prank(nmra);
        reg.approveBatch(id);
        uint64 expiry = reg.getBatch(id).expiryDate;
        vm.warp(expiry);
        vm.prank(maker);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.BatchExpired.selector, expiry));
        reg.transferBatch(id, distributor);
    }

    function test_RevertWhen_DispenseAfterExpiry() public {
        uint256 id = _readyAtPharmacyA();
        uint64 expiry = reg.getBatch(id).expiryDate;
        vm.warp(expiry);
        vm.prank(pharmacyA);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.BatchExpired.selector, expiry));
        reg.dispense(SERIAL);
    }

    function test_RevertWhen_DispenseUnknownSerial() public {
        vm.prank(pharmacyA);
        vm.expectRevert(MedicineRegistry.UnknownSerial.selector);
        reg.dispense(SERIAL);
    }

    function test_RevertWhen_DispenseFromPendingBatch() public {
        _register();
        vm.prank(pharmacyA);
        vm.expectRevert(
            abi.encodeWithSelector(
                MedicineRegistry.InvalidStatus.selector, MedicineRegistry.BatchStatus.Pending
            )
        );
        reg.dispense(SERIAL);
    }

    function test_RevertWhen_RegisteringAnotherRegulator() public {
        bytes32 role = reg.REGULATOR_ROLE();
        vm.prank(nmra);
        vm.expectRevert(abi.encodeWithSelector(MedicineRegistry.InvalidRole.selector, role));
        reg.registerParticipant(pharmacyB, role, "Fake NMRA");
    }

    // ------------------------------------------------------------------ fuzz tests

    function testFuzz_OnlyManufacturersCanRegister(address caller) public {
        vm.assume(caller != maker);
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = reg.hashSerial(SERIAL);
        vm.prank(caller);
        vm.expectRevert();
        reg.registerBatch("X", "X", uint64(block.timestamp + 1 days), hashes);
    }

    function testFuzz_RandomSerialIsNotFound(bytes16 randomSerial) public {
        vm.assume(randomSerial != SERIAL);
        _readyAtPharmacyA();
        assertEq(uint8(_verdict(randomSerial)), uint8(MedicineRegistry.Verdict.NotFound));
    }

    function testFuzz_NoPharmacyCanSellTwice(bytes16 serial) public {
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = reg.hashSerial(serial);
        vm.prank(maker);
        uint256 id = reg.registerBatch("X", "X", uint64(block.timestamp + 1 days), hashes);
        vm.prank(nmra);
        reg.approveBatch(id);
        vm.prank(maker);
        reg.transferBatch(id, pharmacyA);

        vm.prank(pharmacyA);
        reg.dispense(serial);
        vm.prank(pharmacyA);
        vm.expectRevert();
        reg.dispense(serial);
    }
}
