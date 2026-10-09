# FinPath Production V2

Released from `design/production-v2-release-candidate` at
`9e1bf578d12e45013fef89cc2f83132ccb58c8c2` and integrated into `main` by
merge commit `6db9998b1606cad544e854b956d14803bf401ae8`.

## Release summary

- Redesigned the Home, Learn, and Explore architecture.
- Migrated all 15 canonical Learn lessons to beginner-first teaching grammars.
- Preserved truthful quantitative encoding and explicit Reported, Derived,
  Learner Scenario, Learner Judgment, and Unknown boundaries.
- Added reviewed Business Model Revenue Origin Traces and a learner-owned
  Capstone Evidence Casebook.
- Generates no automated investment recommendation.

## Validation

- Manual physical-keyboard activation passed for representative native
  controls, disclosures, radio navigation, inputs, Capstone controls, forward
  and reverse focus navigation, visible focus, trap avoidance, and progress
  isolation.
- Web tests: 191 passed.
- Backend tests: 182 passed; 2 intentionally live tests deselected.
- TypeScript, Next.js route generation, production build, and `git diff
  --check`: passed.
- Local browser smoke: Home, Learn, Explore, AAPL research, and all 15 lesson
  routes passed at 1440px and 390px with one H1, no page-level horizontal
  overflow, and no console warnings or errors.

This release is not a formal WCAG or screen-reader certification.

## Post-release validation backlog

- Formal screen-reader certification.
- A real beginner usability study.
- Formal Core Web Vitals profiling.

These items are validation backlog, not confirmed product defects.
