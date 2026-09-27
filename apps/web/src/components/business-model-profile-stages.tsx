import { BusinessModelEvidence } from "@/components/business-model-evidence";
import type { BusinessModelProfile } from "@/content/business-models/types";

import styles from "./business-model-learning.module.css";

type Props = {
  profile: BusinessModelProfile;
  reveal: (stage: number) => void;
  visibleStage: number;
};

function evidenceIdsFor(
  items: readonly { evidenceIds: readonly string[] }[],
): string[] {
  return [...new Set(items.flatMap((item) => item.evidenceIds))];
}

function ContinueButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className={styles.continueButton} onClick={onClick} type="button">
      {label} <span aria-hidden="true">→</span>
    </button>
  );
}

export function BusinessModelProfileStages({ profile, reveal, visibleStage }: Props) {
  const { businessStructure, customersOrUsers, moneyPaths, offerings } = profile;

  return (
    <>
      {visibleStage >= 2 ? (
        <li className={styles.stage} data-current={visibleStage === 2}>
          <p className={styles.stageNumber}>02 · What does this company offer?</p>
          <h3>{profile.company.name} combines several meaningful offering groups.</h3>
          <div className={styles.itemGrid}>
            {offerings.map((item) => (
              <article key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <BusinessModelEvidence
            evidenceIds={evidenceIdsFor(offerings)}
            profile={profile}
          />
          <ContinueButton label="See who pays" onClick={() => reveal(3)} />
        </li>
      ) : null}

      {visibleStage >= 3 ? (
        <li className={styles.stage} data-current={visibleStage === 3}>
          <p className={styles.stageNumber}>03 · Who pays?</p>
          <h3>One company can serve several paying counterparties.</h3>
          <div className={styles.counterpartyList}>
            {customersOrUsers.map((item) => (
              <article key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <BusinessModelEvidence
            evidenceIds={evidenceIdsFor(customersOrUsers)}
            profile={profile}
          />
          <ContinueButton label="Follow the money paths" onClick={() => reveal(4)} />
        </li>
      ) : null}

      {visibleStage >= 4 ? (
        <li className={styles.stage} data-current={visibleStage === 4}>
          <p className={styles.stageNumber}>04 · How does money reach the company?</p>
          <h3>Different exchanges can all produce Revenue.</h3>
          <div className={styles.moneyPaths}>
            {moneyPaths.map((path) => (
              <article key={path.id}>
                <div><span>Who pays</span><strong>{path.payer}</strong></div>
                <span className={styles.pathArrow} aria-hidden="true">→</span>
                <div><span>What they receive</span><strong>{path.receives}</strong></div>
                <p>{path.mechanism}</p>
              </article>
            ))}
          </div>
          <p className={styles.learningTrace}>
            <strong>Learning Trace:</strong> Two companies can both report Revenue
            while earning it through very different mechanisms.
          </p>
          <BusinessModelEvidence
            evidenceIds={evidenceIdsFor(moneyPaths)}
            profile={profile}
          />
          <ContinueButton label="See how the business is organized" onClick={() => reveal(5)} />
        </li>
      ) : null}

      {visibleStage >= 5 ? (
        <li className={styles.stage} data-current={visibleStage === 5}>
          <p className={styles.stageNumber}>05 · Business structure is not one universal template</p>
          <h3>{businessStructure.heading}</h3>
          <p className={styles.stageIntro}>{businessStructure.explanation}</p>
          <div className={styles.structureList}>
            {businessStructure.groups.map((group) => (
              <article key={group.id}>
                <h4>{group.title}</h4>
                <p>{group.description}</p>
              </article>
            ))}
          </div>
          <p className={styles.boundary}>{businessStructure.boundary}</p>
          <BusinessModelEvidence
            evidenceIds={evidenceIdsFor(businessStructure.groups)}
            profile={profile}
          />
          <ContinueButton label="Connect the business back to the numbers" onClick={() => reveal(6)} />
        </li>
      ) : null}
    </>
  );
}
