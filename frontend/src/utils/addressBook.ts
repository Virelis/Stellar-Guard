export interface ContactEntry {
  address: string;
  alias: string;
  role?: string;
  notes?: string;
}

const DEFAULT_CONTACTS: ContactEntry[] = [
  {
    address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    alias: "Compliance Primary",
    role: "Admin 1",
  },
  {
    address: "GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV",
    alias: "Risk Officer Lead",
    role: "Admin 2",
  },
  {
    address: "GCKAZ62ZOOAOHYQ7L4F64YV5B7D7UGI4OWGFLQL3U6V7PYX2NY5R6ZHO",
    alias: "Institutional Cold Vault",
    role: "Admin 3",
  },
];

const STORAGE_KEY = "stellar_guard_address_book";

export function getAddressBook(): ContactEntry[] {
  if (typeof window === "undefined") return DEFAULT_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONTACTS;
  }
}

export function saveContact(contact: ContactEntry): void {
  const current = getAddressBook();
  const existingIdx = current.findIndex((c) => c.address === contact.address);
  if (existingIdx >= 0) {
    current[existingIdx] = contact;
  } else {
    current.push(contact);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function deleteContact(address: string): void {
  const current = getAddressBook().filter((c) => c.address !== address);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function resolveAlias(address: string): string {
  const contacts = getAddressBook();
  const match = contacts.find((c) => c.address === address);
  if (match) return match.alias;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

