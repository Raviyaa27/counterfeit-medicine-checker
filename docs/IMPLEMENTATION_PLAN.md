# Counterfeit Medicine Checker: Implementation Plan

EC8204 Blockchain and Cyber Security group project, University of Ruhuna.

This plan breaks the [implementation guide](Counterfeit_Medicine_Checker_Implementation_Guide.pdf)
into phases and tasks you can tick off. The guide has the full commands and tested code
(Appendices A to D). This file tracks **what** to do, **who** does it, and **how we know it is
done**.

---

## Overview

| Item | Detail |
|---|---|
| **Assignment** | Pick a problem that blockchain can help solve, build the solution on any blockchain platform, and present it in 3 minutes (see the [project brief](EC8204_Aug26_Project%20Description.pdf)) |
| **Our solution** | Patients scan the QR code on a medicine pack. The page then shows one of: GENUINE, ALREADY SOLD, NOT FOUND, RECALLED, EXPIRED or NOT APPROVED |
| **Blockchain** | Ethereum Sepolia testnet (live) and Anvil (local development) |
| **Contract** | `MedicineRegistry.sol`: Solidity 0.8.30, OpenZeppelin 5.6.1 AccessControl, Foundry |
| **Web app** | Next.js 16, wagmi 3, viem 2 and qrcode.react, hosted on Vercel |
| **Deliverable** | `GP_XX_Counterfeit_Medicine_Checker.ppt` (3-minute presentation with a demo video) on ELMS, plus a video link in the module's Google Sheet |
| **Deadline** | The brief says 31/09/2026, which doesn't exist. Confirm the real date with the module coordinator |

## How the work is split

The members work **one after the other**. Each member owns **three phases in a row** and hands
over a working, tested result to the next member. The blocks are sized so that each member does
about the same amount of work (about 14 hours each).

| Member | Name | Block | Phases | What they hand over | Est. effort |
|---|---|---|---|---|---|
| **M1** | _______ | Smart contract and security | 1, 2, 3 | Contract, ABI, local demo script, full test suite (100% coverage), security report, CI | ~14 h |
| **M2** | _______ | Web app | 4, 5, 6 | All pages working on the local chain: verify, manufacturer, pharmacy, admin, supply and landing | ~14 h |
| **M3** | _______ | Deployment and presentation | 7, 8, 9 | Live contract on Sepolia, live site on Vercel, demo video, slides, submission | ~14 h |

Phase 0 (tools and accounts) is done by **everyone at the start**. The presentation itself and
the Q&A are shared by all three.

```
Phase 0 (All) ─▶ M1: P1 ─ P2 ─ P3 ─▶ H1 ─▶ M2: P4 ─ P5 ─ P6 ─▶ H2 ─▶ M3: P7 ─ P8 ─ P9 ─▶ SUBMIT
```

| Phase | Name | Owner | Status |
|---|---|---|---|
| 0 | Tools, accounts and test ETH | All | In progress: each member sets up their own laptop (see the README) |
| 1 | Repository setup | M1 | Done |
| 2 | Smart contract and local chain | M1 | Done |
| 3 | Testing and security | M1 | Done (32 tests, 100% coverage, CI green) |
| 4 | Web app foundation and verify page | M2 | Done, on branch `m2-frontend` |
| 5 | Manufacturer and pharmacy pages | M2 | Done, on branch `m2-frontend` |
| 6 | NMRA, supply and landing pages, full local flow | M2 | Done, on branch `m2-frontend` (Pull Request to `main` still to open) |
| 7 | Sepolia and Vercel deployment | M3 | Not started |
| 8 | Demo props, video and slides | M3 | Not started |
| 9 | Rehearsal and submission | M3 (all present) | Not started |
| 10 | Stretch goals (optional) | Anyone | Not started |

Phases 4 to 6 were checked in a headless browser with a fake wallet signing as the Anvil
accounts. A click-through with real MetaMask is still worth doing once, so treat task 4.3 (MetaMask
on Anvil) as done only when each member has tried it on their own laptop.

