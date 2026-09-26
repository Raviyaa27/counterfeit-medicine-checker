import { BaseError, ContractFunctionRevertedError } from "viem";

const MESSAGES: Record<string, string> = {
  AlreadyDispensed: "Clone alert: this pack was already sold. The code may have been copied.",
  NotHolder: "Your organisation doesn't hold this batch.",
  UnknownSerial: "This code isn't registered. The pack may be counterfeit.",
  InvalidStatus: "This batch is not approved, or has been recalled.",
  BatchExpired: "This batch has expired.",
  InvalidRecipient: "That address isn't a registered distributor or pharmacy.",
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
  return String(err);
}
