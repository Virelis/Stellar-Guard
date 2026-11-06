import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { translate } from "../utils/i18n";
import { RiskGauge } from "./RiskGauge";
import { buildTicketUrl, TicketDeepLink } from "./TicketDeepLink";
import { OnboardingTourCard } from "./OnboardingTourCard";
import { VirtualScrollTable } from "./VirtualScrollTable";
import { SidebarNav } from "./SidebarNav";

describe("Batch 9: Final Frontend & UI Components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("i18n Multi-Language Translation Utility", () => {
    it("translates keys across English, Spanish, French, and German", () => {
      expect(translate("app.title", "en")).toBe("Stellar-Guard");
      expect(translate("action.fastFreeze", "es")).toBe("Congelación Rápida");
      expect(translate("status.quorumMet", "fr")).toBe("Quorum Atteint");
      expect(translate("action.connect", "de")).toBe("Wallet Verbinden");
    });

    it("falls back to English or raw key when translation is missing", () => {
      expect(translate("non.existent.key", "fr")).toBe("non.existent.key");
    });
  });

  describe("RiskGauge Component", () => {
    it("renders score, severity tier, and SVG arc", () => {
      render(<RiskGauge score={85} />);
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("CRITICAL RISK")).toBeInTheDocument();
    });

    it("renders LOW risk level when score is under 30", () => {
      render(<RiskGauge score={15} />);
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("LOW RISK")).toBeInTheDocument();
    });
  });

  describe("TicketDeepLink Component", () => {
    it("builds correct issue tracker URLs for Linear, Jira, and GitHub", () => {
      const linearUrl = buildTicketUrl("INC-101", "linear");
      expect(linearUrl).toBe("https://linear.app/issue/INC-101");

      const jiraUrl = buildTicketUrl("INC-101", "jira", "https://jira.corp.internal");
      expect(jiraUrl).toBe("https://jira.corp.internal/browse/INC-101");

      const ghUrl = buildTicketUrl("INC-101", "github");
      expect(ghUrl).toContain("github.com/Virelis/Stellar-Guard/issues?q=INC-101");
    });

    it("renders anchor tag with external link attributes", () => {
      render(<TicketDeepLink referenceId="INC-999" provider="linear" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://linear.app/issue/INC-999");
      expect(link).toHaveTextContent("INC-999");
    });
  });

  describe("OnboardingTourCard Component", () => {
    it("progresses through 4 walkthrough steps and dismisses", () => {
      render(<OnboardingTourCard />);
      expect(screen.getByText("1. Connect Institutional Wallet")).toBeInTheDocument();

      const nextBtn = screen.getByText("Next Step →");
      fireEvent.click(nextBtn);
      expect(screen.getByText("2. Monitor Live Horizon Stream")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Next Step →"));
      expect(screen.getByText("3. Propose Quorum Quarantine")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Next Step →"));
      expect(screen.getByText("4. Reach Multi-Sig Consensus")).toBeInTheDocument();

      const finishBtn = screen.getByText("Get Started ✓");
      fireEvent.click(finishBtn);
      expect(screen.queryByText("4. Reach Multi-Sig Consensus")).not.toBeInTheDocument();
      expect(localStorage.getItem("stellar_guard_onboarding_dismissed")).toBe("true");
    });
  });

  describe("VirtualScrollTable Container", () => {
    it("renders children and displays buffer count indicator", () => {
      render(
        <VirtualScrollTable totalCount={200} displayedCount={50}>
          <table>
            <tbody>
              <tr>
                <td>Row Content</td>
              </tr>
            </tbody>
          </table>
        </VirtualScrollTable>
      );

      expect(screen.getByText("Displaying latest 50 records")).toBeInTheDocument();
      expect(screen.getByText("150 older transactions buffered")).toBeInTheDocument();
      expect(screen.getByText("Row Content")).toBeInTheDocument();
    });
  });

  describe("SidebarNav Component", () => {
    it("renders navigation items and toggles expansion", () => {
      const onToggle = jest.fn();
      const onSelect = jest.fn();

      const { rerender } = render(
        <SidebarNav
          collapsed={false}
          onToggle={onToggle}
          activeItem="overview"
          onSelectItem={onSelect}
        />
      );

      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Command Center")).toBeInTheDocument();

      const toggleBtn = screen.getByTitle("Collapse sidebar");
      fireEvent.click(toggleBtn);
      expect(onToggle).toHaveBeenCalled();

      rerender(
        <SidebarNav
          collapsed={true}
          onToggle={onToggle}
          activeItem="overview"
          onSelectItem={onSelect}
        />
      );
      expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
    });
  });
});
