# Security Report: MedicineRegistry

EC8204 Blockchain and Cyber Security, Counterfeit Medicine Checker.

## Scope

| Item | Detail |
|---|---|
| Contract | [`contracts/src/MedicineRegistry.sol`](../contracts/src/MedicineRegistry.sol) (one contract, about 250 lines) |
| Dependency | OpenZeppelin Contracts 5.6.1 `AccessControl` (not reviewed, widely audited) |
| Compiler | Solidity 0.8.30 (checked arithmetic, so no overflow or underflow) |
| Out of scope | The web app, the deploy script, wallets and key management (covered only in the threat model) |

## Tools

| Tool | Version | Used for |
|---|---|---|
| Foundry `forge test` | 1.8.3 | Unit, attack, fuzz and invariant tests |
| Foundry `forge coverage` | 1.8.3 | Line, statement, branch and function coverage |
| Foundry `forge lint` | 1.8.3 | Lint checks during `forge build` |
| Slither | 0.11.6 | Static analysis (102 detectors) |

## Summary

- **No high or medium findings.**
- Slither reported 4 low-severity findings, all `timestamp`. They are accepted (see below).
- **32 tests pass**: 28 unit and attack tests, 3 fuzz tests (1,000 runs each), and 1 invariant suite
  with 3 invariants (256 runs × 50 calls = 12,800 random calls).
- **100% coverage** of lines (81/81), statements (105/105), branches (27/27) and functions (13/13).

## Findings

| # | Tool | Detector | Severity | Location | Decision |
|---|---|---|---|---|---|
| 1 | Slither, forge lint | `timestamp` | Low | `registerBatch`: `expiryDate <= block.timestamp` (line 147) | Accepted |
| 2 | Slither, forge lint | `timestamp` | Low | `transferBatch`: `block.timestamp >= b.expiryDate` (line 180) | Accepted |
| 3 | Slither, forge lint | `timestamp` | Low | `dispense`: `block.timestamp >= b.expiryDate` (line 201) | Accepted |
| 4 | Slither, forge lint | `timestamp` | Low | `verify`: `block.timestamp >= batch.expiryDate` (line 236) | Accepted |
| 5 | forge lint | `require-revert-in-loop` | Info | `registerBatch`: `revert DuplicateSerial` inside the loop | Accepted, intentional |
| 6 | forge lint | `unsafe-typecast` | Info | `uint32(n)` and two `uint64(block.timestamp)` casts | Suppressed with a comment: `n <= 200`, and timestamps fit in `uint64` for billions of years |

### Why these are accepted

- **Timestamps (1–4):** validators can shift `block.timestamp` by a few seconds. Expiry dates are
  measured in days, so a shift of seconds can't make an expired medicine sellable in practice.
- **Revert in loop (5):** a batch that contains a duplicate serial is rejected as a whole
  (all-or-nothing). Letting part of a batch through would be worse. The loop is capped at 200
  packs, so it can't run out of gas.
- **No reentrancy risk:** the contract never sends ETH and never calls another contract.

## Threat model

Each defence is enforced by the contract and proved by a named test in
[`contracts/test/`](../contracts/test/).

