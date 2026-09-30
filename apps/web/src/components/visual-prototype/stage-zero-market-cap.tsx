"use client";

import { useState, type FormEvent } from "react";

import type { CompanySharesOutstanding } from "@/lib/api";
import {
  calculateEducationalMarketCap,
  formatEducationalMarketCapScale,
  MarketCapLearningError,
  parseEducationalPrice,
  type EducationalMarketCap,
} from "@/lib/market-cap-learning";

import styles from "./visual-prototype.module.css";

type StageZeroMarketCapProps = {
  response: CompanySharesOutstanding;
};

const exactInteger = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function StageZeroMarketCap({ response }: StageZeroMarketCapProps) {
  const { fact } = response;
  const [priceInput, setPriceInput] = useState("");
  const [calculation, setCalculation] = useState<EducationalMarketCap | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      parseEducationalPrice(priceInput);
      setCalculation(calculateEducationalMarketCap(fact.value, priceInput));
      setInputError(null);
    } catch (error) {
      setCalculation(null);
      setInputError(
        error instanceof MarketCapLearningError
          ? error.message
          : "Enter a valid imaginary price.",
      );
    }
  }

  const normalizedPrice = calculation
    ? parseEducationalPrice(priceInput).normalized
    : null;

  return (
    <div className={styles.sandboxCanvas}>
      <div className={styles.lessonTopline}>
        <span>Learn</span>
        <span aria-hidden="true">›</span>
        <span>Valuation</span>
        <span aria-hidden="true">›</span>
        <strong>Lesson 12 of 15</strong>
      </div>

      <header className={styles.sandboxHeading}>
        <div>
          <p className={styles.kicker}>Learning Sandbox</p>
          <h1>Market Cap</h1>
          <p>
            Combine one reviewed company fact with a price you invent, then see
            what the relationship means.
          </p>
        </div>
        <aside>
          <strong>This is not Apple market data</strong>
          <p>No price provider or current market value is connected here.</p>
        </aside>
      </header>

      <section className={styles.sandboxFormula} aria-labelledby="sandbox-formula-heading">
        <div className={styles.sandboxFormulaIntro}>
          <p className={styles.kicker}>One relationship, three different roles</p>
          <h2 id="sandbox-formula-heading">
            What would all reported shares be worth at your imaginary price?
          </h2>
          <p>
            Market Cap = shares outstanding × price per share. Only the share
            count below comes from Apple&apos;s filing.
          </p>
        </div>

        <form className={styles.sandboxEquation} noValidate onSubmit={calculate}>
          <article className={styles.sandboxReported}>
            <div className={styles.sandboxRole}>
              <span>01</span>
              <strong>Reported SEC shares</strong>
            </div>
            <p>{fact.reportedLabel}</p>
            <strong className={styles.sandboxValue}>
              {exactInteger.format(fact.value)}
              <small> shares</small>
            </strong>
            <dl>
              <div>
                <dt>As of</dt>
                <dd>{formatDate(fact.asOfDate)}</dd>
              </div>
              <div>
                <dt>Record</dt>
                <dd>FY{fact.fiscalYear} · SEC {fact.form}</dd>
              </div>
            </dl>
            <a href={fact.sourceUrl} rel="noreferrer" target="_blank">
              Open official filing <span aria-hidden="true">↗</span>
            </a>
          </article>

          <span className={styles.sandboxOperator} aria-hidden="true">×</span>

          <article className={styles.sandboxInput}>
            <div className={styles.sandboxRole}>
              <span>02</span>
              <strong>Learner input</strong>
            </div>
            <label htmlFor="prototype-imaginary-price">Your imaginary price</label>
            <div className={styles.sandboxPriceField}>
              <span aria-hidden="true">$</span>
              <input
                aria-describedby={
                  inputError
                    ? "prototype-price-boundary prototype-price-error"
                    : "prototype-price-boundary"
                }
                id="prototype-imaginary-price"
                inputMode="decimal"
                min="0.01"
                onChange={(event) => {
                  setPriceInput(event.target.value);
                  setCalculation(null);
                  setInputError(null);
                }}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={priceInput}
              />
            </div>
            <p className={styles.sandboxWarning} id="prototype-price-boundary">
              This is not Apple market data. Enter a positive learning value
              with no more than two decimal places.
            </p>
            {inputError ? (
              <p className={styles.sandboxError} id="prototype-price-error" role="alert">
                {inputError}
              </p>
            ) : null}
            <button type="submit">Calculate educational Market Cap</button>
          </article>

          <span className={styles.sandboxOperator} aria-hidden="true">=</span>

          <article className={styles.sandboxDerived} aria-live="polite">
            <div className={styles.sandboxRole}>
              <span>03</span>
              <strong>FinPath-derived educational Market Cap</strong>
            </div>
            {calculation && normalizedPrice ? (
              <>
                <p>At your imaginary ${normalizedPrice} price</p>
                <strong className={styles.sandboxResult}>
                  {formatEducationalMarketCapScale(calculation.marketCapCents)}
                </strong>
                <p className={styles.sandboxExact}>{calculation.exactDollars} exact</p>
                <div className={styles.sandboxTrace}>
                  <span>{exactInteger.format(fact.value)} reported shares</span>
                  <b aria-hidden="true">×</b>
                  <span>${normalizedPrice} learner input</span>
                </div>
              </>
            ) : (
              <div className={styles.sandboxEmptyResult}>
                <span aria-hidden="true">?</span>
                <p>Your educational result appears after you calculate.</p>
              </div>
            )}
            <small>
              A derived learning result—not a reported Apple figure and not a
              verified market observation.
            </small>
          </article>
        </form>
      </section>

      <aside className={styles.sandboxBoundary}>
        <p className={styles.kicker}>Keep the boundary clear</p>
        <h2>One input is reported. One is imaginary. The result is derived.</h2>
        <p>
          A real market snapshot would require a verified price aligned to the
          same date as the share count. This Stage 0 prototype does not supply one.
        </p>
      </aside>
    </div>
  );
}
