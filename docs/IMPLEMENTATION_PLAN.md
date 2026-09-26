# Counterfeit Medicine Checker: Implementation Plan

EC8204 Blockchain and Cyber Security group project, University of Ruhuna.

This plan breaks the [implementation guide](Counterfeit_Medicine_Checker_Implementation_Guide.pdf)
into phases and tasks you can tick off. The guide has the full commands and tested code
(Appendices A to D). This file tracks **what** to do, **who** does it, **when**, and **how we know
it is done**.

---

## Overview

| Item | Detail |
|---|---|
| **Assignment** | Pick a problem that blockchain can help solve, build the solution on any blockchain platform, and present it in 3 minutes (see the [project brief](EC8204_Aug26_Project%20Description.pdf)) |
| **Our solution** | Patients scan the QR code on a medicine pack. The page then shows one of: GENUINE, ALREADY SOLD, NOT FOUND, RECALLED, EXPIRED or NOT APPROVED |
| **Blockchain** | Ethereum Sepolia testnet (live) and Anvil (local development) |
| **Contract** | `MedicineRegistry.sol`: Solidity 0.8.30, OpenZeppelin 5.6.1 AccessControl, Foundry |
| **Web app** | Next.js 16, wagmi 3, viem 2 and qrcode.react, hosted on Vercel |
| **Deliverable** | `GP_XX_Counterfeit_Medicine_Checker.ppt` (3-minute presentation with a demo video) on ELMS |
| **Deadline** | The brief says 31/09/2026, which doesn't exist. We **submit on Tue 29 Sep**, and Wed 30 Sep is a buffer |

### Roles

| Member | Name | Role | Owns |
|---|---|---|---|
| **M1** | _______ | Blockchain lead | `contracts/src`, `contracts/script`, deployments, `/admin` and `/supply` pages |
| **M2** | _______ | Frontend lead | `frontend/` (except `/admin` and `/supply`), Vercel hosting |
| **M3** | _______ | Security, testing and presentation lead | `contracts/test`, `docs/security-report.md`, `.github/workflows`, video, slides, submission |

### Phase map

| Phase | Name | When | Main owners |
|---|---|---|---|
| 0 | Kick-off, tools and accounts | Day 1 (Sat 26 Sep), morning | All |
| 1 | Repository setup | Day 1, morning | M1 |
| 2 | Smart contract core and local chain | Day 1 | M1 |
| 3 | Frontend foundation and verify page | Day 1 | M2 |
| 4 | Tests and threat model | Day 1 | M3 |
| 5 | Role pages and the full local flow | Day 2 (Sun 27 Sep) | M1, M2 |
| 6 | Security hardening: coverage, Slither, CI | Day 2 | M3 |
| 7 | Sepolia and Vercel deployment | Day 3 (Mon 28 Sep) | M1, M2 |
| 8 | Demo, slides and rehearsal | Day 3 to Day 4 | M3 (all help) |
| 9 | Final polish and submission | Day 4 (Tue 29 Sep) | All |
| 10 | Buffer and stretch goals | Wed 30 Sep and later | Optional |

Phases 2, 3 and 4 run **in parallel** on Day 1. So do phases 5 and 6 on Day 2.

```
Day 1  ─ P0 ─ P1 ─┬─ P2 (M1) ─ H1 ─ H2 ─┐
                  ├─ P3 (M2) ───────────┤  Evening check 1
                  └─ P4 (M3) ───────────┘
Day 2  ─┬─ P5 (M1 + M2) ─┐                Evening check 2
        └─ P6 (M3) ──────┘
Day 3  ─ P7 (M1 ─ H3 ─ M2 ─ H4) ─ P8 starts   Evening check 3
Day 4  ─ P8 ─ P9 ─ SUBMIT
```

---

## Team working rules (apply to every phase)

- **`main` must always work.** Each member works on their own branch: `m1-contracts`,
  `m2-frontend` or `m3-tests`.
- Start each day with `git pull origin main`, then merge `main` into your branch.
- Merge through a Pull Request. Another member skims it and approves. If nobody is free within
  about 2 hours, merge it yourself, but only if the tests pass.
