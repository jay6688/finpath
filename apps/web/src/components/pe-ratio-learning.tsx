"use client";

import { useState } from "react";

import { EpsEvidenceInspector } from "@/components/eps-evidence-inspector";
import { useLearningProgress } from "@/components/learning-progress-provider";
import type { CompanyEarningsPerShare } from "@/lib/api";
import {
  calculateEducationalPe,
  PeRatioLearningError,
  type EducationalPe,
} from "@/lib/pe-ratio-learning";

type Props = { response: CompanyEarningsPerShare };

function ContinueButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="eps-continue" onClick={onClick} type="button">
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}

export function PeRatioLearning({ response }: Props) {
  const { markExplored } = useLearningProgress();
  const [visibleStage, setVisibleStage] = useState(1);
  const [priceInput, setPriceInput] = useState("");
  const [calculation, setCalculation] = useState<EducationalPe | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [meaningAnswer, setMeaningAnswer] = useState<"multiple" | "payback" | null>(null);
  const [doubleAnswer, setDoubleAnswer] = useState<"double" | "same" | "half" | null>(null);
  const [finished, setFinished] = useState(false);
  const { company, statement } = response;

  const reveal = (stage: number) => setVisibleStage((current) => Math.max(current, stage));
  const resetDownstream = () => {
    setVisibleStage(3);
    setMeaningAnswer(null);
    setDoubleAnswer(null);
    setFinished(false);
  };
  const calculate = (input: string) => {
    try {
      resetDownstream();
      setCalculation(calculateEducationalPe(input, statement.dilutedEps.value));
      setInputError(null);
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
    <article className="eps-lesson pe-lesson" aria-labelledby="pe-question">
      <header className="eps-lesson__hero">
        <p className="eyebrow">From earnings per share to a price multiple</p>
        <h2 id="pe-question">What does a price say when you compare it with annual earnings per share?</h2>
        <p>
          P/E connects a price per share with earnings per share. In this lesson,
          you supply an educational price and FinPath uses the company&apos;s reviewed
          annual Diluted EPS.
        </p>
      </header>

      <ol className="eps-stages" aria-label="P/E Ratio learning stages">
        <li className="eps-stage" data-active={visibleStage === 1}>
          <p className="eps-stage__number">01 · Connect price and earnings</p>
          <h3>Two per-share figures form one ratio.</h3>
          <div className="market-cap-formula pe-formula" aria-label="P/E formula">
            <span>Price per share</span><b aria-hidden="true">÷</b>
            <span>Earnings per share</span><b aria-hidden="true">=</b>
            <strong>P/E Ratio</strong>
          </div>
          <p>
            FinPath simple annual P/E = educational price per share ÷
            company-reported Diluted EPS for the reviewed annual fiscal year.
          </p>
          <ContinueButton onClick={() => reveal(2)}>Choose the earnings basis</ContinueButton>
        </li>

        {visibleStage >= 2 ? (
          <li className="eps-stage" data-active={visibleStage === 2}>
            <p className="eps-stage__number">02 · Use one explicit earnings basis</p>
            <h3>Annual Diluted EPS: ${statement.dilutedEps.value} per share</h3>
            <p>
              {company.name} reported this Diluted EPS for FY{statement.fiscalYear}.
              FinPath uses it because the lesson must name its denominator instead
              of quietly mixing Basic EPS, another period, or an estimate.
            </p>
            <p className="learning-trace eps-learning-trace">
              <strong>Learning Trace:</strong> company-reported annual Diluted EPS →
              reviewed SEC filing → one stated lesson convention.
            </p>
            <EpsEvidenceInspector basis="diluted" response={response} />
            <ContinueButton onClick={() => reveal(3)}>Try an educational price</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 3 ? (
          <li className="eps-stage" data-active={visibleStage === 3}>
            <p className="eps-stage__number">03 · Calculate a simple annual P/E</p>
            <h3>Enter a price for learning—not a market observation.</h3>
            <div className="market-cap-calculator pe-calculator">
              <div className="market-cap-price-field">
                <label htmlFor="pe-educational-price">Educational price per share</label>
                <span><b aria-hidden="true">$</b><input
                  aria-describedby={inputError ? "pe-price-help pe-price-error" : "pe-price-help"}
                  id="pe-educational-price"
                  inputMode="decimal"
                  onChange={(event) => {
                    setPriceInput(event.target.value);
                    setCalculation(null);
                    setInputError(null);
                    resetDownstream();
                  }}
                  placeholder="0.00"
                  type="text"
                  value={priceInput}
                /></span>
                <small id="pe-price-help">Local educational input · not verified market data</small>
              </div>
              <span className="market-cap-calculator__operator" aria-hidden="true">÷</span>
              <div className="market-cap-calculator__reported">
                <span>Company-reported annual Diluted EPS</span>
                <strong>${statement.dilutedEps.value}</strong>
              </div>
              <div className="market-cap-calculator__actions">
                <button onClick={() => calculate(priceInput)} type="button">Calculate</button>
                <button className="market-cap-example" onClick={() => {
                  setPriceInput("100.00");
                  calculate("100.00");
                }} type="button">Try a $100.00 educational example</button>
              </div>
            </div>
            {inputError ? <p className="market-cap-input-error" id="pe-price-error" role="alert">{inputError}</p> : null}
            {calculation ? (
              <div className="market-cap-result pe-result" role="status">
                <p className="eyebrow">Educational P/E at your price</p>
                <strong>{calculation.displayRatio}</strong>
                <p>
                  This is a FinPath-derived learning result, not a current, TTM,
                  or Forward P/E.
                </p>
                <div className="market-cap-learning-trace">
                  <p><span>Input A</span> Learner-entered educational price: ${calculation.normalizedPrice}</p>
                  <p><span>Input B</span> Company-reported annual Diluted EPS: ${calculation.normalizedEps}</p>
                  <p><span>Exact relationship</span> {calculation.normalizedPrice} ÷ {calculation.normalizedEps}</p>
                  <p><span>Rounded display</span> {calculation.displayRatio} · positive half-up to 2 decimals</p>
                </div>
                <ContinueButton onClick={() => reveal(4)}>Interpret the multiple</ContinueButton>
              </div>
            ) : null}
          </li>
        ) : null}

        {visibleStage >= 4 && calculation ? (
          <li className="eps-stage" data-active={visibleStage === 4}>
            <p className="eps-stage__number">04 · Interpret, without overclaiming</p>
            <h3>At these two inputs, the price is {calculation.displayRatio} annual Diluted EPS.</h3>
            <p>
              The multiple compares one price input with one annual earnings basis.
              A {calculation.displayRatio} P/E does not mean {calculation.displayRatio.replace("×", "")} payback years.
              Earnings can change, and the ratio is not a repayment schedule.
            </p>
            <fieldset className="eps-check">
              <legend>What does this result directly tell you?</legend>
              <p>Choose one. This is practice, not a score.</p>
              <div className="eps-choice-group">
                <button aria-pressed={meaningAnswer === "multiple"} onClick={() => setMeaningAnswer("multiple")} type="button">Price relative to this annual Diluted EPS</button>
                <button aria-pressed={meaningAnswer === "payback"} onClick={() => setMeaningAnswer("payback")} type="button">Guaranteed years to earn the price back</button>
              </div>
            </fieldset>
            {meaningAnswer ? <p className="eps-feedback" role="status">{meaningAnswer === "multiple" ? "Right. P/E is a price-to-earnings multiple under the stated inputs." : "Not quite. P/E compares price with EPS; it does not promise a payback period."}</p> : null}
            {meaningAnswer ? <ContinueButton onClick={() => reveal(5)}>Test one change</ContinueButton> : null}
          </li>
        ) : null}

        {visibleStage >= 5 && calculation ? (
          <li className="eps-stage" data-active={visibleStage === 5}>
            <p className="eps-stage__number">05 · Hold EPS fixed</p>
            <h3>If the price doubles while Diluted EPS stays fixed, what happens to P/E?</h3>
            <div className="eps-choice-group eps-choice-group--three">
              {(["double", "same", "half"] as const).map((choice) => (
                <button aria-pressed={doubleAnswer === choice} key={choice} onClick={() => setDoubleAnswer(choice)} type="button">
                  {choice === "double" ? "P/E doubles" : choice === "same" ? "P/E stays the same" : "P/E halves"}
                </button>
              ))}
            </div>
            {doubleAnswer ? <p className="eps-feedback" role="status">{doubleAnswer === "double" ? "Right. With EPS fixed, doubling the numerator doubles the ratio." : "Try the formula again: the denominator is fixed while the price numerator doubles."}</p> : null}
            {doubleAnswer ? <ContinueButton onClick={() => reveal(6)}>Review the boundaries</ContinueButton> : null}
          </li>
        ) : null}

        {visibleStage >= 6 ? (
          <li className="eps-stage eps-stage--final" data-active={!finished}>
            <p className="eps-stage__number">06 · Evidence and limits</p>
            <h3>One ratio is a starting question, not an investment judgment.</h3>
            <ul className="eps-boundaries">
              <li>The price is your local educational input; FinPath did not fetch a market price.</li>
              <li>The denominator is company-reported annual Diluted EPS for one reviewed fiscal year.</li>
              <li>Different price dates, EPS periods, or P/E methodologies can produce different ratios.</li>
              <li>P/E alone cannot explain future earnings, business quality, risk, or what price is appropriate.</li>
            </ul>
            <details className="pe-references">
              <summary>Teaching references</summary>
              <p>Definitions reviewed against independent investor education sources:</p>
              <ul>
                <li><a href="https://www.investor.gov/introduction-investing/investing-basics/glossary/price-earnings-pe-ratio" rel="noreferrer" target="_blank">Investor.gov — Price-earnings (P/E) Ratio ↗</a></li>
                <li><a href="https://www.finra.org/investors/investing/investment-products/stocks/evaluating-stocks" rel="noreferrer" target="_blank">FINRA — Evaluating Stocks ↗</a></li>
              </ul>
            </details>
            <button className="eps-finish" disabled={finished} onClick={() => {
              markExplored(["pe-ratio"]);
              setFinished(true);
            }} type="button">{finished ? "Lesson explored" : "Finish lesson"}</button>
          </li>
        ) : null}
      </ol>
    </article>
  );
}
