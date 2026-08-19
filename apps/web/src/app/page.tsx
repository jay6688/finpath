import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="home-intro" aria-labelledby="home-heading">
        <p className="eyebrow">Your first company</p>
        <h1 id="home-heading">Learn one real financial number without getting lost.</h1>
        <p className="home-intro__copy">
          Start with Apple&apos;s Revenue. See the original reporting period, follow the source,
          and learn what the number does—and does not—tell you.
        </p>
      </section>

      <section className="next-step" aria-labelledby="next-step-heading">
        <div className="next-step__index" aria-hidden="true">
          01
        </div>
        <div className="next-step__body">
          <p className="eyebrow">Your next step</p>
          <h2 id="next-step-heading">Explore our first company</h2>
          <div className="company-identity">
            <span className="company-identity__monogram" aria-hidden="true">
              A
            </span>
            <div>
              <strong>Apple Inc.</strong>
              <span>AAPL · Nasdaq</span>
            </div>
          </div>
          <p className="support-note">
            V0 currently guarantees Apple/AAPL only. Full company search will come after a
            second company proves the data pipeline generalizes.
          </p>
          <Link className="primary-action" href="/company/aapl">
            Explore Apple
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <aside className="promise-strip" aria-label="FinPath product promise">
        <span>Real filing</span>
        <span>Visible period</span>
        <span>Plain-language explanation</span>
        <span>No buy or sell call</span>
      </aside>
    </div>
  );
}