---

## Team working rules (apply to every phase)

- **`main` must always work.** Work on your own branch (`m1-contracts`, `m2-frontend` or
  `m3-deploy`) and merge into `main` through a Pull Request.
- The **next** member reviews your final Pull Request before your handoff. This is also how they
  learn your part before they build on it.
- Make small commits with clear messages, for example "Add dispense form to pharmacy page".
- **Never commit** `.env` files, private keys, recovery phrases or serial CSVs.
- Run every command in **Git Bash**, not PowerShell.
- The previous member stays available to answer questions after handing over.

---

## Phase 0: Tools, accounts and test ETH

**Owner:** All, at the start. **Guide:** Sections 1 to 4.

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 0.1 | Read the guide together | All | Read Sections 1 to 4 of the guide (about 30 minutes): the problem, the system flow, roles, verdicts and the design decisions | Everyone can explain why only serial **hashes** go on-chain, and why a pack can be sold only once |
| 0.2 | Register the project | Any | Before adding our row to the module's Google Sheet, check that no other group has already picked counterfeit medicine or pharmaceutical tracking (the brief says no two projects may be identical, and projects in the same domain must be different applications). Then add our row and write down our group number (`GP_XX`) | Our row is on the sheet, it doesn't duplicate another group's project, and we have a group number |
| 0.3 | Install the core tools | All | Git for Windows, Node.js 22 LTS, VS Code with the Solidity extension (Nomic Foundation), MetaMask. Then run `git config --global core.longpaths true` | `git --version` and `node --version` both work |
| 0.4 | Install Foundry | All | `curl -L https://foundry.paradigm.xyz \| bash`, then `foundryup`. If that fails, download the Windows zip (guide §4.1) into `C:\foundry` and add it to PATH. **If Windows says "An Application Control policy has blocked this file"**, Smart App Control is on and blocks Foundry's unsigned Windows binaries (the zip too). Install Foundry inside WSL Ubuntu instead: `wsl -d Ubuntu`, then `curl -L https://foundry.paradigm.xyz \| bash` and `~/.foundry/bin/foundryup`. Run `forge`, `cast` and `anvil` from WSL in `/mnt/d/Projects/counterfeit-medicine-checker`. Anvil in WSL is reachable from Windows at `http://127.0.0.1:8545`, so MetaMask and `npm run dev` stay on Windows | `forge --version` works (in Git Bash or WSL) |
| 0.5 | Install Slither | M1 | `python -m pip install slither-analyzer` | `slither --version` works |
| 0.6 | Create the demo wallet | M3 | Create a **new** MetaMask wallet used only for this project. Add 4 accounts named NMRA, CeyPharma, Distributor and Pharmacy A. Turn on test networks and select Sepolia | Four named accounts exist, with no real funds |
| 0.7 | Request Sepolia test ETH | All | Use a Sepolia faucet such as Google Cloud Web3 and send the ETH to M3's **NMRA** address. Faucets limit each person per day, so start now and repeat daily until Phase 7 | We have at least 0.1 test ETH in total before Phase 7 |
| 0.8 | Agree the wallet safety rules | All | Read guide §4.2: no real money, no keys in chat, commits or screenshots, and keystore only for Sepolia. Anvil's built-in keys are public, so use them only on the local chain | Everyone agrees |

---

# M1 block: smart contract and security

## Phase 1: Repository setup

**Goal:** a single repo holding the Foundry project and the Next.js app, which builds cleanly.
**Owner:** M1. **Guide:** Section 5.