- Make small commits with clear messages, for example "Add dispense form to pharmacy page".
- **Never commit** `.env` files, private keys, recovery phrases or serial CSVs.
- Run every command in **Git Bash**, not PowerShell.
- Have a short check-in each evening against that day's **evening check**.

---

## Phase 0: Kick-off, tools and accounts

**Goal:** everyone can build and run the project, and test ETH starts coming in.
**When:** Day 1 morning (about 2 hours). **Guide:** Sections 1 to 4.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 0.1 | Read the guide together | All | Read Sections 1 to 4 of the guide (about 30 minutes): the problem, the system flow, roles, verdicts and the design decisions | Everyone can explain why only serial **hashes** go on-chain, and why a pack can be sold only once |
| 0.2 | Register the project | M1 | Before adding our row to the module's Google Sheet, check that no other group has already picked counterfeit medicine or pharmaceutical tracking (the brief says no two projects may be identical, and projects in the same domain must be different applications). Then add our row and write down our group number (`GP_XX`) | Our row is on the sheet, it doesn't duplicate another group's project, and we have a group number |
| 0.3 | Install the core tools | All | Git for Windows, Node.js 22 LTS, VS Code with the Solidity extension (Nomic Foundation), MetaMask. Then run `git config --global core.longpaths true` | `git --version` and `node --version` both work |
| 0.4 | Install Foundry | All | `curl -L https://foundry.paradigm.xyz \| bash`, then `foundryup`. If that fails, download the Windows zip (guide §4.1) into `C:\foundry` and add it to PATH | `forge --version` works |
| 0.5 | Install Slither | M3 | `python -m pip install slither-analyzer` | `slither --version` works |
| 0.6 | Create the demo wallet | M1 | Create a **new** MetaMask wallet used only for this project. Add 4 accounts named NMRA, CeyPharma, Distributor and Pharmacy A. Turn on test networks and select Sepolia | Four named accounts exist, with no real funds |
| 0.7 | Create the service accounts | M1, M2 | M1: an Alchemy Sepolia app (RPC URL) and an Etherscan API key. M2: a Vercel account (sign in with GitHub) | The keys are stored privately, **not** in the repo |
| 0.8 | Request Sepolia test ETH | All | Use a Sepolia faucet such as Google Cloud Web3 and send the ETH to the **NMRA** address. Faucets limit each person per day, so repeat daily | We have at least 0.1 test ETH in total by Day 3 |
| 0.9 | Agree the wallet safety rules | All | Read guide §4.2: no real money, no keys in chat, commits or screenshots, and keystore only for Sepolia | Everyone agrees |

---

## Phase 1: Repository setup

**Goal:** a single repo holding the Foundry project and the Next.js app. It builds cleanly and
everyone has cloned it.
**When:** Day 1 morning (about 30 minutes). **Owner:** M1. **Guide:** Section 5.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 1.1 | Create the Foundry project | M1 | `forge init contracts --use-parent-git`. Delete the Counter example files and `contracts/.github` | `contracts/` exists with no nested `.git` |
| 1.2 | Install OpenZeppelin from npm | M1 | In `contracts/`, run `npm init -y` and `npm install --save-exact @openzeppelin/contracts@5.6.1`, then add `node_modules/` to `.gitignore` | `node_modules/@openzeppelin` exists and is ignored by Git |
| 1.3 | Create the Next.js app | M1 | `npx create-next-app@latest frontend --ts --tailwind --eslint --app --use-npm --disable-git --yes`, then `npm install wagmi viem @tanstack/react-query qrcode.react` | `npm run dev` serves the default page |
| 1.4 | Add the config files | M1 | From Appendix A: `foundry.toml`, `slither.config.json`, `contracts/.env.example`. From Appendix C: `frontend/.env.example` | The files are in place |
| 1.5 | Check `.gitignore` | M1 | It must cover `.env`, `.env.local`, `node_modules/`, `out/`, `cache/`, `broadcast/` and `*.csv` | `git status` shows no secrets or build output |
| 1.6 | First push | M1 | `forge build` succeeds. Commit "Set up Foundry and Next.js projects" and push to `main` | The commit is on GitHub |
| 1.7 | Teammates clone | M2, M3 | `git clone --recursive …`, then `npm install && forge build` in `contracts/` and `npm install` in `frontend/`. Create your own branch | Both build locally |

