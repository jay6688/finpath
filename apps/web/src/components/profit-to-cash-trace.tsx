import type { CSSProperties } from "react";

import type { CashFlowStatementLineId } from "@/lib/api";
import type {
  AdjustmentDirection,
  CashReconciliationGroupId,
  OperatingCashFlowPresentation,
  OperatingCashFlowPresentationGroup,
} from "@/lib/operating-cash-flow";

import styles from "./profit-to-cash-trace.module.css";

type GroupCopy = {
  label: string;
  explanation: string;
};

type LineCopy = {
  reportedLabel: string;
  helper: string;
};

type ProfitToCashTraceProps = {
  groupCopy: Record<CashReconciliationGroupId, GroupCopy>;
  lineCopy: Record<CashFlowStatementLineId, LineCopy>;
  onSelect: (groupId: CashReconciliationGroupId) => void;
  presentation: OperatingCashFlowPresentation;
  selectedGroupId: CashReconciliationGroupId | null;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatBillions(value: number): string {
  return `${exactBillions.format(Math.abs(value) / 1_000_000_000)}B`;
}

function formatSignedBillions(
  value: number,
  direction: AdjustmentDirection,
): string {
  const sign = direction === "negative" ? "−" : direction === "positive" ? "+" : "";
  return `${sign}${formatBillions(value)}`;
}

function magnitudeStyle(percent: number): CSSProperties {
  return { "--effect-magnitude": percent } as CSSProperties;
}

export function ProfitToCashTrace({
  groupCopy,
  lineCopy,
  onSelect,
  presentation,
  selectedGroupId,
}: ProfitToCashTraceProps) {
  const [nonCashGroup, timingGroup] = presentation.adjustmentGroups;
  const selectedGroup = presentation.adjustmentGroups.find(
    (group) => group.id === selectedGroupId,
  );
  const textualEquivalent = [
    `Net Income ${formatBillions(presentation.startingPoint.amount)}`,
    `plus non-cash effects ${formatBillions(nonCashGroup.amount)}`,
    `minus operating-timing effects ${formatBillions(timingGroup.amount)}`,
    `equals Operating Cash Flow ${formatBillions(presentation.result.amount)}`,
    `The two effects use one ${formatBillions(presentation.adjustmentScale.referenceAmount)} absolute adjustment reference.`,
  ].join(". ");

  return (
    <section className={styles.trace} aria-labelledby="profit-to-cash-trace-title">
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Signed Profit-to-Cash Trace</p>
          <h3 id="profit-to-cash-trace-title">Follow the reconciliation</h3>
        </div>
        <p className={styles.scaleNote}>
          Shared adjustment scale · {formatBillions(presentation.adjustmentScale.referenceAmount)}
          {" = 100% effect length"}
        </p>
      </header>

      <p className="sr-only" role="img" aria-label={textualEquivalent} />

      <div className={styles.flow}>
        <Endpoint
          amount={presentation.startingPoint.amount}
          label="Net Income"
          note="Apple reported · starting point"
        />
        <GroupStep
          copy={groupCopy[nonCashGroup.id]}
          group={nonCashGroup}
          onSelect={onSelect}
          selected={selectedGroupId === nonCashGroup.id}
        />
        <div className={styles.intermediate}>
          <span>After non-cash effects</span>
          <strong>{formatBillions(nonCashGroup.afterAmount)}</strong>
          <small>FinPath-derived cumulative state</small>
        </div>
        <GroupStep
          copy={groupCopy[timingGroup.id]}
          group={timingGroup}
          onSelect={onSelect}
          selected={selectedGroupId === timingGroup.id}
        />
        <p className={styles.netEffect}>
          Net adjustment:{" "}
          <strong>
            {formatSignedBillions(
              presentation.netAdjustment.amount,
              presentation.netAdjustment.direction,
            )}
          </strong>
          {" · "}{presentation.netAdjustment.magnitudePercent.toFixed(3)}% of the shared adjustment reference
        </p>
        <Endpoint
          amount={presentation.result.amount}
          label="Operating Cash Flow"
          note="Apple reported · result"
          result
        />
      </div>

      <aside className={styles.inspector} aria-live="polite">
        {selectedGroup ? (
          <GroupInspector
            copy={groupCopy[selectedGroup.id]}
            group={selectedGroup}
            lineCopy={lineCopy}
            referenceAmount={presentation.adjustmentScale.referenceAmount}
          />
        ) : (
          <div className={styles.inspectorPrompt}>
            <p className="eyebrow">Inspect an effect</p>
            <p>
              Choose either signed group to see the Apple-reported lines beneath
              FinPath’s derived total. The trace geometry will not change.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}

function Endpoint({
  amount,
  label,
  note,
  result = false,
}: {
  amount: number;
  label: string;
  note: string;
  result?: boolean;
}) {
  return (
    <div className={styles.endpoint} data-result={result || undefined}>
      <span>{label}</span>
      <strong>{formatBillions(amount)}</strong>
      <small>{note}</small>
    </div>
  );
}

function GroupStep({
  copy,
  group,
  onSelect,
  selected,
}: {
  copy: GroupCopy;
  group: OperatingCashFlowPresentationGroup;
  onSelect: (groupId: CashReconciliationGroupId) => void;
  selected: boolean;
}) {
  return (
    <div className={styles.groupStep} data-direction={group.direction}>
      <span className={styles.operator} aria-hidden="true">
        {group.direction === "negative" ? "−" : "+"}
      </span>
      <button
        aria-pressed={selected}
        className={styles.groupButton}
        data-selected={selected}
        onClick={() => onSelect(group.id)}
        type="button"
      >
        <span>
          <strong>{copy.label}</strong>
          <small>FinPath grouped from Apple-reported lines</small>
        </span>
        <b>{formatSignedBillions(group.amount, group.direction)}</b>
        <em>{selected ? "Selected" : "Inspect group"}</em>
      </button>
      <div
        aria-hidden="true"
        className={styles.effectTrack}
        data-direction={group.direction}
      >
        <span
          className={styles.effectMagnitude}
          data-direction={group.direction}
          style={magnitudeStyle(group.magnitudePercent)}
        />
      </div>
      <small className={styles.magnitudeLabel}>
        {group.magnitudePercent.toFixed(3)}% of shared adjustment reference
      </small>
    </div>
  );
}

function GroupInspector({
  copy,
  group,
  lineCopy,
  referenceAmount,
}: {
  copy: GroupCopy;
  group: OperatingCashFlowPresentationGroup;
  lineCopy: Record<CashFlowStatementLineId, LineCopy>;
  referenceAmount: number;
}) {
  return (
    <div data-selected-group={group.id}>
      <p className="eyebrow">Selected effect</p>
      <h4>{copy.label}</h4>
      <p>{copy.explanation}</p>
      <details className={styles.childDisclosure} data-group-detail={group.id}>
        <summary>Inspect {group.lines.length} reported lines</summary>
        <ul>
          {group.lines.map((line) => (
            <li key={line.id} data-direction={line.direction}>
              <div className={styles.childHeading}>
                <span>
                  <strong>{lineCopy[line.id].reportedLabel}</strong>
                  <small>{lineCopy[line.id].helper}</small>
                </span>
                <b>{formatSignedBillions(line.amount, line.direction)}</b>
              </div>
              <div
                aria-hidden="true"
                className={styles.childTrack}
                data-direction={line.direction}
              >
                <span
                  className={styles.childMagnitude}
                  data-direction={line.direction}
                  style={magnitudeStyle(line.magnitudePercent)}
                />
              </div>
              <small>
                {line.magnitudePercent.toFixed(3)}% of the same{" "}
                {formatBillions(referenceAmount)} reference
              </small>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
