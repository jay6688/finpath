import contextContent from "@/content/company-context/aapl-revenue-fy2023.json";

export function RevenueHistoryContext() {
  const source = contextContent.sources[0];

  return (
    <section className="history-context" aria-labelledby="history-context-label">
      <p className="eyebrow" id="history-context-label">
        Optional company context
      </p>

      <details>
        <summary>{contextContent.trigger}</summary>
        <div className="history-context__body">
          <section>
            <p className="history-context__label">Apple reported</p>
            {contextContent.reportedContext.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section>
            <p className="history-context__label">FinPath learning takeaway</p>
            <p>
              <strong>{contextContent.takeaway}</strong>{" "}
              {contextContent.interpretation}
            </p>
          </section>

          <section>
            <p className="history-context__label">What the annual totals cannot show</p>
            <p>{contextContent.limitation}</p>
          </section>

          <footer className="history-context__source">
            <a href={source.url} rel="noreferrer" target="_blank">
              Read Apple’s FY2023 Form 10-K on SEC.gov ↗
            </a>
            <small>
              {source.location} · filed {source.filedAt}
            </small>
          </footer>
        </div>
      </details>
    </section>
  );
}