---

## Phase 2: Smart contract core and local chain

**Goal:** the contract is in place and understood, the ABI is exported, and a single script sets
up a local demo.
**When:** Day 1. **Owner:** M1. **Guide:** Section 6 (M1.1 to M1.3), Appendix A and Appendix D.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 2.1 | Add the contract | M1 | Copy `contracts/src/MedicineRegistry.sol` from Appendix A | `forge build` says "Compiler run successful" |
| 2.2 | Study the contract | M1 | Read it from top to bottom: the 4 roles, `BatchStatus`, `Verdict`, the checks in `registerBatch`, `transferBatch` and `dispense`, the verdict priority (Recalled > NotApproved > Dispensed > Expired > Genuine) and `MAX_UNITS_PER_BATCH = 200` | M1 can explain each function in the table in guide §3.4 |
| 2.3 | Add the deploy script | M1 | `contracts/script/Deploy.s.sol` from Appendix A | It runs against Anvil without errors |
| 2.4 | Export the ABI | M1 | `echo "export const registryAbi = $(forge inspect MedicineRegistry abi --json) as const;" > ../frontend/lib/registryAbi.ts`. **Repeat after every contract change** | `frontend/lib/registryAbi.ts` exists and type-checks |
| 2.5 | **Handoff H1** | M1 → M2, M3 | Push the contract and `registryAbi.ts` to `main` and tell the team | Merged by Day 1 midday |
| 2.6 | Local demo script | M1 | Add `contracts/script/local-demo.sh` (Appendix D). Start `anvil` in one terminal and run `bash script/local-demo.sh` in another. The script assumes a **fresh** Anvil, because it hard-codes the first deployment address `0x5FbDB…0aa3` and re-registering the same serials fails. So restart Anvil before each run | It prints the registry address plus Genuine, Sold and Fake verify links |
| 2.7 | **Handoff H2** | M1 → M2 | Send the three verify links to M2. Restarting Anvil wipes the chain, so just run the script again | M2 has the links by Day 1 evening |

---

## Phase 3: Frontend foundation and verify page

**Goal:** the patient-facing verify page works against the local chain **without a wallet**.
**When:** Day 1. **Owner:** M2. **Guide:** Section 7 (M2.1 to M2.3) and Appendix C.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 3.1 | Connect the app to the chain | M2 | Add `lib/config.ts`, `lib/tx.ts`, `app/providers.tsx` and the updated `app/layout.tsx` from Appendix C. Run `cp .env.example .env.local` | `npm run dev` starts with no errors |
| 3.1b | Connect button | M2 | Add `components/ConnectButton.tsx` (Appendix C). Put it on every page that writes to the contract (`/admin`, `/supply`, `/manufacturer`, `/pharmacy`), but **not** on `/verify` | It connects and disconnects MetaMask and shows the short address |
| 3.2 | Set up MetaMask for Anvil | M2 | Add the network: RPC `http://127.0.0.1:8545`, chain ID `31337`. Import 4 Anvil test keys as NMRA, Manufacturer, Distributor and Pharmacy | MetaMask connects to the local app |
| 3.3 | Build the verify page | M2 | Add `app/verify/page.tsx`, `components/VerifyResult.tsx` and `components/OrgName.tsx`. The page reads `?s=<serial>`, hashes it and calls `verify()` as a free read | It works with no wallet connected |
| 3.4 | Test with the H2 links | M2 | Open the Genuine, Sold and Fake links | Green **GENUINE**, amber **ALREADY SOLD** (with "Sold by Pharmacy A, Galle on …") and red **NOT FOUND** |

### Evening check 1 (Day 1)

