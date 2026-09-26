import { keccak256, toHex } from "viem";

// Must match the role constants in MedicineRegistry.sol
export const ROLES = {
  MANUFACTURER: keccak256(toHex("MANUFACTURER_ROLE")),
  DISTRIBUTOR: keccak256(toHex("DISTRIBUTOR_ROLE")),
  PHARMACY: keccak256(toHex("PHARMACY_ROLE")),
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.MANUFACTURER]: "Manufacturer",
  [ROLES.DISTRIBUTOR]: "Distributor",
  [ROLES.PHARMACY]: "Pharmacy",
};

// Order matches enum BatchStatus in MedicineRegistry.sol
export const BATCH_STATUS = ["None", "Pending", "Approved", "Recalled"] as const;
