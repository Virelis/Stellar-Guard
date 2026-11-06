import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuorumMeter } from "./QuorumMeter";
import { StellarExplorerLink, buildStellarExpertUrl } from "./StellarExplorerLink";
import { getAddressBook, saveContact, resolveAlias, deleteContact } from "../utils/addressBook";
import { CopyButton } from "./CopyButton";
import { OverviewMetricCards } from "./OverviewMetricCards";

describe("Batch 7: Frontend Core & Institutional Components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("QuorumMeter Component", () => {
    it("renders linear quorum meter with percentage and status", () => {
      render(<QuorumMeter currentVotes={2} requiredQuorum={3} variant="linear" />);
      expect(screen.getByText("2 / 3 (67%)")).toBeInTheDocument();
      expect(screen.getByText("1 more needed")).toBeInTheDocument();
    });

    it("renders quorum met status when threshold is reached", () => {
      render(<QuorumMeter currentVotes={3} requiredQuorum={3} variant="linear" />);
      expect(screen.getByText("Quorum Met")).toBeInTheDocument();
      expect(screen.getByText("3 / 3 (100%)")).toBeInTheDocument();
    });

    it("renders compact variant with badge and count", () => {
      render(<QuorumMeter currentVotes={1} requiredQuorum={3} variant="compact" />);
      expect(screen.getByText("1/3")).toBeInTheDocument();
      expect(screen.getByText("(33%)")).toBeInTheDocument();
    });

    it("renders circular variant SVG with numbers", () => {
      render(<QuorumMeter currentVotes={2} requiredQuorum={3} variant="circular" size={80} />);
      expect(screen.getByText("2/3")).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument();
    });
  });

  describe("Stellar Explorer Link Helper", () => {
    it("builds testnet and mainnet URLs accurately for accounts and transactions", () => {
      const accUrl = buildStellarExpertUrl(
        "account",
        "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        undefined,
        "testnet"
      );
      expect(accUrl).toBe(
        "https://stellar.expert/explorer/testnet/account/GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
      );

      const txUrl = buildStellarExpertUrl("tx", "deadbeef1234", undefined, "public");
      expect(txUrl).toBe("https://stellar.expert/explorer/public/tx/deadbeef1234");

      const assetUrl = buildStellarExpertUrl("asset", "USDC", "GAAZI...", "testnet");
      expect(assetUrl).toBe("https://stellar.expert/explorer/testnet/asset/USDC-GAAZI...");
    });

    it("renders link element with arrow indicator and correct href", () => {
      render(
        <StellarExplorerLink
          type="account"
          value="GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
          network="testnet"
        />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        "https://stellar.expert/explorer/testnet/account/GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
      );
      expect(link).toHaveTextContent("GAAZI4…CCWN");
    });
  });

  describe("Address Book & Alias Resolution", () => {
    it("resolves default compliance aliases and supports adding custom contact", () => {
      const defaultAddr = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
      expect(resolveAlias(defaultAddr)).toBe("Compliance Primary");

      const customAddr = "GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV";
      saveContact({
        address: customAddr,
        alias: "Alice SOC Lead",
        role: "Lead",
      });

      expect(resolveAlias(customAddr)).toBe("Alice SOC Lead");
      const list = getAddressBook();
      expect(list.some((c) => c.alias === "Alice SOC Lead")).toBe(true);

      deleteContact(customAddr);
      expect(resolveAlias(customAddr)).not.toBe("Alice SOC Lead");
    });
  });

  describe("CopyButton Component", () => {
    it("copies text and updates visual state", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockImplementation(() => Promise.resolve()),
        },
      });

      render(<CopyButton text="GAAZI123" label="Copy Key" />);
      const btn = screen.getByRole("button", { name: /copy key/i });
      fireEvent.click(btn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("GAAZI123");
    });
  });

  describe("OverviewMetricCards Component", () => {
    it("renders all four institutional KPI summary cards", () => {
      render(
        <OverviewMetricCards
          activeProposalsCount={5}
          quarantinedCount={22}
          monitoredVolume24h="$2,400,000"
          avgQuorumLatency="1.8 mins"
        />
      );

      expect(screen.getByText("Quarantined Accounts")).toBeInTheDocument();
      expect(screen.getByText("22")).toBeInTheDocument();
      expect(screen.getByText("Pending Quorum Proposals")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("$2,400,000")).toBeInTheDocument();
      expect(screen.getByText("1.8 mins")).toBeInTheDocument();
    });
  });
});