- [ ] `/verify` shows GENUINE, ALREADY SOLD and NOT FOUND on the local chain
- [ ] `forge test` passes on M3's machine (Phase 4)
- [ ] Everyone has requested Sepolia test ETH

---

## Phase 4: Tests and threat model

**Goal:** the full test suite runs, and M3 understands every test and threat.
**When:** Day 1. **Owner:** M3. **Guide:** Section 8 (M3.1), Section 9 and Appendix B.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 4.1 | Add the test files | M3 | Copy both test files from Appendix B into `contracts/test/` | They compile |
| 4.2 | Run the suite | M3 | `forge test` | **20 passed, 0 failed** |
| 4.3 | Understand the 4 kinds of test | M3 | Unit (normal behaviour), Attack (9 blocked attacks), Fuzz (1,000 random inputs each) and Invariant (12,800 random calls) | M3 can explain each kind in one sentence |
| 4.4 | Capture the attack tests | M3 | `forge test --match-test Attack -vv` and take a screenshot for the slides | The screenshot is saved in `docs/` |
| 4.5 | Study the threat model | M3 | Guide §9: map each threat to the contract defence and the test that proves it | M3 can answer "what stops a copied QR code?" and "what stops a rogue pharmacy?" |

---

## Phase 5: Role pages and the full local flow

**Goal:** every actor (NMRA, manufacturer, distributor, pharmacy) can do their job in the browser
with MetaMask on the local chain.
**When:** Day 2 (Sun 27 Sep). **Owners:** M1 (`/admin`, `/supply`) and M2 (`/manufacturer`,
`/pharmacy`, `/`). **Guide:** M1.4, M1.5 and M2.4 to M2.6.

### 5A. M1: NMRA and supply pages

| ID | Task | Details | Done when |
|---|---|---|---|
| 5.1 | Role constants | `frontend/lib/roles.ts`: `keccak256(toHex("MANUFACTURER_ROLE"))` and the same for the other roles, matching the contract | They are imported by `/admin` |
| 5.2 | `/admin`: register participant | Form with address, role dropdown and organisation name, calling `registerParticipant`. Use the **simulate → write → wait** pattern from `DispenseForm.tsx` | A new manufacturer shows up by name on `/verify` |
| 5.3 | `/admin`: approve batch | Read `batchCount`, loop over `getBatch(id)`, and list pending batches with an **Approve** button (`approveBatch`) | A pending batch changes to Approved |
| 5.4 | `/admin`: recall batch | Batch ID plus a reason, calling `recallBatch` | The verify page shows **RECALLED** |
| 5.5 | `/supply`: transfer batch | Batch ID plus a "ship to" dropdown of registered participants, calling `transferBatch(id, to)` | Manufacturer → distributor → pharmacy works |
| 5.6 | `/supply`: custody trail | Show `getTrail(id)` with `<OrgName>` and dates | Each handover is listed |

### 5B. M2: manufacturer, pharmacy and landing pages

| ID | Task | Details | Done when |
|---|---|---|---|
| 5.7 | `/manufacturer`: new batch | Start from `NewBatchForm.tsx`. Inputs: drug name, batch number, expiry date and pack count (1–200). Generate random 128-bit serials in the browser and send **only their hashes** | The transaction succeeds and the new batch ID is shown |
| 5.8 | `/manufacturer`: QR sheet | One QR per pack pointing to `https://<site>/verify?s=<serial>`. Add `@media print` CSS that hides everything except the QR grid | The print preview shows a clean QR grid |
| 5.9 | `/manufacturer`: CSV download | A "Download serials (CSV)" button. Show a warning that serials are secrets | The CSV downloads. **Never commit it** |
| 5.10 | `/pharmacy`: dispense | Start from `DispenseForm.tsx`. Enter a serial and mark it sold. Use `friendlyError` in `lib/tx.ts` to turn errors into plain messages ("Clone alert: this pack was already sold") | The second sale of the same pack shows a friendly error |
| 5.11 | `/` landing page | Project name, a one-sentence pitch, a "How to check a medicine" box and links to the 4 pages. This is the first thing examiners see | It looks clean at phone width |
| 5.12 | Verify page polish | A big coloured result card, the custody trail, and "Checked on the Ethereum Sepolia blockchain" with an Etherscan link | It reads well on a phone-width screen |

