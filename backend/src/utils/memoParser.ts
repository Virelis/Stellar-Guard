export interface ParsedMemo {
  rawType: string;
  rawValue: string;
  category:
    | "travel_rule"
    | "incident_ticket"
    | "invoice"
    | "hash_digest"
    | "numeric_id"
    | "generic_text"
    | "empty";
  referenceId?: string;
  isCompliantFormat: boolean;
  sanitized: string;
}

const TRAVEL_RULE_REGEX = /^(?:TR-|IVMS:?)([A-Za-z0-9_-]{4,28})$/i;
const INCIDENT_TICKET_REGEX = /^(?:INC|CASE|SEC|ALERT)-([A-Za-z0-9_-]{3,24})$/i;
const INVOICE_REGEX = /^(?:INV|PAY)-([A-Za-z0-9_-]{3,24})$/i;
const NUMERIC_ID_REGEX = /^\d{1,20}$/;
const HEX_32BYTE_REGEX = /^[0-9a-fA-F]{64}$/;

/**
 * Parses, categorizes, and validates Stellar transaction memos according to
 * institutional compliance and governance incident tracking standards.
 */
export function parseTransactionMemo(memoType: string | undefined, memoValue: any): ParsedMemo {
  if (!memoType || memoValue === undefined || memoValue === null || memoValue === "") {
    return {
      rawType: memoType || "none",
      rawValue: "",
      category: "empty",
      isCompliantFormat: true,
      sanitized: "",
    };
  }

  let strVal: string;
  if (Buffer.isBuffer(memoValue)) {
    strVal = memoValue.toString("hex");
  } else {
    strVal = String(memoValue).trim();
  }

  // Check 32-byte hash
  if (memoType === "hash" || memoType === "return" || HEX_32BYTE_REGEX.test(strVal)) {
    const isHex = HEX_32BYTE_REGEX.test(strVal);
    return {
      rawType: memoType,
      rawValue: strVal,
      category: "hash_digest",
      isCompliantFormat: isHex,
      sanitized: isHex ? strVal.toLowerCase() : strVal.slice(0, 32),
      referenceId: isHex ? `0x${strVal.toLowerCase()}` : undefined,
    };
  }

  // Check numeric ID
  if (memoType === "id" || NUMERIC_ID_REGEX.test(strVal)) {
    return {
      rawType: memoType,
      rawValue: strVal,
      category: "numeric_id",
      referenceId: strVal,
      isCompliantFormat: NUMERIC_ID_REGEX.test(strVal),
      sanitized: strVal,
    };
  }

  // Travel rule match
  const trMatch = strVal.match(TRAVEL_RULE_REGEX);
  if (trMatch) {
    return {
      rawType: memoType,
      rawValue: strVal,
      category: "travel_rule",
      referenceId: trMatch[1],
      isCompliantFormat: true,
      sanitized: strVal,
    };
  }

  // Incident ticket match
  const incMatch = strVal.match(INCIDENT_TICKET_REGEX);
  if (incMatch) {
    return {
      rawType: memoType,
      rawValue: strVal,
      category: "incident_ticket",
      referenceId: incMatch[1],
      isCompliantFormat: true,
      sanitized: strVal,
    };
  }

  // Invoice match
  const invMatch = strVal.match(INVOICE_REGEX);
  if (invMatch) {
    return {
      rawType: memoType,
      rawValue: strVal,
      category: "invoice",
      referenceId: invMatch[1],
      isCompliantFormat: true,
      sanitized: strVal,
    };
  }

  return {
    rawType: memoType,
    rawValue: strVal,
    category: "generic_text",
    isCompliantFormat: strVal.length <= 28, // Stellar MEMO_TEXT max is 28 bytes
    sanitized: strVal.replace(/[^\x20-\x7E]/g, ""),
  };
}