| Threat | How the contract stops it | Test that proves it |
|---|---|---|
| Unlicensed factory registers a fake batch | Only `MANUFACTURER_ROLE` can call `registerBatch` | `test_Attack_UnregisteredFactoryCannotRegisterBatch`, `testFuzz_OnlyManufacturersCanRegister` |
| Made-up QR codes | Unknown serials return `NotFound` | `test_Attack_FakeCodeIsNotFound`, `testFuzz_RandomSerialIsNotFound` |
| Photocopied genuine QR code | After a sale, every scan shows where and when it was sold, and a second sale is rejected | `test_Attack_ClonedQrCodeIsFlaggedAfterSale`, `test_Attack_CannotSellSamePackTwice`, `invariant_NoPackIsSoldTwice` |
| Rogue pharmacy sells stock it never received | `dispense` needs the raw serial and the caller must hold the batch | `test_Attack_RoguePharmacyCannotSellOthersStock` |
| Manufacturer re-uses another pack's serial | Duplicate serial hashes are rejected | `test_Attack_CannotHijackExistingSerial` |
| Recalled medicine keeps being sold | Recalled batches can't move or be sold, and `verify` shows `Recalled` | `test_Attack_RecalledBatchCannotBeSold`, `test_RecallRules` |
| Struck-off distributor keeps shipping | Revoking the role blocks transfers | `test_Attack_RevokedDistributorCannotShip` |
| Stock diverted to an unlicensed seller | The recipient must be a registered distributor or pharmacy | `test_Attack_CannotShipToUnregisteredAddress` |
| Pharmacy passes stock on to another seller | Only manufacturers and distributors can transfer | `test_RevertWhen_PharmacyTransfersOnward` |
| Expired stock is moved or sold | Transfers and sales revert after the expiry date | `test_RevertWhen_TransferAfterExpiry`, `test_RevertWhen_DispenseAfterExpiry` |
| NMRA creates a second regulator | `registerParticipant` only accepts the three supply-chain roles | `test_RevertWhen_RegisteringAnotherRegulator` |
| Huge batch exhausts gas (denial of service) | At most 200 packs per call | `test_RevertWhen_BatchIsEmptyOrTooLarge` |
| More packs sold than registered | `dispensedCount` can never exceed `unitCount` | `invariant_NeverSellMoreThanRegistered`, `invariant_ContractCountMatchesRealSales` |
| Serial list read from the blockchain | Only `keccak256` hashes are stored, and guessing a 128-bit serial is infeasible | Design |
| Stolen deployer key | Deployed from an encrypted keystore, never a `.env` file. In production: a multi-signature NMRA wallet | Process |

## Test evidence

| Kind | Count | What it shows |
|---|---|---|
| Unit | 4 | Normal behaviour: genuine, custody trail, not approved, expired |
| Attack | 9 | Each attack in the threat model is blocked ([output](evidence/attack-tests.txt)) |
| Input validation and revert branches | 15 | Every revert in the contract is reached with the exact error |
| Fuzz | 3 | 1,000 random inputs each |
| Invariant | 1 suite, 3 invariants | Hold after 12,800 random calls |

Coverage went from **66.7% to 100% of branches** after adding the revert-branch tests.

## Gas

Measured with `forge test --gas-report` (median) and a local deployment.

| Action | Gas |
|---|---|
| Deploy the contract | 3,133,064 |
| Register a participant | about 76,000 |
| Register a batch (1 pack) | about 188,000 |
| Approve a batch | about 31,000 |
| Transfer a batch | about 104,000 |
| Sell a pack (dispense) | about 60,000 (max) |
| Verify a pack (patient) | free: a read, not a transaction |

## Known limitations

- **First-scan race:** if a counterfeiter copies a code from a genuine pack on a shelf and sells the
  fake first, the genuine pack later shows "already sold". The fraud is still detected, and we
  know which pharmacy sold it. In production, the QR goes inside the box or under a scratch panel.
- **Batch-level custody:** a whole batch goes to one pharmacy. Real systems split batches into
  shipments.
- **200 packs per registration:** keeps each transaction within gas limits. A Merkle-tree version
  could register any batch size with a single hash.
- **Single regulator key:** in production the NMRA role would be a multi-signature wallet.

## Privacy

No patient data is ever stored on-chain, only medicine, batch and organisation data plus serial
hashes. This is in line with Sri Lanka's Personal Data Protection Act (No. 9 of 2022).

## How to reproduce

Run from `contracts/` (in WSL on laptops where Smart App Control blocks Foundry):

```bash
forge test                                                            # 32 passed
forge test --match-test Attack -vv                                    # the 9 attack tests
forge coverage --report summary --no-match-coverage "(test|script)"   # 100%
forge test --gas-report
slither .                                                             # 4 low findings
```