### 5C. Integration (M1 + M2)

| ID | Task | Details | Done when |
|---|---|---|---|
| 5.13 | End-to-end local run | With MetaMask on Anvil: register participants → create batch → approve → ship to distributor → ship to pharmacy → verify GENUINE → dispense → verify ALREADY SOLD → try a fake serial → NOT FOUND → recall a second batch → RECALLED | The whole flow works in the browser |
| 5.14 | Wrong-account errors | Try approving with the Pharmacy account | A clear "no permission" message, not a crash |

### Evening check 2 (Day 2)

- [ ] The whole flow (5.13) works in the browser with MetaMask on the local chain
- [ ] Branch coverage is 100% (Phase 6)
- [ ] Slither shows no medium or high findings

---

## Phase 6: Security hardening (coverage, Slither, CI)

**Goal:** show evidence that the contract is secure, for the security slide and the report.
**When:** Day 2. **Owner:** M3. **Guide:** M3.2 to M3.5.

| ID | Task | Details | Done when |
|---|---|---|---|
| 6.1 | Measure coverage | `forge coverage --report summary --no-match-coverage "(test\|script)"`. The starting point is about 98% of lines and 67% of branches | Baseline recorded |
| 6.2 | Add the missing branch tests | One test for each case in the M3.2 table: approve twice (`InvalidStatus(Approved)`), unknown batch (`UnknownBatch(99)`), recall by a stranger then by the owner then again, transfer before approval, transfer by a non-holder, transfer to yourself, pharmacy transfers onward (`NotAuthorized`), transfer or dispense after expiry (`vm.warp` → `BatchExpired`), dispense an unknown serial or from a pending batch, register with `REGULATOR_ROLE` (`InvalidRole`) | **100% lines, branches and functions** |
| 6.3 | Run Slither | `cd contracts && slither .` | "4 result(s) found", all low-severity `timestamp` |
| 6.4 | Gas report | `forge test --gas-report`. Record deploy (about 3.1M), registerBatch, approve, transfer and dispense. Verify is free | Numbers ready for the slides |
| 6.5 | Write the security report | `docs/security-report.md`: scope, tools (Foundry, Slither, forge lint), findings table (detector, severity, location, decision), the threat model from guide §9, test evidence (count, coverage, invariant runs) and accepted risks (timestamp, revert-in-loop, no reentrancy surface). Include a privacy note (no patient data, Sri Lanka PDPA No. 9 of 2022) | Merged to `main` |
| 6.6 | Continuous integration | Add `.github/workflows/ci.yml` (Appendix D): format check, build, tests and Slither on every push. Add the CI badge to the README. The guide says this workflow has only been run locally, not on GitHub yet. If the Slither job fails for setup reasons, remove it and run Slither locally instead (6.3) | A green tick on GitHub |
| 6.7 | Format check | `forge fmt --check` passes | Passes in CI |

---

## Phase 7: Sepolia and Vercel deployment

