"use client";

import { useState } from "react";

import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import styles from "@/components/pe-ratio-learning.module.css";
import type { CompanyEarningsPerShare } from "@/lib/api";
import {
  calculateEducationalPe,
  PeRatioLearningError,
  type EducationalPe,
} from "@/lib/pe-ratio-learning";

type Props = { response: CompanyEarningsPerShare };

export function PeRatioLearning({ response }: Props) {
  const { markExplored } = useLearningProgress();
  const [priceInput, setPriceInput] = useState("");
  const [calculation, setCalculation] = useState<EducationalPe | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const { company, statement } = response;

  const calculate = (input: string) => {
    try {
      setCalculation(calculateEducationalPe(input, statement.dilutedEps.value));
      setInputError(null);
      setFinished(false);
    } catch (error) {
      setCalculation(null);
      setInputError(
        error instanceof PeRatioLearningError || error instanceof Error
          ? error.message
          : "Enter a valid educational price.",
      );
    }
  };

  return (
    <article className={styles.lesson} aria-labelledby="pe-question">
      <header className={styles.introduction}>
        <p className="eyebrow">Price-to-earnings ratio lens</p>
        <h2 id="pe-question">What does a P/E ratio compare?</h2>
        <p>
          Put one hypothetical price per share over one reviewed annual earnings
          per share amount. The result says only how those two inputs compare.
        </p>
      </header>

      <section className={styles.ratioLens} aria-labelledby="pe-ratio-lens-heading">
        <header>
          <p className="eyebrow">One numerator · one stated denominator</p>
          <h3 id="pe-ratio-lens-heading">Price per share ÷ Annual Diluted EPS = Hypothetical P/E</h3>
        </header>

        <div className={styles.fraction}>
          <section className={styles.price} aria-labelledby="pe-price-heading">
            <span className={styles.provenance}>Learner input / hypothetical</span>
            <h4 id="pe-price-heading">Price per share</h4>
            <label htmlFor="pe-educational-price">Educational price</label>
            <div className={styles.priceField}>
              <span aria-hidden="true">$</span>
              <input
                aria-describedby={inputError ? "pe-price-help pe-price-error" : "pe-price-help"}
                id="pe-educational-price"
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
            <small id="pe-price-help">Local educational input · not verified market data</small>
            <div className={styles.actions}>
              <button onClick={() => calculate(priceInput)} type="button">Calculate ratio</button>
              <button onClick={() => {
                setPriceInput("100.00");
                calculate("100.00");
              }} type="button">Try a $100.00 educational example</button>
            </div>
            {inputError ? <p id="pe-price-error" role="alert">{inputError}</p> : null}
          </section>

          <div className={styles.fractionRule} aria-hidden="true"><span>÷</span></div>

          <section className={styles.eps} aria-labelledby="pe-eps-heading">
            <span className={styles.provenance}>Reported / reviewed</span>
            <h4 id="pe-eps-heading">Annual Diluted EPS</h4>
            <strong>${statement.dilutedEps.value}</strong>
            <small>{company.name} · FY{statement.fiscalYear} · company-reported</small>
          </section>
        </div>

        <section className={styles.result} aria-labelledby="pe-result-heading">
          <span className={styles.provenance}>FinPath-derived scenario</span>
          <h4 id="pe-result-heading">Educational P/E at your price</h4>
          {calculation ? (
            <>
              <strong>{calculation.displayRatio}</strong>
              <p>
                ${calculation.normalizedPrice} learner price ÷ ${calculation.normalizedEps}
                {" "}reported annual Diluted EPS.
              </p>
            </>
          ) : (
            <p>Enter a hypothetical price to derive the comparison.</p>
          )}
        </section>
      </section>

      <section className={styles.boundaries} aria-labelledby="pe-boundaries-heading">
        <h3 id="pe-boundaries-heading">Interpret the multiple without turning it into a verdict</h3>
        <ul>
          <li>FinPath simple annual P/E uses your educational price per share and company-reported Diluted EPS.</li>
          <li>The result is not Apple-reported and not a current, TTM, or Forward P/E.</li>
          <li>The input does not persist: navigation or refresh starts a fresh scenario.</li>
          <li>A higher result is not automatically expensive or bad; a lower result is not automatically cheap or good.</li>
          <li>The multiple does not mean guaranteed payback years or promise future earnings.</li>
          <li>If price doubles while EPS stays fixed, the hypothetical P/E doubles.</li>
          <li>Zero EPS makes the ratio undefined. Negative EPS is not converted into a conventional positive multiple.</li>
        </ul>
      </section>

      <EpsEvidenceInspector basis="diluted" response={response} />

      <details className={styles.references}>
        <summary>Teaching references</summary>
        <ul>
          <li><a href="https://www.investor.gov/introduction-investing/investing-basics/glossary/price-earnings-pe-ratio" rel="noreferrer" target="_blank">Investor.gov — Price-earnings ratio</a></li>
          <li><a href="https://www.finra.org/investors/investing/investment-products/stocks/evaluating-stocks" rel="noreferrer" target="_blank">FINRA — Evaluating Stocks</a></li>
        </ul>
      </details>

      <section className={styles.completion} aria-labelledby="pe-completion-heading">
        <div>
          <p className="eyebrow">Complete the comparison</p>
          <h3 id="pe-completion-heading">Keep learner price, reported EPS and derived ratio distinct.</h3>
          <p>Calculating alone does not write progress.</p>
        </div>
        <button disabled={!calculation || finished} onClick={() => {
          markExplored(["pe-ratio"]);
          setFinished(true);
        }} type="button">{finished ? "Lesson explored" : "I understand this hypothetical ratio"}</button>
      </section>
    </article>
  );
}
