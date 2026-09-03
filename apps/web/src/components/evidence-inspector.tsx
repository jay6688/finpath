import type { DerivedEvidence, ReportedEvidence } from "@/lib/evidence";

type EvidenceInspectorProps = {
  evidence: ReportedEvidence | DerivedEvidence;
  id: string;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const exactDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const reportedMillions = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(value)}B`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPercent(value: number, decimalPlaces: number, signed = false): string {
  const sign = signed && value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(decimalPlaces)}%`;
}

function formatExactPercent(value: number, signed: boolean): string {
  const rounded = Number(value.toFixed(6));
  const sign = signed && rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const continuation = Math.abs(value - rounded) > 1e-12 ? "…" : "";
  return `${sign}${Math.abs(rounded).toFixed(6)}${continuation}%`;
}

function addTaxonomyBreaks(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1\u200B$2");
}

function ReportedInputEvidence({
  evidence,
  index,
  showSelectionPolicy,
}: {
  evidence: ReportedEvidence;
  index: number;
  showSelectionPolicy: boolean;
}) {
  const presentation = evidence.reviewedPresentation;

  return (
    <details className="evidence-input">
      <summary>
        <span>Input {index + 1} · {evidence.metric.label}</span>
        <strong>{formatBillions(evidence.finPathDisplay.value)}</strong>
      </summary>
      <div className="evidence-input__body">
        <p>
          <strong>{presentation ? "Apple reported: " : "Reported fact used by FinPath: "}</strong>
          {presentation
            ? `${presentation.reportedLabel} · $${reportedMillions.format(evidence.reportedFact.value / 1_000_000)} million`
            : `${evidence.metric.label} · ${exactDollars.format(evidence.reportedFact.value)} USD`}
        </p>
        <p>
          FY{evidence.filing.fiscalYear} · period ended {formatDate(evidence.filing.endDate)} · {evidence.filing.form} · accession {evidence.filing.accession}
        </p>
        {showSelectionPolicy ? (
          <p className="evidence-input__policy">
            FinPath uses the selected reported fact currently attached to this fiscal-year record.
          </p>
        ) : null}
        {evidence.filing.sourceUrl ? (
          <a
            aria-label={`Open SEC filing index for ${evidence.metric.label}`}
            href={evidence.filing.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open SEC filing index ↗
          </a>
        ) : (
          <p className="evidence-source-unavailable">Source link is currently unavailable; filing metadata remains shown.</p>
        )}
      </div>
    </details>
  );
}

function ReportedInspector({ evidence, id }: { evidence: ReportedEvidence; id: string }) {
  const presentation = evidence.reviewedPresentation;
  const inputValue = evidence.transformation.inputValue;

  return (
    <details className="evidence-inspector" data-evidence-kind="reported" id={id}>
      <summary>
        <span>How FinPath got this number</span>
        <small>Reported evidence</small>
      </summary>
      <div className="evidence-inspector__body">
        <header className="evidence-inspector__intro">
          <h3>{evidence.metric.label}</h3>
          <p>See what was reported and how FinPath displays the same number.</p>
        </header>

        <div className="evidence-reported-flow">
          <section className="evidence-reported-value" aria-labelledby={`${id}-reported`}>
            <p className="eyebrow" id={`${id}-reported`}>
              {presentation ? "Apple reported" : "Reported source fact"}
            </p>
            <strong>{presentation?.reportedLabel ?? evidence.metric.label}</strong>
            <b>
              {presentation
                ? `$${reportedMillions.format(evidence.reportedFact.value / 1_000_000)} million`
                : `${exactDollars.format(evidence.reportedFact.value)} USD`}
            </b>

            {presentation && presentation.contextLines.length > 0 ? (
              <details className="evidence-context">
                <summary>See the statement lines FinPath used</summary>
                <div>
                  <p className="evidence-context__notice">
                    FinPath-rendered context from Apple’s reviewed filing. Not a filing screenshot or exact HTML locator.
                  </p>
                  <p className="evidence-context__statement">{presentation.statementName}</p>
                  <dl>
                    {presentation.contextLines.map((line) => (
                      <div data-current={line.reportedLabel === presentation.reportedLabel} key={line.id}>
                        <dt>{line.reportedLabel}</dt>
                        <dd>${reportedMillions.format(Math.abs(line.value) / 1_000_000)} million</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ) : null}
          </section>

          <section className="evidence-reported-value" aria-labelledby={`${id}-finpath`}>
            <p className="eyebrow" id={`${id}-finpath`}>FinPath shows</p>
            <strong>{evidence.metric.label}</strong>
            <b>{formatBillions(evidence.finPathDisplay.value)}</b>
          </section>
        </div>

        {presentation ? (
          <section className="evidence-section evidence-why" aria-labelledby={`${id}-transform`}>
            <p className="eyebrow" id={`${id}-transform`}>Why?</p>
            <p className="evidence-unit-rule">1 billion = 1,000 million</p>
            <p className="evidence-equation evidence-equation--stacked">
              <span>${reportedMillions.format(inputValue)} million ÷ {reportedMillions.format(evidence.transformation.divisor)}</span>
              <strong>= {formatBillions(evidence.transformation.outputValue).replace("B", " billion")}</strong>
            </p>
            <p className="evidence-same-number">Same {evidence.metric.label}. Different display unit.</p>
            <p className="evidence-format-note">{evidence.transformation.note}</p>
          </section>
        ) : (
          <div className="evidence-fallback">
            <p>
              FinPath can trace this number to the SEC filing, but the reviewed Apple statement presentation is unavailable for this record. FinPath therefore does not show an Apple filing label or recreate its statement context here.
            </p>
            <p className="evidence-format-note">{evidence.transformation.note}</p>
          </div>
        )}

        {evidence.dataStatus.state === "stale" ? (
          <p className="evidence-stale" role="status">
            SEC is temporarily unavailable. This evidence uses FinPath’s last eligible cached public filing data, retrieved {new Date(evidence.dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}.
          </p>
        ) : null}

        <p className="evidence-source-summary">
          Same {evidence.company.name} FY{evidence.filing.fiscalYear} annual filing record.
        </p>

        <details className="evidence-source-details">
          <summary>Source details</summary>
          <div>
            <dl>
              <div><dt>Company</dt><dd>{evidence.company.name} · {evidence.company.ticker}</dd></div>
              <div><dt>Fiscal year</dt><dd>FY{evidence.filing.fiscalYear}</dd></div>
              <div><dt>Period ended</dt><dd>{formatDate(evidence.filing.endDate)}</dd></div>
              <div><dt>Filing</dt><dd>Annual Form {evidence.filing.form}</dd></div>
              <div><dt>Filed</dt><dd>{formatDate(evidence.filing.filedAt)}</dd></div>
              <div><dt>Accession</dt><dd>{evidence.filing.accession}</dd></div>
            </dl>
            {evidence.filing.sourceUrl ? (
              <a
                aria-label={`Open ${evidence.company.name} FY${evidence.filing.fiscalYear} ${evidence.filing.form} filing index on SEC.gov`}
                href={evidence.filing.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open SEC filing index ↗
              </a>
            ) : (
              <p className="evidence-source-unavailable">The source link is currently unavailable. FinPath keeps the filing details visible rather than showing a dead link.</p>
            )}
          </div>
        </details>

        <details className="evidence-technical">
          <summary>Technical details</summary>
          <dl>
            <div><dt>CIK</dt><dd>{evidence.company.cik}</dd></div>
            <div><dt>Accession</dt><dd>{evidence.filing.accession}</dd></div>
            {evidence.reportedFact.taxonomyTag ? (
              <div><dt>Taxonomy tag</dt><dd>{addTaxonomyBreaks(evidence.reportedFact.taxonomyTag)}</dd></div>
            ) : null}
            <div><dt>Exact stored value</dt><dd>{exactDollars.format(evidence.reportedFact.value)} USD</dd></div>
          </dl>
          <p>FinPath links to the filing index. It does not claim a unique Inline XBRL occurrence or exact HTML locator.</p>
        </details>
      </div>
    </details>
  );
}

function DerivedInspector({ evidence, id }: { evidence: DerivedEvidence; id: string }) {
  const [first, second] = evidence.inputs;
  const isGrowth = evidence.calculation.type === "year-over-year-percent";
  const substitutedFormula = isGrowth
    ? `(${formatBillions(second.finPathDisplay.value)} − ${formatBillions(first.finPathDisplay.value)}) ÷ ${formatBillions(first.finPathDisplay.value)} × 100`
    : `${formatBillions(second.finPathDisplay.value)} ÷ ${formatBillions(first.finPathDisplay.value)} × 100`;

  return (
    <details className="evidence-inspector" data-evidence-kind="derived" id={id}>
      <summary>
        <span>How FinPath calculated this</span>
        <small>Derived evidence</small>
      </summary>
      <div className="evidence-inspector__body">
        <header className="evidence-inspector__intro">
          <p className="eyebrow">Derived · calculation trail</p>
          <h3>{evidence.metric.label}</h3>
          <p>Apple reported the inputs. FinPath calculated the result.</p>
        </header>

        {evidence.inputs.some((input) => input.dataStatus.state === "stale") ? (
          <p className="evidence-stale" role="status">
            This calculation uses FinPath’s last eligible cached public filing data because SEC is temporarily unavailable.
          </p>
        ) : null}

        <section className="evidence-section" aria-labelledby={`${id}-inputs`}>
          <p className="eyebrow" id={`${id}-inputs`}>Reported inputs</p>
          <div className="evidence-inputs">
            {evidence.inputs.map((input, index) => (
              <ReportedInputEvidence
                evidence={input}
                index={index}
                key={`${input.metric.label}-${input.filing.fiscalYear}-${input.filing.accession}`}
                showSelectionPolicy={isGrowth}
              />
            ))}
          </div>
        </section>

        <section className="evidence-section" aria-labelledby={`${id}-calculation`}>
          <p className="eyebrow" id={`${id}-calculation`}>FinPath calculation</p>
          <p className="evidence-equation evidence-equation--rule">{evidence.calculation.formula}</p>
          <p className="evidence-equation">{substitutedFormula}</p>
          <dl className="evidence-result-grid">
            <div>
              <dt>Exact result</dt>
              <dd>{formatExactPercent(evidence.calculation.exactResult, isGrowth)}</dd>
            </div>
            <div>
              <dt>Displayed</dt>
              <dd>{formatPercent(evidence.calculation.displayedResult, evidence.calculation.decimalPlaces, isGrowth)}</dd>
            </div>
          </dl>
          <p className="evidence-format-note">{evidence.calculation.roundingNote}</p>
        </section>

        <section className="evidence-section evidence-limitation" aria-labelledby={`${id}-limit`}>
          <p className="eyebrow" id={`${id}-limit`}>What this evidence does not prove</p>
          <p>{evidence.limitation}</p>
        </section>
      </div>
    </details>
  );
}

export function EvidenceInspector({ evidence, id }: EvidenceInspectorProps) {
  return evidence.kind === "reported" ? (
    <ReportedInspector evidence={evidence} id={id} />
  ) : (
    <DerivedInspector evidence={evidence} id={id} />
  );
}