| ID | Task | Details | Done when |
|---|---|---|---|
| 1.1 | Create the Foundry project | `forge init contracts --use-parent-git`. Delete the Counter example files and `contracts/.github` | `contracts/` exists with no nested `.git` |
| 1.2 | Install OpenZeppelin from npm | In `contracts/`, run `npm init -y` and `npm install --save-exact @openzeppelin/contracts@5.6.1`, then add `node_modules/` to `.gitignore` | `node_modules/@openzeppelin` exists and is ignored by Git |
| 1.3 | Create the Next.js app | `npx create-next-app@latest frontend --ts --tailwind --eslint --app --use-npm --disable-git --yes`, then `npm install wagmi viem @tanstack/react-query qrcode.react` | `npm run dev` serves the default page |
| 1.4 | Add the config files | From Appendix A: `foundry.toml`, `slither.config.json`, `contracts/.env.example`. From Appendix C: `frontend/.env.example` | The files are in place |
| 1.5 | Check `.gitignore` | It must cover `.env`, `.env.local`, `node_modules/`, `out/`, `cache/`, `broadcast/` and `*.csv` | `git status` shows no secrets or build output |
| 1.6 | First push | `forge build` succeeds. Commit "Set up Foundry and Next.js projects" and push to `main` | The commit is on GitHub |

## Phase 2: Smart contract and local chain

**Goal:** the contract is in place and understood, the ABI is exported, and a single script sets
up a local demo.
**Owner:** M1. **Guide:** Section 6 (M1.1 to M1.3), Appendix A and Appendix D.

| ID | Task | Details | Done when |
|---|---|---|---|
| 2.1 | Add the contract | Copy `contracts/src/MedicineRegistry.sol` from Appendix A | `forge build` says "Compiler run successful" |
| 2.2 | Study the contract | Read it from top to bottom: the 4 roles, `BatchStatus`, `Verdict`, the checks in `registerBatch`, `transferBatch` and `dispense`, the verdict priority (Recalled > NotApproved > Dispensed > Expired > Genuine) and `MAX_UNITS_PER_BATCH = 200` | M1 can explain each function in the table in guide §3.4 |
| 2.3 | Add the deploy script | `contracts/script/Deploy.s.sol` from Appendix A | It runs against Anvil without errors |
| 2.4 | Export the ABI | `echo "export const registryAbi = $(forge inspect MedicineRegistry abi --json) as const;" > ../frontend/lib/registryAbi.ts`. **Repeat after every contract change** | `frontend/lib/registryAbi.ts` exists |
| 2.5 | Local demo script | Add `contracts/script/local-demo.sh` (Appendix D). Start `anvil` in one terminal and run `bash script/local-demo.sh` in another. The script assumes a **fresh** Anvil, because it hard-codes the first deployment address `0x5FbDB…0aa3` and re-registering the same serials fails. So restart Anvil before each run | It prints the registry address plus Genuine, Sold and Fake verify links |

## Phase 3: Testing and security

**Goal:** prove the contract is secure, with evidence for the security slide.
**Owner:** M1. **Guide:** Section 8 (M3.1 to M3.5), Section 9 and Appendix B.

| ID | Task | Details | Done when |
|---|---|---|---|
| 3.1 | Add the test files | Copy `MedicineRegistry.t.sol` and `MedicineRegistry.invariant.t.sol` from Appendix B into `contracts/test/` | They compile |
| 3.2 | Run the suite | `forge test` | **20 passed, 0 failed** |
| 3.3 | Understand the 4 kinds of test | Unit (normal behaviour), Attack (9 blocked attacks), Fuzz (1,000 random inputs each) and Invariant (12,800 random calls) | M1 can explain each kind in one sentence |
| 3.4 | Capture the attack tests | `forge test --match-test Attack -vv` and take a screenshot for the slides | The screenshot is saved in `docs/` |
| 3.5 | Measure coverage | `forge coverage --report summary --no-match-coverage "(test\|script)"`. The starting point is about 98% of lines and 67% of branches | Baseline recorded |
| 3.6 | Add the missing branch tests | One test for each case in the guide's M3.2 table: approve twice (`InvalidStatus(Approved)`), unknown batch (`UnknownBatch(99)`), recall by a stranger then by the owner then again, transfer before approval, transfer by a non-holder, transfer to yourself, pharmacy transfers onward (`NotAuthorized`), transfer or dispense after expiry (`vm.warp` → `BatchExpired`), dispense an unknown serial or from a pending batch, register with `REGULATOR_ROLE` (`InvalidRole`) | **100% lines, branches and functions** |
| 3.7 | Run Slither | `cd contracts && slither .` | "4 result(s) found", all low-severity `timestamp` |
| 3.8 | Gas report | `forge test --gas-report`. Record deploy (about 3.1M), registerBatch, approve, transfer and dispense. Verify is free | Numbers saved for the slides |
| 3.9 | Write the security report | `docs/security-report.md`: scope, tools (Foundry, Slither, forge lint), findings table (detector, severity, location, decision), the threat model from guide §9 (each threat, the contract defence and the test that proves it), test evidence (count, coverage, invariant runs) and accepted risks (timestamp, revert-in-loop, no reentrancy surface). Include a privacy note (no patient data, Sri Lanka PDPA No. 9 of 2022) | Merged to `main` |
| 3.10 | Continuous integration | Add `.github/workflows/ci.yml` (Appendix D): format check, build, tests and Slither on every push. Add the CI badge to the README. The guide says this workflow has only been run locally, not on GitHub yet. If the Slither job fails for setup reasons, remove it and run Slither locally instead | A green tick on GitHub |
| 3.11 | Format check | `forge fmt --check` passes | Passes in CI |

