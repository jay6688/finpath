"use client";

import { useState } from "react";

import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyEarningsPerShare } from "@/lib/api";

type Props = {
  response: CompanyEarningsPerShare;
};

const billions = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});
const millions = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function formatUsdBillions(value: number): string {
  return `$${billions.format(value / 1_000_000_000)}B`;
}

function formatShareCount(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${billions.format(value / 1_000_000_000)}B shares`;
  }
  return `${millions.format(value / 1_000_000)}M shares`;
}

function ContinueButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="eps-continue" onClick={onClick} type="button">
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}

export function EpsShareCountLearning({ response }: Props) {
  const { markExplored } = useLearningProgress();
  const [visibleStage, setVisibleStage] = useState(1);
  const [firstAnswer, setFirstAnswer] = useState<"yes" | "no" | null>(null);
  const [denominatorAnswer, setDenominatorAnswer] = useState<"increase" | "decrease" | "same" | null>(null);
  const [finished, setFinished] = useState(false);
  const { company, statement } = response;
  const dilutionDifference =
    statement.dilutedWeightedAverageShares.value -
    statement.basicWeightedAverageShares.value;

  const reveal = (stage: number) => {
    setVisibleStage((current) => Math.max(current, stage));
  };

  return (
    <article className="eps-lesson" aria-labelledby="eps-question">
      <header className="eps-lesson__hero">
        <p className="eyebrow">Earnings, translated per share</p>
        <h2 id="eps-question">A company earned billions. What does that mean for one share?</h2>
        <p>
          Start with {company.name}&apos;s reviewed earnings, then see why EPS uses
          a weighted-average share count across the reporting period.
        </p>
      </header>

      <ol className="eps-stages" aria-label="EPS and share count learning stages">
        <li className="eps-stage" data-active={visibleStage === 1}>
          <p className="eps-stage__number">01 · Company earnings vs one share</p>
          <h3>{statement.earningsNumerator.reportedLabel}</h3>
          <strong className="eps-stage__figure">{formatUsdBillions(statement.earningsNumerator.value)}</strong>
          <p>
            Does {formatUsdBillions(statement.earningsNumerator.value)} of company
            earnings mean one share earned that whole amount?
          </p>
          <div className="eps-choice-group" role="group" aria-label="Does company earnings equal earnings for one share?">
            <button aria-pressed={firstAnswer === "no"} onClick={() => setFirstAnswer("no")} type="button">No</button>
            <button aria-pressed={firstAnswer === "yes"} onClick={() => setFirstAnswer("yes")} type="button">Yes</button>
          </div>
          {firstAnswer ? (
            <div className="eps-feedback" role="status">
              <strong>{firstAnswer === "no" ? "Right." : "Not quite."}</strong>{" "}
              That figure belongs to the company as a whole. EPS means Earnings
              Per Share: it relates reviewed earnings to a weighted-average share count.
            </div>
          ) : null}
          {firstAnswer ? <ContinueButton onClick={() => reveal(2)}>See Basic EPS</ContinueButton> : null}
        </li>

        {visibleStage >= 2 ? (
          <li className="eps-stage" data-active={visibleStage === 2}>
            <p className="eps-stage__number">02 · Basic EPS</p>
            <h3>Use weighted-average basic shares.</h3>
            <div className="eps-equation" aria-label="Basic earnings per share relationship">
              <div><span>{statement.earningsNumerator.reportedLabel}</span><strong>{formatUsdBillions(statement.earningsNumerator.value)}</strong></div>
              <b aria-hidden="true">÷</b>
              <div><span>Weighted-average basic shares</span><strong>{formatShareCount(statement.basicWeightedAverageShares.value)}</strong></div>
              <b aria-hidden="true">≈</b>
              <div className="eps-equation__result"><span>Company-reported Basic EPS</span><strong>${statement.basicEps.value}</strong><small>per share</small></div>
            </div>
            <p className="learning-trace eps-learning-trace">
              Reported earnings ÷ reported weighted-average basic shares verifies
              the reported Basic EPS after rounding to two decimals.
            </p>
            <EpsEvidenceInspector basis="basic" response={response} />
            <ContinueButton onClick={() => reveal(3)}>Why weighted average?</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 3 ? (
          <li className="eps-stage" data-active={visibleStage === 3}>
            <p className="eps-stage__number">03 · Why weighted average?</p>
            <h3>The denominator belongs to the whole period.</h3>
            <div className="eps-timeline" aria-label={`FY${statement.fiscalYear} weighted-average share timeline`}>
              <span>{statement.startDate}</span>
              <div><i /><strong>Shares can change during the year</strong><i /></div>
              <span>{statement.endDate}</span>
            </div>
            <p className="eps-timeline__result">↓ weighted-average shares for FY{statement.fiscalYear}</p>
            <p>
              This is not simply the number of shares on the last day. Weighted-average
              shares are used for EPS. They are not automatically the share count you
              would use for a current Market Cap calculation.
            </p>
            <ContinueButton onClick={() => reveal(4)}>See Diluted EPS</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 4 ? (
          <li className="eps-stage" data-active={visibleStage === 4}>
            <p className="eps-stage__number">04 · Diluted EPS</p>
            <h3>Include the reviewed dilutive effect.</h3>
            <div className="eps-dilution">
              <dl>
                <div><dt>Basic weighted-average shares</dt><dd>{formatShareCount(statement.basicWeightedAverageShares.value)}</dd></div>
                <div><dt>Difference between reported denominators</dt><dd>+ {formatShareCount(dilutionDifference)}</dd></div>
                <div><dt>Diluted weighted-average shares</dt><dd>{formatShareCount(statement.dilutedWeightedAverageShares.value)}</dd></div>
              </dl>
              <div className="eps-dilution__result">
                <span>Company-reported Diluted EPS</span>
                <strong>${statement.dilutedEps.value}</strong>
                <small>per share</small>
              </div>
            </div>
            <p>
              Potential share-based awards or other dilutive instruments can make
              the reviewed diluted denominator larger. In this filing, it is larger
              and Diluted EPS is slightly lower; that relationship is not a universal promise.
            </p>
            <EpsEvidenceInspector basis="diluted" response={response} />
            <ContinueButton onClick={() => reveal(5)}>Use the relationship</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 5 ? (
          <li className="eps-stage" data-active={visibleStage === 5}>
            <p className="eps-stage__number">05 · Same earnings, different denominator</p>
            <h3>If earnings stayed the same but the weighted-average share count increased, what would happen to EPS, all else equal?</h3>
            <div className="eps-choice-group eps-choice-group--three" role="group" aria-label="What happens to EPS when share count increases?">
              <button aria-pressed={denominatorAnswer === "increase"} onClick={() => setDenominatorAnswer("increase")} type="button">EPS increases</button>
              <button aria-pressed={denominatorAnswer === "decrease"} onClick={() => setDenominatorAnswer("decrease")} type="button">EPS decreases</button>
              <button aria-pressed={denominatorAnswer === "same"} onClick={() => setDenominatorAnswer("same")} type="button">EPS stays the same</button>
            </div>
            {denominatorAnswer ? (
              <div className="eps-feedback" role="status">
                <strong>{denominatorAnswer === "decrease" ? "That’s the relationship." : "Try the fraction again."}</strong>{" "}
                With the same earnings spread across more weighted-average shares,
                earnings per share would decrease. This is not a judgment about the stock.
              </div>
            ) : null}
            {denominatorAnswer ? <ContinueButton onClick={() => reveal(6)}>Keep the boundaries clear</ContinueButton> : null}
          </li>
        ) : null}

        {visibleStage >= 6 ? (
          <li className="eps-stage" data-active={visibleStage === 6}>
            <p className="eps-stage__number">06 · EPS boundaries</p>
            <h3>EPS answers one accounting question—not every investing question.</h3>
            <ul className="eps-boundaries">
              <li>EPS is not the same as a share price.</li>
              <li>EPS is not dividend per share or cash paid to shareholders.</li>
              <li>EPS is not cash per share or company value.</li>
              <li>EPS is not a recommendation.</li>
            </ul>
            <p>Higher EPS alone does not prove that one company is a better investment.</p>
            <ContinueButton onClick={() => reveal(7)}>Review the takeaway</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 7 ? (
          <li className="eps-stage eps-stage--final" data-active={!finished}>
            <p className="eps-stage__number">07 · Takeaway</p>
            <h3>Company earnings become meaningful per share only after choosing the right period denominator.</h3>
            <dl className="eps-takeaway">
              <div><dt>Basic EPS uses</dt><dd>Weighted-average basic shares for the reporting period.</dd></div>
              <div><dt>Diluted EPS uses</dt><dd>The reviewed diluted weighted-average denominator.</dd></div>
              <div><dt>Reported vs checked</dt><dd>{company.name} reported EPS; FinPath verified the division and rounding.</dd></div>
            </dl>
            <button
              className="eps-finish"
              disabled={finished}
              onClick={() => {
                markExplored(["eps-and-share-count"]);
                setFinished(true);
              }}
              type="button"
            >
              {finished ? "Lesson explored" : "Finish lesson"}
            </button>
          </li>
        ) : null}
      </ol>
    </article>
  );
}
