"use client";

import { useState } from "react";

import { useLearningProgress } from "@/components/learning-progress-provider";
import { SharesOutstandingEvidenceInspector } from "@/components/shares-outstanding-evidence-inspector";
import type { CompanySharesOutstanding } from "@/lib/api";
import {
  calculateEducationalMarketCap,
  formatEducationalMarketCapScale,
  MarketCapLearningError,
  parseEducationalPrice,
  type EducationalMarketCap,
} from "@/lib/market-cap-learning";

type Props = {
  response: CompanySharesOutstanding;
};

const exactInteger = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function ContinueButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="eps-continue" onClick={onClick} type="button">
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}

export function MarketCapLearning({ response }: Props) {
  const { markExplored } = useLearningProgress();
  const [visibleStage, setVisibleStage] = useState(1);
  const [priceInput, setPriceInput] = useState("");
  const [calculation, setCalculation] = useState<EducationalMarketCap | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [doubleAnswer, setDoubleAnswer] = useState<"double" | "same" | "half" | null>(null);
  const [shareAnswer, setShareAnswer] = useState<"instant" | "weighted" | null>(null);
  const [sourceAnswer, setSourceAnswer] = useState<"no" | "yes" | null>(null);
  const [finished, setFinished] = useState(false);
  const { company, fact } = response;

  const reveal = (stage: number) => {
    setVisibleStage((current) => Math.max(current, stage));
  };

  const calculate = (input: string) => {
    try {
      parseEducationalPrice(input);
      setCalculation(calculateEducationalMarketCap(fact.value, input));
      setInputError(null);
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
    <article className="eps-lesson market-cap-lesson" aria-labelledby="market-cap-question">
      <header className="eps-lesson__hero">
        <p className="eyebrow">From one share to the whole equity value</p>
        <h2 id="market-cap-question">
          A share has a price. What would all outstanding shares be worth at that price?
        </h2>
        <p>
          EPS asked about earnings per share. Market Cap asks about all
          outstanding common shares at a given price per share.
        </p>
      </header>

      <ol className="eps-stages" aria-label="Market Cap learning stages">
        <li className="eps-stage" data-active={visibleStage === 1}>
          <p className="eps-stage__number">01 · From one share to the whole equity value</p>
          <h3>Start with one relationship.</h3>
          <div className="market-cap-formula" aria-label="Market Cap formula">
            <span>Shares outstanding</span>
            <b aria-hidden="true">×</b>
            <span>Price per share</span>
            <b aria-hidden="true">=</b>
            <strong>Market Cap</strong>
          </div>
          <p>
            This relationship describes the market value of all outstanding
            common shares at that price. It does not judge the company or the stock.
          </p>
          <ContinueButton onClick={() => reveal(2)}>Choose the right share count</ContinueButton>
        </li>

        {visibleStage >= 2 ? (
          <li className="eps-stage" data-active={visibleStage === 2}>
            <p className="eps-stage__number">02 · Which share count?</p>
            <h3>{fact.reportedLabel}</h3>
            <strong className="eps-stage__figure market-cap-share-count">
              {exactInteger.format(fact.value)}
              <small>shares</small>
            </strong>
            <p>As of {formatDate(fact.asOfDate)}</p>
            <dl className="market-cap-share-contrast">
              <div>
                <dt>EPS</dt>
                <dd>Weighted-average shares over a reporting period.</dd>
              </div>
              <div>
                <dt>Market Cap</dt>
                <dd>Point-in-time shares outstanding at one date.</dd>
              </div>
            </dl>
            <p className="learning-trace eps-learning-trace">
              Do not use the weighted-average Basic or Diluted EPS denominator
              as if it were the point-in-time Market Cap share count.
            </p>
            <SharesOutstandingEvidenceInspector response={response} />
            <ContinueButton onClick={() => reveal(3)}>Try the formula</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 3 ? (
          <li className="eps-stage" data-active={visibleStage === 3}>
            <p className="eps-stage__number">03 · Try the formula</p>
            <h3>Use an educational price—not supplied market data.</h3>
            <div className="market-cap-calculator">
              <div className="market-cap-calculator__reported">
                <span>SEC-reported shares outstanding</span>
                <strong>{exactInteger.format(fact.value)}</strong>
              </div>
              <span className="market-cap-calculator__operator" aria-hidden="true">×</span>
              <div className="market-cap-price-field">
                <label htmlFor="educational-price">Educational price per share</label>
                <span>
                  <b aria-hidden="true">$</b>
                  <input
                    aria-describedby={
                      inputError
                        ? "educational-price-help educational-price-error"
                        : "educational-price-help"
                    }
                    id="educational-price"
                    inputMode="decimal"
                    onChange={(event) => {
                      setPriceInput(event.target.value);
                      setCalculation(null);
                      setInputError(null);
                    }}
                    placeholder="0.00"
                    type="text"
                    value={priceInput}
                  />
                </span>
                <small id="educational-price-help">Educational input — not verified market data</small>
              </div>
              <div className="market-cap-calculator__actions">
                <button onClick={() => calculate(priceInput)} type="button">Calculate</button>
                <button
                  className="market-cap-example"
                  onClick={() => {
                    setPriceInput("100.00");
                    calculate("100.00");
                  }}
                  type="button"
                >
                  Try a $100.00 educational example
                </button>
              </div>
            </div>
            {inputError ? <p className="market-cap-input-error" id="educational-price-error" role="alert">{inputError}</p> : null}
            {calculation ? (
              <div className="market-cap-result" role="status">
                <p className="eyebrow">Educational Market Cap at your price</p>
                <strong>{formatEducationalMarketCapScale(calculation.marketCapCents)}</strong>
                <p>This is a learning calculation using your price input, not a verified market-price observation.</p>
                <div className="market-cap-learning-trace">
                  <p><span>Input A</span> Company-reported SEC shares</p>
                  <p><span>Input B</span> Learner-entered educational price: ${parseEducationalPrice(priceInput).normalized}</p>
                  <p><span>Exact multiplication</span> {exactInteger.format(fact.value)} × ${parseEducationalPrice(priceInput).normalized}</p>
                  <p><span>FinPath educational calculation</span> {calculation.exactDollars}</p>
                  <small>The readable headline is rounded; the exact dollar result is shown in this trace.</small>
                </div>
              </div>
            ) : null}
            {calculation ? <ContinueButton onClick={() => reveal(4)}>See what changes the result</ContinueButton> : null}
          </li>
        ) : null}

        {visibleStage >= 4 ? (
          <li className="eps-stage" data-active={visibleStage === 4}>
            <p className="eps-stage__number">04 · Price changes the equity value</p>
            <h3>If shares outstanding stay the same and price per share doubles, what happens to Market Cap?</h3>
            <div className="eps-choice-group eps-choice-group--three" role="group" aria-label="What happens to Market Cap when price doubles?">
              <button aria-pressed={doubleAnswer === "double"} onClick={() => setDoubleAnswer("double")} type="button">Market Cap doubles</button>
              <button aria-pressed={doubleAnswer === "same"} onClick={() => setDoubleAnswer("same")} type="button">It stays the same</button>
              <button aria-pressed={doubleAnswer === "half"} onClick={() => setDoubleAnswer("half")} type="button">It halves</button>
            </div>
            {doubleAnswer ? (
              <div className="eps-feedback" role="status">
                <strong>{doubleAnswer === "double" ? "That’s the relationship." : "Try the multiplication again."}</strong>{" "}
                With the share count unchanged, doubling price doubles Market Cap.
                Market Cap can change when price changes or shares outstanding change.
              </div>
            ) : null}
            {doubleAnswer ? <ContinueButton onClick={() => reveal(5)}>Why the date matters</ContinueButton> : null}
          </li>
        ) : null}

        {visibleStage >= 5 ? (
          <li className="eps-stage" data-active={visibleStage === 5}>
            <p className="eps-stage__number">05 · Date matters</p>
            <h3>Real inputs must describe the same date.</h3>
            <dl className="market-cap-date-boundary">
              <div><dt>Reviewed SEC shares date</dt><dd>{formatDate(fact.asOfDate)}</dd></div>
              <div><dt>Your lesson price</dt><dd>No verified date</dd></div>
            </dl>
            <p>
              FinPath has not supplied a verified market price for this date in
              this lesson. Your price is an educational input.
            </p>
            <p className="learning-trace eps-learning-trace">
              A real Market Cap snapshot requires reviewed shares and a verified market price aligned to the same date.
            </p>
            <ContinueButton onClick={() => reveal(6)}>Keep the boundaries clear</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 6 ? (
          <li className="eps-stage" data-active={visibleStage === 6}>
            <p className="eps-stage__number">06 · What Market Cap is not</p>
            <h3>Equity value is not the same as company performance or resources.</h3>
            <ul className="eps-boundaries">
              <li>Market Cap is not Revenue or Net Income.</li>
              <li>Market Cap is not Cash or Total Assets.</li>
              <li>Market Cap is not Enterprise Value.</li>
              <li>Market Cap alone does not say whether a stock is cheap or expensive.</li>
              <li>A larger or smaller Market Cap does not automatically mean a better or worse company.</li>
              <li>This calculation is not a recommendation.</li>
            </ul>
            <ContinueButton onClick={() => reveal(7)}>Check the distinction</ContinueButton>
          </li>
        ) : null}

        {visibleStage >= 7 ? (
          <li className="eps-stage eps-stage--final" data-active={!finished}>
            <p className="eps-stage__number">07 · Check the distinction</p>
            <h3>Which share count belongs in this Market Cap formula?</h3>
            <div className="eps-choice-group" role="group" aria-label="Which share count belongs in Market Cap?">
              <button aria-pressed={shareAnswer === "instant"} onClick={() => setShareAnswer("instant")} type="button">Point-in-time shares outstanding</button>
              <button aria-pressed={shareAnswer === "weighted"} onClick={() => setShareAnswer("weighted")} type="button">Weighted-average Basic EPS shares</button>
            </div>
            {shareAnswer ? (
              <div className="eps-feedback" role="status">
                <strong>{shareAnswer === "instant" ? "Right." : "Not for this formula."}</strong>{" "}
                Market Cap uses shares outstanding at a point in time.
              </div>
            ) : null}

            <h3>Is the price you entered verified market data from FinPath?</h3>
            <div className="eps-choice-group" role="group" aria-label="Is the lesson price verified market data?">
              <button aria-pressed={sourceAnswer === "no"} onClick={() => setSourceAnswer("no")} type="button">No</button>
              <button aria-pressed={sourceAnswer === "yes"} onClick={() => setSourceAnswer("yes")} type="button">Yes</button>
            </div>
            {sourceAnswer ? (
              <div className="eps-feedback" role="status">
                <strong>{sourceAnswer === "no" ? "Correct." : "Look at the source labels again."}</strong>{" "}
                The price came from you; FinPath did not observe or verify it.
              </div>
            ) : null}

            {shareAnswer && sourceAnswer ? (
              <button
                className="eps-finish"
                disabled={finished}
                onClick={() => {
                  markExplored(["market-cap"]);
                  setFinished(true);
                }}
                type="button"
              >
                {finished ? "Lesson explored" : "Finish lesson"}
              </button>
            ) : null}
          </li>
        ) : null}
      </ol>
    </article>
  );
}