### Handoff H1: M1 → M2

- [x] Contract, deploy script, `local-demo.sh` and `frontend/lib/registryAbi.ts` are on `main`
- [x] `forge test` passes with 100% coverage, and CI is green
- [x] `docs/security-report.md` is merged
- [ ] M1 walks M2 through running Anvil and `local-demo.sh`, and shares the three verify links

---

# M2 block: web app

## Phase 4: Web app foundation and verify page

**Goal:** the patient-facing verify page works on the local chain **without a wallet**.
**Owner:** M2. **Guide:** Section 7 (M2.1 to M2.3) and Appendix C.

| ID | Task | Details | Done when |
|---|---|---|---|
| 4.1 | Connect the app to the chain | Add `lib/config.ts`, `lib/tx.ts`, `app/providers.tsx` and the updated `app/layout.tsx` from Appendix C. Run `cp .env.example .env.local` | `npm run dev` starts with no errors |
| 4.2 | Connect button | Add `components/ConnectButton.tsx` (Appendix C). Put it on every page that writes to the contract (`/admin`, `/supply`, `/manufacturer`, `/pharmacy`), but **not** on `/verify` | It connects and disconnects MetaMask and shows the short address |
| 4.3 | Set up MetaMask for Anvil | Add the network: RPC `http://127.0.0.1:8545`, chain ID `31337`. Import 4 Anvil test keys as NMRA, Manufacturer, Distributor and Pharmacy. After restarting Anvil, use Settings → Advanced → **Clear activity tab data** | MetaMask connects to the local app |
| 4.4 | Build the verify page | Add `app/verify/page.tsx`, `components/VerifyResult.tsx` and `components/OrgName.tsx`. The page reads `?s=<serial>`, hashes it and calls `verify()` as a free read | It works with no wallet connected |
| 4.5 | Test with the H1 links | Open the Genuine, Sold and Fake links from `local-demo.sh` | Green **GENUINE**, amber **ALREADY SOLD** (with "Sold by Pharmacy A, Galle on …") and red **NOT FOUND** |
| 4.6 | Polish the verify page | A big coloured result card and large text for phones, the custody trail from `getTrail(batchId)` with `<OrgName>` and dates, and "Checked on the Ethereum Sepolia blockchain" with an Etherscan link | It reads well at phone width |

## Phase 5: Manufacturer and pharmacy pages

**Goal:** a manufacturer can create a batch and print its QR codes, and a pharmacy can sell a pack.
**Owner:** M2. **Guide:** M2.4 and M2.5.

