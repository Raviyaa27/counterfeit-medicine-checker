// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title MedicineRegistry
/// @notice Tracks medicine batches from manufacturer to pharmacy. Anyone can verify a pack
///         using the secret serial printed in its QR code.
contract MedicineRegistry is AccessControl {
    // ------------------------------------------------------------------ roles
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE"); // NMRA
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    /// @dev Caps the loop in registerBatch so a call can never run out of gas.
    uint256 public constant MAX_UNITS_PER_BATCH = 200;

    // ------------------------------------------------------------------ types
    enum BatchStatus {
        None,
        Pending,
        Approved,
        Recalled
    }

    enum Verdict {
        NotFound, // serial was never registered: likely counterfeit
        NotApproved, // batch not yet approved by the regulator
        Genuine, // approved, in date, not yet sold
        Dispensed, // already sold: genuine only if the buyer bought it there
        Recalled, // do not use
        Expired
    }

    struct Batch {
        string drugName;
        string batchNumber;
        address manufacturer;
        address holder;
        uint64 expiryDate;
        uint32 unitCount;
        uint32 dispensedCount;
        BatchStatus status;
    }

    struct Unit {
        uint256 batchId; // 0 means "not registered"
        address dispensedBy;
        uint64 dispensedAt;
    }

    struct Handover {
        address from;
        address to;
        uint64 at;
    }

    // ------------------------------------------------------------------ storage
    uint256 public batchCount;
    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => Handover[]) private _trail;
    mapping(bytes32 => Unit) private _units; // key: keccak256(serial)
    mapping(address => string) public orgName;

    // ------------------------------------------------------------------ events
    event ParticipantRegistered(address indexed account, bytes32 indexed role, string name);
    event ParticipantRevoked(address indexed account, bytes32 indexed role);
    event BatchRegistered(
        uint256 indexed batchId, address indexed manufacturer, string batchNumber, uint256 units
    );
    event BatchApproved(uint256 indexed batchId);
    event BatchRecalled(uint256 indexed batchId, address indexed by, string reason);
    event BatchTransferred(uint256 indexed batchId, address indexed from, address indexed to);
    event UnitDispensed(
        uint256 indexed batchId, bytes32 indexed serialHash, address indexed pharmacy
    );

    // ------------------------------------------------------------------ errors
    error InvalidRole(bytes32 role);
    error InvalidUnitCount(uint256 count);
    error InvalidExpiry();
    error DuplicateSerial(bytes32 serialHash);
    error UnknownBatch(uint256 batchId);
    error InvalidStatus(BatchStatus status);
    error NotAuthorized();
    error NotHolder(address holder);
    error BatchExpired(uint64 expiryDate);
    error InvalidRecipient(address to);
    error UnknownSerial();
    error AlreadyDispensed(address pharmacy, uint64 at);

    constructor(address regulator) {
        _grantRole(DEFAULT_ADMIN_ROLE, regulator);
        _grantRole(REGULATOR_ROLE, regulator);
    }

    // ------------------------------------------------------------------ regulator (NMRA)

    function registerParticipant(address account, bytes32 role, string calldata name)
        external
        onlyRole(REGULATOR_ROLE)
    {
        if (role != MANUFACTURER_ROLE && role != DISTRIBUTOR_ROLE && role != PHARMACY_ROLE) {
            revert InvalidRole(role);
        }
        _grantRole(role, account);
        orgName[account] = name;
        emit ParticipantRegistered(account, role, name);
    }

    function revokeParticipant(address account, bytes32 role) external onlyRole(REGULATOR_ROLE) {
        _revokeRole(role, account);
        emit ParticipantRevoked(account, role);
    }

    function approveBatch(uint256 batchId) external onlyRole(REGULATOR_ROLE) {
        Batch storage b = _existingBatch(batchId);
        if (b.status != BatchStatus.Pending) revert InvalidStatus(b.status);
        b.status = BatchStatus.Approved;
        emit BatchApproved(batchId);
    }

    /// @notice The regulator or the batch's own manufacturer can recall it.
    function recallBatch(uint256 batchId, string calldata reason) external {
        Batch storage b = _existingBatch(batchId);
        if (!hasRole(REGULATOR_ROLE, msg.sender) && msg.sender != b.manufacturer) {
            revert NotAuthorized();
        }
        if (b.status == BatchStatus.Recalled) revert InvalidStatus(b.status);
        b.status = BatchStatus.Recalled;
        emit BatchRecalled(batchId, msg.sender, reason);
    }

    // ------------------------------------------------------------------ manufacturer

    /// @param serialHashes keccak256 of each pack's secret serial.
    ///        Raw serials never go on-chain at registration.
    function registerBatch(
        string calldata drugName,
        string calldata batchNumber,
        uint64 expiryDate,
        bytes32[] calldata serialHashes
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256 batchId) {
        uint256 n = serialHashes.length;
        if (n == 0 || n > MAX_UNITS_PER_BATCH) revert InvalidUnitCount(n);
        if (expiryDate <= block.timestamp) revert InvalidExpiry();

        batchId = ++batchCount;
        _batches[batchId] = Batch({
            drugName: drugName,
            batchNumber: batchNumber,
            manufacturer: msg.sender,
            holder: msg.sender,
            expiryDate: expiryDate,
            // forge-lint: disable-next-line(unsafe-typecast) safe: n <= 200
            unitCount: uint32(n),
            dispensedCount: 0,
            status: BatchStatus.Pending
        });

        for (uint256 i; i < n; ++i) {
            bytes32 h = serialHashes[i];
            if (_units[h].batchId != 0) revert DuplicateSerial(h);
            _units[h].batchId = batchId;
        }
        emit BatchRegistered(batchId, msg.sender, batchNumber, n);
    }

    // ------------------------------------------------------------------ supply chain

    /// @notice Hand a batch to the next party. Only manufacturers and distributors can ship.
    function transferBatch(uint256 batchId, address to) external {
        Batch storage b = _existingBatch(batchId);
        if (b.status != BatchStatus.Approved) revert InvalidStatus(b.status);
        if (b.holder != msg.sender) revert NotHolder(b.holder);
        if (!hasRole(MANUFACTURER_ROLE, msg.sender) && !hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            revert NotAuthorized();
        }
        if (block.timestamp >= b.expiryDate) revert BatchExpired(b.expiryDate);
        if (to == msg.sender || (!hasRole(DISTRIBUTOR_ROLE, to) && !hasRole(PHARMACY_ROLE, to))) {
            revert InvalidRecipient(to);
        }

        b.holder = to;
        // forge-lint: disable-next-line(unsafe-typecast) safe: fits in uint64
        _trail[batchId].push(Handover({from: msg.sender, to: to, at: uint64(block.timestamp)}));
        emit BatchTransferred(batchId, msg.sender, to);
    }

    /// @notice Pharmacy marks a pack as sold. Needs the raw serial, so the pharmacy must
    ///         physically hold the pack, and must be the current holder of its batch.
    function dispense(bytes16 serial) external onlyRole(PHARMACY_ROLE) {
        bytes32 h = hashSerial(serial);
        Unit storage u = _units[h];
        if (u.batchId == 0) revert UnknownSerial();
        if (u.dispensedAt != 0) revert AlreadyDispensed(u.dispensedBy, u.dispensedAt);

        Batch storage b = _batches[u.batchId];
        if (b.status != BatchStatus.Approved) revert InvalidStatus(b.status);
        if (block.timestamp >= b.expiryDate) revert BatchExpired(b.expiryDate);
        if (b.holder != msg.sender) revert NotHolder(b.holder);

        u.dispensedBy = msg.sender;
        // forge-lint: disable-next-line(unsafe-typecast) safe: fits in uint64
        u.dispensedAt = uint64(block.timestamp);
        b.dispensedCount += 1;
        emit UnitDispensed(u.batchId, h, msg.sender);
    }

    // ------------------------------------------------------------------ public reads

    /// @notice What a patient sees after scanning a QR code. Free to call, no wallet needed.
    function verify(bytes32 serialHash)
        external
        view
        returns (
            Verdict verdict,
            uint256 batchId,
            Batch memory batch,
            address dispensedBy,
            uint64 dispensedAt
        )
    {
        Unit storage u = _units[serialHash];
        batchId = u.batchId;
        if (batchId == 0) return (Verdict.NotFound, 0, batch, address(0), 0);

        batch = _batches[batchId];
        dispensedBy = u.dispensedBy;
        dispensedAt = u.dispensedAt;

        if (batch.status == BatchStatus.Recalled) verdict = Verdict.Recalled;
        else if (batch.status == BatchStatus.Pending) verdict = Verdict.NotApproved;
        else if (dispensedAt != 0) verdict = Verdict.Dispensed;
        else if (block.timestamp >= batch.expiryDate) verdict = Verdict.Expired;
        else verdict = Verdict.Genuine;
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        return _batches[batchId];
    }

    function getTrail(uint256 batchId) external view returns (Handover[] memory) {
        return _trail[batchId];
    }

    function hashSerial(bytes16 serial) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(serial));
    }

    // ------------------------------------------------------------------ internal

    function _existingBatch(uint256 batchId) private view returns (Batch storage b) {
        b = _batches[batchId];
        if (b.status == BatchStatus.None) revert UnknownBatch(batchId);
    }
}
