import type { CSSProperties } from "react";

import lessonContent from "@/content/cash-flow-lessons/aapl-investing-financing-fy2025.json";
import type { CashFlowSectionId, CashFlowStatementLineId } from "@/lib/api";
import type {
  CashActivityPresentation,
  CashActivityPresentationLine,
} from "@/lib/cash-flow-learning";

import styles from "./cash-activity-trace.module.css";

type Props = {
  onSelect: (lineId: CashFlowStatementLineId) => void;
  presentation: CashActivityPresentation;
  selectedLineId: CashFlowStatementLineId | null;
};

type LineCopy = { reportedLabel: string; helper: string };

const lineCopy = lessonContent.lines as Record<CashFlowStatementLineId, LineCopy>;
const representativeLineIds: CashFlowStatementLineId[] = [
  "payments-for-property-plant-and-equipment",
  "maturities-of-marketable-securities",
  "common-stock-repurchases",
  "term-debt-issuance-net",
];
const activityLabels: Record<CashFlowSectionId, string> = {
  operating: "Operating",
  investing: "Investing",
  financing: "Financing",
};
const activityDescriptions = lessonContent.activityDescriptions as Record<
  CashFlowSectionId,
  string
>;

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatSignedBillions(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatBillions(value: number): string {
  return `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function directionLabel(direction: "inflow" | "outflow" | "none"): string {
  if (direction === "inflow") return "net cash inflow";
  if (direction === "outflow") return "net cash outflow";
  return "no net cash movement";
}

function quantitativeStyle(magnitudePercent: number): CSSProperties {
  return { "--activity-magnitude": magnitudePercent } as CSSProperties;
}

export function CashActivityTrace({
  onSelect,
  presentation,
  selectedLineId,
}: Props) {
  const selectableLines = presentation.activities.flatMap((activity) =>
    activity.lines.map((line) => ({ ...line, activityId: activity.id })),
  );
  const representativeLines = representativeLineIds.map((lineId) => {
    const line = selectableLines.find((candidate) => candidate.id === lineId);
    if (!line) throw new Error(`Missing Cash Activity line: ${lineId}`);
    return line;
  });
  const selectedLine = selectableLines.find((line) => line.id === selectedLineId);
  const selectedActivityId = selectedLine?.activityId ?? null;
  const activityEquivalent = presentation.activities
    .map(
      (activity) =>
        `${activityLabels[activity.id]} ${formatSignedBillions(activity.amount)}, ${directionLabel(activity.direction)}`,
    )
    .join("; ");

  return (
    <section className={styles.trace} aria-labelledby="cash-activity-heading">
      <header className={styles.traceHeader}>
        <p className="eyebrow">Cash Activity Trace · one shared scale</p>
        <h3 id="cash-activity-heading">Classify the activity before judging the sign.</h3>
        <p>
          All three reported section totals share one zero-centered scale. Bar length
          encodes magnitude; left or right encodes cash direction.
        </p>
      </header>

      <div
        aria-label={`${activityEquivalent}. Reported net change in cash ${formatSignedBillions(presentation.change.amount)}. Beginning cash ${formatBillions(presentation.balance.beginning)}, plus change ${formatSignedBillions(presentation.balance.change)}, equals ending cash ${formatBillions(presentation.balance.ending)}.`}
        className={styles.activityFigure}
        role="img"
      >
        <div className={styles.scaleLegend} aria-hidden="true">
          <span>Cash outflow ←</span>
          <span>0</span>
          <span>→ Cash inflow</span>
        </div>
        <div className={styles.activityRows}>
          {presentation.activities.map((activity) => (
            <div
              className={styles.activityRow}
              data-highlighted={selectedActivityId === activity.id || undefined}
              data-activity={activity.id}
              key={activity.id}
            >
              <div className={styles.activityIdentity}>
                <strong>{activityLabels[activity.id]}</strong>
                <span>{activityDescriptions[activity.id]}</span>
              </div>
              <div className={styles.quantitativeArea} aria-hidden="true">
                <span className={styles.zeroAxis} />
                <span
                  className={styles.activityBar}
                  data-direction={activity.direction}
                  style={quantitativeStyle(activity.magnitudePercent)}
                />
              </div>
              <div className={styles.activityAmount}>
                <strong>{formatSignedBillions(activity.amount)}</strong>
                <span>{directionLabel(activity.direction)}</span>
              </div>
            </div>
          ))}
          <div className={`${styles.activityRow} ${styles.changeRow}`}>
            <div className={styles.activityIdentity}>
              <strong>Reported change</strong>
              <span>All three activity totals together</span>
            </div>
            <div className={styles.quantitativeArea} aria-hidden="true">
              <span className={styles.zeroAxis} />
              <span
                className={styles.activityBar}
                data-direction={presentation.change.direction}
                style={quantitativeStyle(presentation.change.magnitudePercent)}
              />
            </div>
            <div className={styles.activityAmount}>
              <strong>{formatSignedBillions(presentation.change.amount)}</strong>
              <span>{directionLabel(presentation.change.direction)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.balanceBridge} aria-label="Cash balance reconciliation">
        <div><span>Beginning cash</span><strong>{formatBillions(presentation.balance.beginning)}</strong></div>
        <span aria-hidden="true">+</span>
        <div><span>Reported change</span><strong>{formatSignedBillions(presentation.balance.change)}</strong></div>
        <span aria-hidden="true">=</span>
        <div><span>Ending cash</span><strong>{formatBillions(presentation.balance.ending)}</strong></div>
      </div>

      <div className={styles.lineStudy}>
        <section aria-labelledby="cash-examples-heading" className={styles.examples}>
          <p className="eyebrow" id="cash-examples-heading">Inspect a reported line</p>
          <div className={styles.exampleList}>
            {representativeLines.map((line) => (
              <button
                aria-pressed={selectedLineId === line.id}
                data-direction={line.direction}
                key={line.id}
                onClick={() => onSelect(line.id)}
                type="button"
              >
                <span>{activityLabels[line.activityId]}</span>
                <strong>{lineCopy[line.id].reportedLabel}</strong>
                <small>{formatSignedBillions(line.amount)}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.inspector} aria-live="polite">
          {selectedLine ? (
            <>
              <p className="eyebrow">{activityLabels[selectedLine.activityId]} activity</p>
              <h4>{lineCopy[selectedLine.id].reportedLabel}</h4>
              <strong>{formatSignedBillions(selectedLine.amount)}</strong>
              <p>{lineCopy[selectedLine.id].helper}</p>
              <dl>
                <div><dt>Classification</dt><dd>{activityLabels[selectedLine.activityId]}</dd></div>
                <div><dt>Direction</dt><dd>{directionLabel(selectedLine.direction)}</dd></div>
              </dl>
              <p className={styles.qualityBoundary}>{lessonContent.signBoundary}</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Classification → direction → magnitude</p>
              <h4>Choose a line to trace it.</h4>
              <p>
                The three totals and balance reconciliation are already complete.
                Inspecting a line adds context; it does not unlock the lesson.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

export function CashActivityLineBar({ line }: { line: CashActivityPresentationLine }) {
  return (
    <span className={styles.childScale} aria-hidden="true">
      <span className={styles.zeroAxis} />
      <span
        className={styles.activityBar}
        data-direction={line.direction}
        style={quantitativeStyle(line.magnitudePercent)}
      />
    </span>
  );
}
