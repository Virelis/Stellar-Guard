/**
 * Institutional AML, FATF Travel Rule, and Compliance Telemetry Models
 */

import { StellarAddress } from "./index";

export type AmlRiskCategory =
  | "SANCTIONED_ENTITY"
  | "DARKNET_MARKET"
  | "RANSOMWARE_AFFILIATE"
  | "HIGH_VELOCITY_STRUCTURING"
  | "MIXER_INTERACTION"
  | "PEPS_CLOSE_ASSOCIATE";

export interface FatfOriginator {
  name: string;
  accountNumber: StellarAddress;
  physicalAddress?: string;
  nationalIdentityNumber?: string;
  customerIdentification?: string;
  dateAndPlaceOfBirth?: string;
}

export interface FatfBeneficiary {
  name: string;
  accountNumber: StellarAddress;
}

export interface FatfTravelRuleRecord {
  transactionId: string;
  assetCode: string;
  amount: string;
  originator: FatfOriginator;
  beneficiary: FatfBeneficiary;
  originatorVasp: string;
  beneficiaryVasp: string;
  complianceStatus: "VERIFIED" | "FLAGGED_INCOMPLETE" | "REJECTED";
  timestamp: number;
}
