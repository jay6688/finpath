import type { CompanyIncomeStatement } from "@/lib/api";


export type NetProfitMarginDerivation = {
  revenue: number;
  netIncome: number;
  exactPercent: number;
  verificationPercent: number;
  displayPercent: number;
  perHundredRevenue: number;
};

export type MarginSemanticAnchor = {
  id: "revenue-reference" | "net-income-part" | "margin-relationship";
  semanticRole: "reference-whole" | "measured-part" | "derived-relationship";
};

type MarginReportedValue = {
  amount: number;
  evidenceAvailability: "available";
  kind: "reported";
  semanticRole: "reference-whole" | "measured-part";
};

export type MarginPresentation = {
  revenue: MarginReportedValue;
  netIncome: MarginReportedValue;
  ratio: {
    kind: "derived";
    exactPercent: number;
    displayPercent: number;
  };
  normalizedPerHundred: {
    kind: "derived-normalized";
    exactAmount: number;
    displayAmount: number;
  };
  ruler:
    | {
        domainMinimumPercent: 0;
        domainMaximumPercent: 100;
        geometryPercent: number;
        state: "supported";
      }
    | {
        domainMinimumPercent: 0;
        domainMaximumPercent: 100;
        geometryPercent: null;
        reason: "negative-margin" | "above-reference";
        state: "unsupported";
      };
  anchors: MarginSemanticAnchor[];
  defaultAnchorId: MarginSemanticAnchor["id"];
};

export class ProfitMarginDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfitMarginDataError";
  }
}

export function deriveNetProfitMargin(
  statement: CompanyIncomeStatement["statement"],
): NetProfitMarginDerivation {
  const revenueLines = statement.lines.filter(
    (line) => line.id === "total-net-sales",
  );
  const netIncomeLines = statement.lines.filter(
    (line) => line.id === "net-income",
  );

  if (revenueLines.length !== 1 || netIncomeLines.length !== 1) {
    throw new ProfitMarginDataError(
      "Net Profit Margin requires exactly one Revenue line and one Net Income line.",
    );
  }

  const revenue = revenueLines[0].value;
  const netIncome = netIncomeLines[0].value;

  if (!Number.isSafeInteger(revenue) || revenue <= 0) {
    throw new ProfitMarginDataError(
      "Net Profit Margin requires a positive, validated Revenue denominator.",
    );
  }
  if (!Number.isSafeInteger(netIncome)) {
    throw new ProfitMarginDataError(
      "Net Profit Margin requires a validated Net Income numerator.",
    );
  }

  const exactPercent = (netIncome / revenue) * 100;
  if (!Number.isFinite(exactPercent)) {
    throw new ProfitMarginDataError(
      "FinPath could not derive a finite Net Profit Margin.",
    );
  }

  const displayPercent = roundTo(exactPercent, 1);

  return {
    revenue,
    netIncome,
    exactPercent,
    verificationPercent: roundTo(exactPercent, 3),
    displayPercent,
    perHundredRevenue: displayPercent,
  };
}

export function buildMarginPresentation(
  derivation: NetProfitMarginDerivation,
): MarginPresentation {
  const base = {
    revenue: {
      amount: derivation.revenue,
      evidenceAvailability: "available" as const,
      kind: "reported" as const,
      semanticRole: "reference-whole" as const,
    },
    netIncome: {
      amount: derivation.netIncome,
      evidenceAvailability: "available" as const,
      kind: "reported" as const,
      semanticRole: "measured-part" as const,
    },
    ratio: {
      kind: "derived" as const,
      exactPercent: derivation.exactPercent,
      displayPercent: derivation.displayPercent,
    },
    normalizedPerHundred: {
      kind: "derived-normalized" as const,
      exactAmount: derivation.exactPercent,
      displayAmount: roundTo(derivation.displayPercent, 2),
    },
    anchors: [
      { id: "revenue-reference", semanticRole: "reference-whole" },
      { id: "net-income-part", semanticRole: "measured-part" },
      { id: "margin-relationship", semanticRole: "derived-relationship" },
    ] satisfies MarginSemanticAnchor[],
    defaultAnchorId: "margin-relationship" as const,
  };

  if (derivation.exactPercent < 0) {
    return {
      ...base,
      ruler: {
        domainMinimumPercent: 0,
        domainMaximumPercent: 100,
        geometryPercent: null,
        reason: "negative-margin",
        state: "unsupported",
      },
    };
  }

  if (derivation.exactPercent > 100) {
    return {
      ...base,
      ruler: {
        domainMinimumPercent: 0,
        domainMaximumPercent: 100,
        geometryPercent: null,
        reason: "above-reference",
        state: "unsupported",
      },
    };
  }

  return {
    ...base,
    ruler: {
      domainMinimumPercent: 0,
      domainMaximumPercent: 100,
      geometryPercent: derivation.exactPercent,
      state: "supported",
    },
  };
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