| ID | Task | Details | Done when |
|---|---|---|---|
| 5.1 | `/manufacturer`: new batch | Start from `NewBatchForm.tsx`. Inputs: drug name, batch number, expiry date and pack count (1–200). Generate random 128-bit serials in the browser and send **only their hashes** | The transaction succeeds and the new batch ID is shown |
| 5.2 | `/manufacturer`: QR sheet | One QR per pack pointing to `https://<site>/verify?s=<serial>`. Add `@media print` CSS that hides everything except the QR grid | The print preview shows a clean QR grid |
| 5.3 | `/manufacturer`: CSV download | A "Download serials (CSV)" button. Show a warning that serials are secrets | The CSV downloads. **Never commit it** |
| 5.4 | `/pharmacy`: dispense | Start from `DispenseForm.tsx` and the example `app/pharmacy/page.tsx`. Enter a serial and mark it sold. Use `friendlyError` in `lib/tx.ts` to turn errors into plain messages ("Clone alert: this pack was already sold") | The second sale of the same pack shows a friendly error |

## Phase 6: NMRA, supply and landing pages, full local flow

**Goal:** every actor (NMRA, manufacturer, distributor, pharmacy) can do their job in the browser,
and the whole flow works on the local chain.
**Owner:** M2. **Guide:** M1.4, M1.5 and M2.6.

| ID | Task | Details | Done when |
|---|---|---|---|
| 6.1 | Role constants | `frontend/lib/roles.ts`: `keccak256(toHex("MANUFACTURER_ROLE"))` and the same for the other roles, matching the contract | They are imported by `/admin` |
| 6.2 | `/admin`: register participant | Form with address, role dropdown and organisation name, calling `registerParticipant`. Use the **simulate → write → wait** pattern from `DispenseForm.tsx` | A new manufacturer shows up by name on `/verify` |
| 6.3 | `/admin`: approve batch | Read `batchCount`, loop over `getBatch(id)`, and list pending batches with an **Approve** button (`approveBatch`) | A pending batch changes to Approved |
| 6.4 | `/admin`: recall batch | Batch ID plus a reason, calling `recallBatch` | The verify page shows **RECALLED** |
| 6.5 | `/supply`: transfer batch | Batch ID plus a "ship to" dropdown of registered participants, calling `transferBatch(id, to)`. Used by the manufacturer and the distributor | Manufacturer → distributor → pharmacy works |
| 6.6 | `/supply`: custody trail | Show `getTrail(id)` with `<OrgName>` and dates | Each handover is listed |
| 6.7 | `/` landing page | Project name, a one-sentence pitch, a "How to check a medicine" box and links to the pages. This is the first thing examiners see | It looks clean at phone width |
| 6.8 | End-to-end local run | With MetaMask on Anvil: register participants → create batch → approve → ship to distributor → ship to pharmacy → verify GENUINE → dispense → verify ALREADY SOLD → try a fake serial → NOT FOUND → recall a second batch → RECALLED | The whole flow works in the browser |
| 6.9 | Wrong-account errors | Try approving with the Pharmacy account | A clear "no permission" message, not a crash |
| 6.10 | Build check | `npm run build` in `frontend/` | Builds with no errors |

### Handoff H2: M2 → M3

- [ ] All pages are on `main` (they are on `m2-frontend`, waiting for the Pull Request to merge) and `npm run build` passes (done)
- [x] The full local flow (6.8) works
- [ ] M2 walks M3 through the flow in the browser, so M3 can repeat it on Sepolia and in the video

---

# M3 block: deployment and presentation

## Phase 7: Sepolia and Vercel deployment

**Goal:** the contract is live and verified on Sepolia, and the web app is live on Vercel and works
on a phone.
**Owner:** M3. **Guide:** M1.6, M1.7 and M2.7.