**Goal:** the contract is live and verified on Sepolia, and the web app is live on Vercel and works
on a phone.
**When:** Day 3 (Mon 28 Sep). **Owners:** M1 (morning), then M2 (afternoon). **Guide:** M1.6,
M1.7 and M2.7.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 7.1 | Check the balance | M1 | The NMRA account has at least about 0.05 test ETH (deploy uses about 3.1M gas, plus participant setup and funding the other accounts) | Balance confirmed |
| 7.2 | Encrypted keystore | M1 | `cast wallet import nmra --interactive`. The key is **never** stored in `.env` | `cast wallet list` shows `nmra` |
| 7.3 | Deploy and verify | M1 | Fill in `contracts/.env` (RPC, Etherscan key, REGULATOR_ADDRESS), run `source .env`, then `forge script script/Deploy.s.sol --rpc-url sepolia --account nmra --sender $REGULATOR_ADDRESS --broadcast --verify` | Etherscan shows a green "Source Code Verified" tick |
| 7.4 | Register the demo participants | M1 | CeyPharma Ltd (manufacturer), Island Distributors (distributor) and Pharmacy A, Galle (pharmacy), using `cast send` or `/admin` | All three have roles on Sepolia |
| 7.5 | Fund the demo accounts | M1 | Send about 0.01 test ETH from NMRA to each of the other 3 accounts | Each can pay gas |
| 7.6 | **Handoff H3** | M1 → M2, M3 | Put the contract address and Etherscan link at the top of the README and share them | README updated on `main` |
| 7.7 | Deploy to Vercel | M2 | Import the repo with Root Directory = `frontend`. Env vars: `NEXT_PUBLIC_CHAIN_ID=11155111`, `NEXT_PUBLIC_REGISTRY_ADDRESS=<Sepolia address>` and `NEXT_PUBLIC_RPC_URL=<Alchemy URL>`. After any env change, click **Redeploy** | The live site loads |
| 7.8 | Restrict the RPC key | M2 | `NEXT_PUBLIC_` values are public. If Alchemy allows it, restrict the key to the Vercel domain | Done, or noted as a known limitation |
| 7.9 | Phone test | M2 | Open a live verify link on a phone using **mobile data** (not university Wi-Fi) | It works with no wallet |
| 7.10 | **Handoff H4** | M2 → M3 | Send the live Vercel URL (used in the QR props and the video) | M3 has the URL |
| 7.11 | Create the demo data on Sepolia | M1, M2 | Create the batches used in the demo: one pending batch (to approve on camera), and one batch ready at Pharmacy A containing the genuine pack and the pack to sell | The demo batches are ready |

### Evening check 3 (Day 3)

- [ ] A full dry run on Sepolia, scanning QR codes with a real phone
- [ ] README has the contract address, Etherscan link and live URL

---

## Phase 8: Demo, slides and rehearsal

**Goal:** a 70-second demo video and a 3-minute slide deck, rehearsed.
**When:** Day 3 afternoon to Day 4. **Owner:** M3 (M1 and M2 help record). **Guide:** Section 10.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 8.1 | Demo script | M3 | Write the voice-over lines from the storyboard (guide §10.2) | The script is timed at about 70 seconds |
| 8.2 | Print the QR props | M3 | Box 1: a **genuine** QR that stays unsold. Box 2: a pack to **sell during the demo**, plus a **photocopy** of its QR. Box 3: a **fake** QR (a random serial that was never registered). All QRs use the live Vercel URL | 3 boxes and 1 photocopy, each tested with a phone |
| 8.3 | Record the demo video | M3 (M1, M2 help) | On Sepolia: 0:00 NMRA approves → 0:10 supply chain and trail → 0:20 phone scan shows GENUINE → 0:32 pharmacy sells → 0:42 photocopy shows ALREADY SOLD → 0:55 fake shows NOT FOUND → 1:03 Etherscan | The MP4 is about 70 seconds long |
| 8.4 | Build the slides | M3 | 0:00 Problem (WHO 1 in 10, the 2023 Sri Lanka immunoglobulin scandal) · 0:25 Why blockchain (mention the real precedent: since 2019, the EU Falsified Medicines Directive requires pharmacies to "decommission" each pack's unique code when they sell it, which is the same idea on a shared ledger) · 0:45 How it works (the diagram in guide §1.2) · 1:05 Demo video · 2:15 Security (4 threat rows, "20+ tests incl. a 12,800-call invariant test, Slither: no medium/high", plus the privacy point: no patient data on-chain, in line with Sri Lanka's PDPA No. 9 of 2022) · 2:45 Impact (QR to the live site and GitHub, future work) | Slide draft reviewed by the team |
| 8.5 | Embed the video with a backup | M3 | Embed the MP4 and keep a separate backup MP4. Ask the coordinator whether `.pptx` is accepted, because old `.ppt` may drop embedded video | The video plays from the deck file |
| 8.6 | Q&A preparation | All | Learn the answers in guide §10.4 and the limitations in §3.5 (first-scan race, batch-level custody, 200-pack limit, fees) | Each member can answer any question in under 20 seconds |

