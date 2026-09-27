import type {
  BusinessModelProfile,
  ReviewedNarrativeEvidence,
} from "@/content/business-models/types";

import styles from "./business-model-learning.module.css";

type Props = {
  evidenceIds: readonly string[];
  profile: BusinessModelProfile;
};

function findEvidence(
  profile: BusinessModelProfile,
  evidenceIds: readonly string[],
): ReviewedNarrativeEvidence[] {
  const requested = new Set(evidenceIds);
  const found = profile.evidence.filter((item) => requested.has(item.id));
  if (found.length !== requested.size) {
    throw new Error(`Reviewed narrative evidence is incomplete for ${profile.company.ticker}.`);
  }
  return found;
}

export function BusinessModelEvidence({ evidenceIds, profile }: Props) {
  const evidence = findEvidence(profile, evidenceIds);
  const sections = [...new Set(evidence.map((item) => item.section))];

  return (
    <details className={styles.evidence}>
      <summary>
        Reviewed source <span>· {sections.join(" + ")}</span>
      </summary>
      <div className={styles.evidenceBody}>
        <p className={styles.evidenceType}>SEC filing narrative · FinPath paraphrase</p>
        <ul>
          {evidence.map((item) => (
            <li key={item.id}>
              <strong>{item.topic}</strong>
              <span>{item.paraphrasedFinding}</span>
            </li>
          ))}
        </ul>
        <dl>
          <div><dt>Company</dt><dd>{profile.company.name} · {profile.company.ticker}</dd></div>
          <div><dt>Filing</dt><dd>FY{profile.filing.fiscalYear} · Form {profile.filing.form}</dd></div>
          <div><dt>Filed</dt><dd>{profile.filing.filedAt}</dd></div>
          <div><dt>Accession</dt><dd>{profile.filing.accession}</dd></div>
        </dl>
        <a href={profile.filing.sourceUrl} rel="noreferrer" target="_blank">
          Open SEC filing index ↗
        </a>
        <p className={styles.evidenceBoundary}>
          FinPath reviewed and paraphrased these filing sections. This is not a
          filing screenshot, page locator, XBRL fact or investment judgment.
        </p>
      </div>
    </details>
  );
}