| ID | Task | Details | Done when |
|---|---|---|---|
| 7.1 | Create the service accounts | An Alchemy app on Ethereum Sepolia (RPC URL), an Etherscan API key and a Vercel account (sign in with GitHub) | The keys are stored privately, **not** in the repo |
| 7.2 | Check the balance | The NMRA account has at least about 0.05 test ETH (deploy uses about 3.1M gas, plus participant setup and funding the other accounts). Teammates send more if needed | Balance confirmed |
| 7.3 | Encrypted keystore | `cast wallet import nmra --interactive`. The key is **never** stored in `.env` | `cast wallet list` shows `nmra` |
| 7.4 | Deploy and verify | Fill in `contracts/.env` (RPC, Etherscan key, REGULATOR_ADDRESS), run `source .env`, then `forge script script/Deploy.s.sol --rpc-url sepolia --account nmra --sender $REGULATOR_ADDRESS --broadcast --verify` | Etherscan shows a green "Source Code Verified" tick |
| 7.5 | Register the demo participants | CeyPharma Ltd (manufacturer), Island Distributors (distributor) and Pharmacy A, Galle (pharmacy), using `cast send` or `/admin` | All three have roles on Sepolia |
| 7.6 | Fund the demo accounts | Send about 0.01 test ETH from NMRA to each of the other 3 accounts | Each can pay gas |
| 7.7 | Deploy to Vercel | Import the repo with Root Directory = `frontend`. Env vars: `NEXT_PUBLIC_CHAIN_ID=11155111`, `NEXT_PUBLIC_REGISTRY_ADDRESS=<Sepolia address>` and `NEXT_PUBLIC_RPC_URL=<Alchemy URL>`. After any env change, click **Redeploy** | The live site loads |
| 7.8 | Restrict the RPC key | `NEXT_PUBLIC_` values are public. If Alchemy allows it, restrict the key to the Vercel domain | Done, or noted as a known limitation |
| 7.9 | Phone test | Open a live verify link on a phone using **mobile data** (not university Wi-Fi) | It works with no wallet |
| 7.10 | Create the demo data | On Sepolia, using the live site: one pending batch (to approve on camera), and one batch at Pharmacy A containing the genuine pack and the pack to sell | The demo batches are ready |
| 7.11 | Full dry run | Run the whole flow on Sepolia, scanning QR codes with a real phone. Do it **twice** | Both runs work |
| 7.12 | Update the README | Contract address, Etherscan link, live URL, CI badge, a screenshot, how to run it locally (Anvil + `local-demo.sh` + `npm run dev`) and how to run the tests | A reader can run it from the README alone |

## Phase 8: Demo props, video and slides

**Goal:** a 70-second demo video and a 3-minute slide deck.
**Owner:** M3 (M1 and M2 help act in the video). **Guide:** Section 10.

