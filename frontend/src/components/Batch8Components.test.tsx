import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletSelectorModal } from "./WalletSelectorModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatRelativeTime, formatDuration, formatDateTime } from "../utils/dateFormatter";
import { isSoundEnabled, setSoundEnabled } from "../utils/soundEffects";
import { AutoRefreshIndicator } from "./AutoRefreshIndicator";
import { ComplianceMemoBadge } from "./ComplianceMemoBadge";

describe("Batch 8: Advanced Components & Integrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("WalletSelectorModal", () => {
    it("renders wallet choices and triggers selection callback", () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      render(<WalletSelectorModal isOpen={true} onClose={onClose} onSelectWallet={onSelect} />);

      expect(screen.getByText("Freighter Wallet")).toBeInTheDocument();
      expect(screen.getByText("Albedo Signer")).toBeInTheDocument();
      expect(screen.getByText("xBull Wallet")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Albedo Signer"));
      expect(onSelect).toHaveBeenCalledWith("albedo");
      expect(onClose).toHaveBeenCalled();
    });

    it("renders nothing when closed", () => {
      const { container } = render(
        <WalletSelectorModal isOpen={false} onClose={jest.fn()} onSelectWallet={jest.fn()} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("ErrorBoundary Component", () => {
    function BrokenComponent(): React.ReactElement {
      throw new Error("Simulated critical rendering fault");
    }

    it("catches rendering errors and provides diagnostics button", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary fallbackTitle="Ledger Fault">
          <BrokenComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Ledger Fault")).toBeInTheDocument();
      expect(screen.getByText("Simulated critical rendering fault")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
      expect(screen.getByText("Copy Diagnostics")).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe("dateFormatter Utility", () => {
    it("formats relative times cleanly", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      expect(formatRelativeTime(nowSec)).toBe("just now");
      expect(formatRelativeTime(nowSec - 120)).toBe("2m ago");
      expect(formatRelativeTime(nowSec - 7200)).toBe("2h ago");
      expect(formatRelativeTime(nowSec - 86400 * 3)).toBe("3d ago");
    });

    it("formats duration spans into hours, minutes, and seconds", () => {
      expect(formatDuration(0)).toBe("0s");
      expect(formatDuration(45)).toBe("45s");
      expect(formatDuration(150)).toBe("2m 30s");
      expect(formatDuration(3665)).toBe("1h 1m 5s");
    });

    it("formats ISO timestamps", () => {
      const res = formatDateTime(1700000000);
      expect(typeof res).toBe("string");
      expect(res.length).toBeGreaterThan(5);
    });
  });

  describe("soundEffects Utility", () => {
    it("manages localStorage sound enabled preference", () => {
      expect(isSoundEnabled()).toBe(true); // default true
      setSoundEnabled(false);
      expect(isSoundEnabled()).toBe(false);
      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);
    });
  });

  describe("AutoRefreshIndicator", () => {
    it("renders countdown and handles manual refresh trigger", () => {
      const onRefresh = jest.fn();
      render(<AutoRefreshIndicator intervalSeconds={10} onRefresh={onRefresh} />);

      expect(screen.getByText("10s")).toBeInTheDocument();
      const refreshBtn = screen.getByTitle("Refresh immediately");
      fireEvent.click(refreshBtn);
      expect(onRefresh).toHaveBeenCalledTimes(1);

      const pauseBtn = screen.getByTitle("Pause auto-refresh");
      fireEvent.click(pauseBtn);
      expect(screen.getByText("Paused")).toBeInTheDocument();
    });
  });

  describe("ComplianceMemoBadge", () => {
    it("classifies FATF travel rule, incident tickets, and hash memos", () => {
      render(
        <div>
          <ComplianceMemoBadge memo="TR-USDC-9401" />
          <ComplianceMemoBadge memo="INC-2026-002" />
          <ComplianceMemoBadge memo="INV-5501" />
        </div>
      );

      expect(screen.getByText(/Travel Rule:/i)).toBeInTheDocument();
      expect(screen.getByText(/Incident:/i)).toBeInTheDocument();
      expect(screen.getByText(/Invoice:/i)).toBeInTheDocument();
    });
  });
});
