import { RevenueMetricSnapshot } from "@/components/revenue-metric-snapshot";
import revenueConcept from "@/content/concepts/revenue.json";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";

export function RevenueLessonContent(props: CompanyRevenueData) {
  const english = revenueConcept.locales.en;

  return (
    <section className="research-grid lesson-revenue-grid" aria-labelledby="lesson-revenue-heading">
      <div className="metric-column">
        <RevenueMetricSnapshot {...props} headingId="lesson-revenue-heading" />
        <div className="learning-trace">
          <span aria-hidden="true" />
          <p>
            <strong>This number</strong> is linked to its filing and explained
            before you use it in the next lesson.
          </p>
        </div>
      </div>

      <aside className="learning-margin" aria-labelledby="learning-heading">
        <header className="learning-margin__header">
          <span aria-hidden="true" />
          <div>
            <p className="eyebrow">Learning margin</p>
            <h2 id="learning-heading">Understand the number</h2>
          </div>
        </header>

        <section className="learning-section learning-section--essential">
          <h3>{english.title}</h3>
          <p>{english.simpleDefinition}</p>
        </section>
        <section className="learning-section learning-section--essential">
          <h3>Why this matters</h3>
          <p>{english.whyItMatters}</p>
        </section>
        <section className="learning-section learning-section--essential">
          <h3>What it cannot tell you</h3>
          <p>{english.limitation}</p>
        </section>
        <details className="learning-section">
          <summary>Revenue vs Profit</summary>
          <p>{english.comparison}</p>
        </details>
        <details className="learning-section">
          <summary>中文解释</summary>
          <p lang="zh-CN">{revenueConcept.locales["zh-CN"].simpleDefinition}</p>
        </details>
        <details className="learning-section teaching-sources">
          <summary>Teaching sources</summary>
          <ul>
            {revenueConcept.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} rel="noreferrer" target="_blank">
                  {source.title}
                </a>
                <span>{source.publisher}</span>
              </li>
            ))}
          </ul>
        </details>
      </aside>
    </section>
  );
}