---

## Phase 9: Final polish and submission

**Goal:** everything in the definition of done is ticked, and the file is submitted.
**When:** Day 4 (Tue 29 Sep). **Owners:** All.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 9.1 | Bug fixes | M1, M2 | Fix only what the dry run found. **No new features** | `main` is green |
| 9.2 | Final README | M1 | What the project is, the live links (site, Etherscan, CI badge), a screenshot, how to run it locally (Anvil + `local-demo.sh` + `npm run dev`) and how to run the tests | A reader can run it from the README alone |
| 9.3 | Rehearsals | All | Two timed rehearsals | **3:00 or less** both times |
| 9.4 | Name the file | M3 | `GP_XX_Counterfeit_Medicine_Checker.ppt` using our group number | The name matches the brief |
| 9.5 | Submit on ELMS | M3 | Upload the final deck. One submission per group, and the last upload counts | Submission confirmed (take a screenshot) |
| 9.6 | Tag the release | M1 | `git tag v1.0-submission && git push --tags` | The tag is on GitHub |

---

## Phase 10: Buffer and stretch goals

**Wed 30 Sep is a buffer only.** Confirm the real deadline with the module coordinator. Start
stretch goals **only after** the definition of done is fully ticked.

| ID | Stretch goal | Size |
|---|---|---|
| 10.1 | Camera QR scanner on `/pharmacy` (`@yudiel/react-qr-scanner`, read `s` from the scanned URL) | Small |
| 10.2 | Sinhala and Tamil versions of the verify page | Small |
| 10.3 | "Report suspicious pack" button (gasless, via a small server that pays the fee) | Medium |
| 10.4 | Split batches into shipments so one batch can go to several pharmacies | Medium |
| 10.5 | Merkle-root batches: register 100,000 packs with one hash | Large |
| 10.6 | Multi-signature NMRA wallet (Safe) and deployment on a low-fee layer-2 network | Large |

---

## Handoffs summary

| # | When | From → to | What |
|---|---|---|---|
| H1 | Day 1 midday | M1 → M2, M3 | Contract and `frontend/lib/registryAbi.ts` on `main` |
| H2 | Day 1 evening | M1 → M2 | `local-demo.sh` working, with the three test verify links |
| H3 | Day 3 morning | M1 → M2, M3 | Sepolia contract address and Etherscan link in the README |
| H4 | Day 3 afternoon | M2 → M3 | Live Vercel URL for the QR props and the demo video |

## Definition of done

- [ ] `forge test` passes and `forge fmt --check` passes
- [ ] Coverage is 100% of lines, branches and functions
- [ ] Slither shows no medium or high findings, and the accepted low findings are documented in `docs/security-report.md`
- [ ] Contract deployed and verified on Sepolia, with the Etherscan link in the README
- [ ] Web app live on Vercel, and the verify page works on a phone with no wallet
- [ ] Full demo flow completed on Sepolia at least twice
- [ ] Demo video (about 70 seconds) recorded, slides done, rehearsed to 3:00 or less
- [ ] `GP_XX_Counterfeit_Medicine_Checker.ppt` submitted on ELMS
- [ ] README explains what the project is and how to run it

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Faucets are slow or limited | All three request test ETH daily from Day 1. Teammates can send ETH to NMRA |
| Foundry fails to install on Windows | Use the zip method (guide §4.1). Use a short repo path and `core.longpaths` |
| The ABI drifts after a contract change | Re-run the export (task 2.4) after **every** contract edit |
| MetaMask shows "nonce too high" after restarting Anvil | Settings → Advanced → Clear activity tab data |
| University Wi-Fi blocks the RPC during the demo | Use mobile data, and keep the recorded video as the main demo |
| `.ppt` drops the embedded video | Ask about `.pptx` and keep a backup MP4 |
| A member is unavailable | Each track is fully documented in the guide, so another member can pick it up |

For more fixes, see the troubleshooting table in guide §11.
