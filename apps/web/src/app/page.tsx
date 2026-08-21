import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="home-intro" aria-labelledby="home-heading">
        <p className="eyebrow">Welcome to FinPath</p>
        <h1 id="home-heading">Learn finance one clear step at a time.</h1>
        <p className="home-intro__copy">
          You do not need to know every term yet. FinPath connects a real financial fact to a
          plain-language explanation and its original source.
        </p>
      </section>

      <section className="next-step" aria-labelledby="next-step-heading">
        <div className="next-step__index" aria-hidden="true">
          01
        </div>
        <div className="next-step__copy">
          <p className="eyebrow">Your next step · about 5 min</p>
          <h2 id="next-step-heading">What does Revenue mean?</h2>
          <p>
            Learn with Apple&apos;s FY2025 result, then see why Revenue is different from profit.
          </p>
          <Link className="primary-action" href="/company/aapl">
            Start with Apple
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="next-step__example">
          <span>Real example</span>
          <strong>Apple Inc.</strong>
          <p>
            <b>$416.2B</b> Revenue
          </p>
          <small>FY2025 · SEC 10-K</small>
        </div>
      </section>

      <section className="learning-loop" aria-labelledby="learning-loop-heading">
        <div className="learning-loop__heading">
          <p className="eyebrow">How FinPath teaches</p>
          <h2 id="learning-loop-heading">See it. Understand it. Verify it.</h2>
        </div>
        <ol>
          <li>
            <span aria-hidden="true">1</span>
            <div>
              <strong>See the fact</strong>
              <small>A real number from a real company</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <div>
              <strong>Learn the meaning</strong>
              <small>Simple explanation, context and limits</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <div>
              <strong>Check the source</strong>
              <small>The official filing behind the number</small>
            </div>
          </li>
        </ol>
      </section>

      <section className="available-now" aria-labelledby="available-now-heading">
        <div>
          <p className="eyebrow">Available now</p>
          <h2 id="available-now-heading">Explore the first complete learning record</h2>
          <p>
            FinPath currently supports Apple Revenue end to end. More companies and concepts
            will appear only when their data and explanations are ready.
          </p>
        </div>
        <Link href="/company/aapl">
          <span>
            <strong>Apple Inc.</strong>
            <small>AAPL · Company basics</small>
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </div>
  );
}