| ID | Task | Details | Done when |
|---|---|---|---|
| 8.1 | Demo script | Write the voice-over lines from the storyboard (guide §10.2) | The script is timed at about 70 seconds |
| 8.2 | Print the QR props | Box 1: a **genuine** QR that stays unsold. Box 2: a pack to **sell during the demo**, plus a **photocopy** of its QR. Box 3: a **fake** QR (a random serial that was never registered). All QRs use the live Vercel URL | 3 boxes and 1 photocopy, each tested with a phone |
| 8.3 | Record the demo video | On Sepolia: 0:00 NMRA approves → 0:10 supply chain and trail → 0:20 phone scan shows GENUINE → 0:32 pharmacy sells → 0:42 photocopy shows ALREADY SOLD → 0:55 fake shows NOT FOUND → 1:03 Etherscan | The MP4 is about 70 seconds long |
| 8.4 | Build the slides | 0:00 Problem (WHO 1 in 10, the 2023 Sri Lanka immunoglobulin scandal) · 0:25 Why blockchain (mention the real precedent: since 2019, the EU Falsified Medicines Directive requires pharmacies to "decommission" each pack's unique code when they sell it, which is the same idea on a shared ledger) · 0:45 How it works (the diagram in guide §1.2) · 1:05 Demo video · 2:15 Security (4 threat rows from M1's report, "20+ tests incl. a 12,800-call invariant test, Slither: no medium/high", plus the privacy point: no patient data on-chain, in line with Sri Lanka's PDPA No. 9 of 2022) · 2:45 Impact (QR to the live site and GitHub, future work: layer-2 network, NMRA integration) | Slide draft reviewed by M1 and M2 |
| 8.5 | Embed the video with a backup | Embed the MP4 and keep a separate backup MP4. Ask the coordinator whether `.pptx` is accepted, because old `.ppt` may drop embedded video | The video plays from the deck file |
| 8.6 | Q&A sheet | Write a one-page answer sheet from guide §10.4 and the limitations in §3.5 (first-scan race, batch-level custody, 200-pack limit, fees). Share it with M1 and M2 | Everyone has the sheet |

## Phase 9: Rehearsal and submission

**Goal:** the presentation is rehearsed, recorded and submitted.
**Owner:** M3 (all three present).

| ID | Task | Owner | Details | Done when |
|---|---|---|---|---|
| 9.1 | Rehearsals | All | Two timed rehearsals. Each member presents the part they built | **3:00 or less** both times |
| 9.2 | Q&A practice | All | Quiz each other from the Q&A sheet | Each member can answer any question in under 20 seconds |
| 9.3 | Record the 3-minute presentation | M3 | Record the full presentation (slides with the demo video inside). Upload it to Google Drive or unlisted YouTube, with access set so anyone with the link can view | The link opens in a private browser window |
| 9.4 | Fill in the Google Sheet | M3 | Paste the video link into the "3 min Presentation video link" column of our row | The sheet row is complete |
| 9.5 | Name the file | M3 | `GP_XX_Counterfeit_Medicine_Checker.ppt` using our group number | The name matches the brief |
| 9.6 | Submit on ELMS | M3 | Upload the final deck. One submission per group, and the last upload counts | Submission confirmed (take a screenshot) |
| 9.7 | Tag the release | M3 | `git tag v1.0-submission && git push --tags` | The tag is on GitHub |

---

## Phase 10: Stretch goals (optional)

Start these **only after** the definition of done is fully ticked.

| ID | Stretch goal | Size |
|---|---|---|
| 10.1 | Camera QR scanner on `/pharmacy` (`@yudiel/react-qr-scanner`, read `s` from the scanned URL) | Small |
| 10.2 | Sinhala and Tamil versions of the verify page | Small |
| 10.3 | "Report suspicious pack" button (gasless, via a small server that pays the fee) | Medium |
| 10.4 | Split batches into shipments so one batch can go to several pharmacies | Medium |
| 10.5 | Merkle-root batches: register 100,000 packs with one hash | Large |
| 10.6 | Multi-signature NMRA wallet (Safe) and deployment on a low-fee layer-2 network | Large |

---

## Definition of done

- [x] `forge test` passes and `forge fmt --check` passes
- [x] Coverage is 100% of lines, branches and functions
- [x] Slither shows no medium or high findings, and the accepted low findings are documented in `docs/security-report.md`
- [ ] Contract deployed and verified on Sepolia, with the Etherscan link in the README
- [ ] Web app live on Vercel, and the verify page works on a phone with no wallet
- [ ] Full demo flow completed on Sepolia at least twice
- [ ] Demo video (about 70 seconds) recorded, slides done, rehearsed to 3:00 or less
- [ ] 3-minute presentation video link added to the Google Sheet
- [ ] `GP_XX_Counterfeit_Medicine_Checker.ppt` submitted on ELMS
- [x] README explains what the project is and how to run it (the Sepolia address and live URL are added after Phase 7)

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Faucets are slow or limited | All three request test ETH daily from Phase 0, long before M3 needs it in Phase 7 |
| A later member doesn't understand the earlier work | The next member reviews the final Pull Request, and each handoff includes a walkthrough |
| Foundry fails to install on Windows | Use the zip method (guide §4.1). Use a short repo path and `core.longpaths` |
| The ABI drifts after a contract change | Re-run the export (task 2.4) after **every** contract edit |
| MetaMask shows "nonce too high" after restarting Anvil | Settings → Advanced → Clear activity tab data |
| University Wi-Fi blocks the RPC during the demo | Use mobile data, and keep the recorded video as the main demo |
| `.ppt` drops the embedded video | Ask about `.pptx` and keep a backup MP4 |

For more fixes, see the troubleshooting table in guide §11.
