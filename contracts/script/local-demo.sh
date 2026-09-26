#!/usr/bin/env bash
# Deploys to a fresh local Anvil chain and creates demo data.
# Run `anvil` in another terminal first. Anvil keys are public test keys: local use only.
set -e
RPC=http://127.0.0.1:8545
NMRA_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
MAKER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
DIST_KEY=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
PHARM_KEY=0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

addr() { cast wallet address "$1"; }
send() { cast send "$REG" "$@" --rpc-url $RPC > /dev/null; }

REGULATOR_ADDRESS=$(addr $NMRA_KEY) forge script script/Deploy.s.sol \
  --rpc-url $RPC --private-key $NMRA_KEY --broadcast > /dev/null
REG=0x5FbDB2315678afecb367f032d93F642f64180aa3 # first deployment on a fresh Anvil
echo "Registry: $REG"

send "registerParticipant(address,bytes32,string)" $(addr $MAKER_KEY) \
  $(cast keccak MANUFACTURER_ROLE) "CeyPharma Ltd" --private-key $NMRA_KEY
send "registerParticipant(address,bytes32,string)" $(addr $DIST_KEY) \
  $(cast keccak DISTRIBUTOR_ROLE) "Island Distributors" --private-key $NMRA_KEY
send "registerParticipant(address,bytes32,string)" $(addr $PHARM_KEY) \
  $(cast keccak PHARMACY_ROLE) "Pharmacy A, Galle" --private-key $NMRA_KEY

S1=0x8f3a1c2b4d5e6f708192a3b4c5d6e7f8 # stays unsold
S2=0x11112222333344445555666677778888 # gets sold
EXPIRY=$(( $(date +%s) + 365 * 24 * 3600 ))
send "registerBatch(string,string,uint64,bytes32[])" "Paracetamol 500mg" "PARA-2026-001" \
  $EXPIRY "[$(cast keccak $S1),$(cast keccak $S2)]" --private-key $MAKER_KEY
send "approveBatch(uint256)" 1 --private-key $NMRA_KEY
send "transferBatch(uint256,address)" 1 $(addr $DIST_KEY) --private-key $MAKER_KEY
send "transferBatch(uint256,address)" 1 $(addr $PHARM_KEY) --private-key $DIST_KEY
send "dispense(bytes16)" $S2 --private-key $PHARM_KEY

echo "Genuine: http://localhost:3000/verify?s=$S1"
echo "Sold:    http://localhost:3000/verify?s=$S2"
echo "Fake:    http://localhost:3000/verify?s=0xdeadbeefdeadbeefdeadbeefdeadbeef"
