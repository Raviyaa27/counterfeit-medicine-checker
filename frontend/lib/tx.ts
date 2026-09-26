import { BaseError, ContractFunctionRevertedError } from "viem";
import type { ContractFunctionArgs, ContractFunctionName } from "viem";
import { getConnection, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { chain, config, registryAddress } from "./config";
import { registryAbi } from "./registryAbi";

const MESSAGES: Record<string, string> = {
  AlreadyDispensed: "Clone alert: this pack was already sold. The code may have been copied.",
  NotHolder: "Your organisation doesn't hold this batch.",
  UnknownSerial: "This code isn't registered. The pack may be counterfeit.",
  InvalidStatus: "This batch is not approved, or has been recalled.",
  BatchExpired: "This batch has expired.",
  InvalidRecipient: "That address isn't a registered distributor or pharmacy.",
  InvalidExpiry: "The expiry date must be in the future.",
  InvalidUnitCount: "A batch must have between 1 and 200 packs.",
  NotAuthorized: "Your organisation is not allowed to do this.",
  DuplicateSerial: "One of these serials is already registered.",
  AccessControlUnauthorizedAccount: "Your wallet doesn't have permission for this action.",
};

// Turns a contract revert (e.g. AlreadyDispensed) into a sentence a user understands.
export function friendlyError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      return MESSAGES[name] ?? `Transaction rejected: ${name}`;
    }
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : String(err);
}

type WriteName = ContractFunctionName<typeof registryAbi, "nonpayable">;

// simulate -> write -> wait: fails fast with a readable reason before MetaMask opens.
export async function sendTx<F extends WriteName>(
  functionName: F,
  args: ContractFunctionArgs<typeof registryAbi, "nonpayable", F>,
) {
  if (getConnection(config).status !== "connected") {
    throw new Error("Connect MetaMask first.");
  }
  const { request } = await simulateContract(config, {
    address: registryAddress,
    abi: registryAbi,
    functionName,
    args,
    chainId: chain.id,
  } as never);
  const hash = await writeContract(config, request);
  return waitForTransactionReceipt(config, { hash, chainId: chain.id });
}
