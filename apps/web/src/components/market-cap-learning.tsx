"use client";

import { useState } from "react";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { SharesOutstandingEvidenceInspector } from "@/components/shares-outstanding-evidence-inspector";
import styles from "@/components/market-cap-learning.module.css";
import type { CompanySharesOutstanding } from "@/lib/api";
import {
  calculateEducationalMarketCap,
  formatEducationalMarketCapScale,
  MarketCapLearningError,
  parseEducationalPrice,
  type EducationalMarketCap,
} from "@/lib/market-cap-learning";

type Props = { response: CompanySharesOutstanding };

const exactInteger = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function MarketCapLearning({ response }: Props) {
  const { markExplored } = useLearningProgress();
  const [priceInput, setPriceInput] = useState("");
  const [calculation, setCalculation] = useState<EducationalMarketCap | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const { fact } = response;

  const calculate = (input: string) => {
    try {
      const next = calculateEducationalMarketCap(fact.value, input);
      setCalculation(next);
      setInputError(null);
      setFinished(false);
    } catch (error) {
      setCalculation(null);
      setInputError(
        error instanceof MarketCapLearningError
          ? error.message
          : "Enter a valid educational price.",
      );
    }
  };

  return (
    <article className={styles.lesson} aria-labelledby="market-cap-question">
      <header className={styles.introduction}>
        <p className="eyebrow">Whole-equity scenario workbench</p>
        <h2 id="market-cap-question">How does a share price translate into a whole-company equity market value?</h2>
        <p>
          Combine one reviewed point-in-time share count with a price you enter.
          The result is a hypothetical teaching scenario—not observed market data.
        </p>
      </header>

      <section className={styles.workbench} aria-labelledby="market-cap-workbench-heading">
        <header className={styles.workbenchHeading}>
          <div>
            <p className="eyebrow">Scenario inputs stay visibly separate</p>
            <h3 id="market-cap-workbench-heading">Shares outstanding × Price per share = Hypothetical Market Cap</h3>
          </div>
          <span>Local educational scenario</span>
        </header>

        <div className={styles.formula}>
          <section className={styles.reported} aria-labelledby="reported-shares-heading">
            <span className={styles.provenance}>Reported / reviewed</span>
            <h4 id="reported-shares-heading">Point-in-time shares outstanding</h4>
            <strong>{exactInteger.format(fact.value)}</strong>
            <small>shares · as of {formatDate(fact.asOfDate)}</small>
          </section>

          <b aria-hidden="true">×</b>

          <section className={styles.learnerInput} aria-labelledby="learner-price-heading">
            <span className={styles.provenance}>Learner input / hypothetical</span>
            <h4 id="learner-price-heading">Price per share</h4>
            <label htmlFor="market-cap-price">Educational price</label>
            <div className={styles.priceField}>
              <span aria-hidden="true">$</span>
              <input
                aria-describedby={inputError ? "market-cap-price-help market-cap-price-error" : "market-cap-price-help"}
                id="market-cap-price"
                inputMode="decimal"
                onChange={(event) => {
                  setPriceInput(event.target.value);
                  setCalculation(null);
                  setInputError(null);
                  setFinished(false);
                }}
                placeholder="0.00"
                type="text"
                value={priceInput}
              />
            </div>
            <small id="market-cap-price-help">Educational input — not verified market data</small>
            <button onClick={() => calculate(priceInput)} type="button">Calculate scenario</button>
            <button className={styles.example} onClick={() => {
              setPriceInput("100.00");
              calculate("100.00");
            }} type="button">Try a $100.00 educational example</button>
            {inputError ? <p id="market-cap-price-error" role="alert">{inputError}</p> : null}
          </section>

          <b aria-hidden="true">=</b>

          <section className={styles.derived} aria-labelledby="derived-market-cap-heading">
            <span className={styles.provenance}>FinPath-derived scenario</span>
            <h4 id="derived-market-cap-heading">Educational Market Cap at your price</h4>
            {calculation ? (
              <>
                <strong>{formatEducationalMarketCapScale(calculation.marketCapCents)}</strong>
                <small>{calculation.exactDollars} exact</small>
              </>
            ) : (
              <p>Enter a hypothetical price to calculate this scenario.</p>
            )}
          </section>
        </div>

        {calculation ? (
          <div className={styles.trace} role="status">
            <p><span>Reported input</span>{exactInteger.format(fact.value)} shares</p>
            <p><span>Learner input</span>${parseEducationalPrice(priceInput).normalized} per share</p>
            <p><span>Exact multiplication</span>{exactInteger.format(fact.value)} × ${parseEducationalPrice(priceInput).normalized}</p>
            <p><span>Derived result</span>{calculation.exactDollars}</p>
          </div>
        ) : null}
      </section>

      <section className={styles.boundaries} aria-labelledby="market-cap-boundaries-heading">
        <h3 id="market-cap-boundaries-heading">What this scenario does—and does not—say</h3>
        <ul>
          <li>The share count is company-reported and reviewed; the price is your local input.</li>
          <li>The result is not Apple-reported, not current market data, and not a verified market-price observation.</li>
          <li>The input does not persist: navigation or refresh starts a fresh scenario.</li>
          <li>If shares stay fixed and price per share doubles, the hypothetical Market Cap doubles.</li>
          <li>A real point-in-time market value would require a verified market price aligned to the same date.</li>
          <li>Do not substitute the weighted-average Basic or Diluted EPS denominator for this instant share count.</li>
        </ul>
      </section>

      <SharesOutstandingEvidenceInspector response={response} />

      <section className={styles.completion} aria-labelledby="market-cap-completion-heading">
        <div>
          <p className="eyebrow">Complete the scenario</p>
          <h3 id="market-cap-completion-heading">Keep reported, learner-entered and derived values distinct.</h3>
          <p>Calculating alone does not write progress.</p>
        </div>
        <button disabled={!calculation || finished} onClick={() => {
          markExplored(["market-cap"]);
          setFinished(true);
        }} type="button">{finished ? "Lesson explored" : "I understand this hypothetical result"}</button>
      </section>
    </article>
  );
}
