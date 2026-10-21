import { useI18n, type MessageKey } from '../i18n';

interface Section {
  id: string;
  title: MessageKey;
  body: MessageKey[];
  formula?: string;
}

/** Formulas are notation, identical in both languages. */
const SECTIONS: Section[] = [
  { id: 'setup', title: 'methodology.setupTitle', body: ['methodology.setupBody'] },
  {
    id: 'selection',
    title: 'methodology.selectionTitle',
    body: ['methodology.selectionBody'],
    formula: 'SR(a) = P(Ŷ = 1 | A = a) = #{favorable in a} / #{a}',
  },
  {
    id: 'disparate-impact',
    title: 'methodology.diTitle',
    body: ['methodology.diBody'],
    formula: 'DI = min_a SR(a) / max_a SR(a)        flag if DI < 0.8',
  },
  {
    id: 'demographic-parity',
    title: 'methodology.dpTitle',
    body: ['methodology.dpBody'],
    formula: 'DPD = max_a SR(a) − min_a SR(a)      flag if DPD > 0.10',
  },
  {
    id: 'equal-opportunity',
    title: 'methodology.eoTitle',
    body: ['methodology.eoBody'],
    formula: 'TPR(a) = P(Ŷ = 1 | Y = 1, A = a)\nEOD = max_a TPR(a) − min_a TPR(a)',
  },
  {
    id: 'equalized-odds',
    title: 'methodology.eodTitle',
    body: ['methodology.eodBody'],
    formula: 'FPR(a) = P(Ŷ = 1 | Y = 0, A = a)\nEOdds = max( TPR gap, FPR gap )',
  },
  {
    id: 'predictive-parity',
    title: 'methodology.ppTitle',
    body: ['methodology.ppBody'],
    formula: 'PPV(a) = P(Y = 1 | Ŷ = 1, A = a)\nPPD = max_a PPV(a) − min_a PPV(a)',
  },
  {
    id: 'accuracy',
    title: 'methodology.accTitle',
    body: ['methodology.accBody'],
    formula: 'ACC(a) = P(Ŷ = Y | A = a)',
  },
  {
    id: 'uncertainty',
    title: 'methodology.ciTitle',
    body: ['methodology.ciBody'],
    formula: [
      'Wilson:   (p̂ + z²/2n ± z·√(p̂(1−p̂)/n + z²/4n²)) / (1 + z²/n),   z = 1.96',
      'Newcombe: d − √((p₁−l₁)² + (u₂−p₂)²)  …  d + √((u₁−p₁)² + (p₂−l₂)²)',
      'Katz:     exp( ln(p₁/p₂) ± z·√(1/k₁ − 1/n₁ + 1/k₂ − 1/n₂) )',
    ].join('\n'),
  },
  { id: 'verdicts', title: 'methodology.verdictTitle', body: ['methodology.verdictBody'] },
  {
    id: 'intersectional',
    title: 'methodology.intersectionalTitle',
    body: ['methodology.intersectionalBody'],
  },
  {
    id: 'deeper',
    title: 'methodology.deeperTitle',
    body: ['methodology.deeperBody1', 'methodology.deeperBody2', 'methodology.deeperBody3'],
    formula: [
      "Cramér's V = √( χ² / (n · (min(r, c) − 1)) )",
      'NMI = I(X; A) / H(A)',
      'w(a, y) = P(A = a) · P(Y = y) / P(A = a, Y = y)',
    ].join('\n'),
  },
];

const REFERENCES = [
  'Barocas, S., Hardt, M. & Narayanan, A. (2023). Fairness and Machine Learning: Limitations and Opportunities. MIT Press. fairmlbook.org',
  'Chouldechova, A. (2017). Fair prediction with disparate impact: A study of bias in recidivism prediction instruments. Big Data 5(2), 153–163.',
  'Equal Employment Opportunity Commission et al. (1978). Uniform Guidelines on Employee Selection Procedures, 29 CFR §1607.4(D).',
  'European Union (2024). Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). OJ L, 12.7.2024.',
  'Hardt, M., Price, E. & Srebro, N. (2016). Equality of opportunity in supervised learning. NeurIPS 29.',
  'Kamiran, F. & Calders, T. (2012). Data preprocessing techniques for classification without discrimination. Knowledge and Information Systems 33(1), 1–33.',
  'Katz, D., Baptista, J., Azen, S. P. & Pike, M. C. (1978). Obtaining confidence intervals for the risk ratio in cohort studies. Biometrics 34(3), 469–474.',
  'Kleinberg, J., Mullainathan, S. & Raghavan, M. (2016). Inherent trade-offs in the fair determination of risk scores. arXiv:1609.05807.',
  'Newcombe, R. G. (1998). Interval estimation for the difference between independent proportions. Statistics in Medicine 17(8), 873–890.',
  'Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. JASA 22(158), 209–212.',
  'Bird, S. et al. (2020). Fairlearn: A toolkit for assessing and improving fairness in AI. Microsoft Tech Report MSR-TR-2020-32.',
];

export default function MethodologyPage() {
  const { t } = useI18n();
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">{t('nav.methodology')}</span>
        <h1>{t('methodology.title')}</h1>
        <p className="lead">{t('methodology.lead')}</p>
        <nav aria-label={t('methodology.title')}>
          <ul className="toc">
            {[
              ...SECTIONS.map((s) => ({ id: s.id, title: s.title })),
              { id: 'limits', title: 'methodology.limitsTitle' as MessageKey },
              { id: 'legal', title: 'methodology.legalTitle' as MessageKey },
            ].map((s) => (
              <li key={s.id}>
                <a
                  href={`#/methodology`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView();
                    document.getElementById(s.id)?.focus();
                  }}
                >
                  {t(s.title)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {SECTIONS.map((s) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id} tabIndex={-1}>
              {t(s.title)}
            </h2>
            {s.body.map((b) => (
              <p key={b}>{t(b)}</p>
            ))}
            {s.id === 'verdicts' && (
              <ul>
                <li>{t('methodology.verdictOk')}</li>
                <li>{t('methodology.verdictConcern')}</li>
                <li>{t('methodology.verdictInconclusive')}</li>
                <li>{t('methodology.verdictInsufficient')}</li>
              </ul>
            )}
            {s.formula && <pre className="formula">{s.formula}</pre>}
          </section>
        ))}

        <section aria-labelledby="limits">
          <h2 id="limits" tabIndex={-1}>
            {t('methodology.limitsTitle')}
          </h2>
          <ul>
            {(['limit1', 'limit2', 'limit3', 'limit4', 'limit5', 'limit6'] as const).map((k) => (
              <li key={k}>{t(`methodology.${k}`)}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="legal">
          <h2 id="legal" tabIndex={-1}>
            {t('methodology.legalTitle')}
          </h2>
          <p>{t('methodology.legalBody1')}</p>
          <p>{t('methodology.legalBody2')}</p>
          <p>
            <strong>{t('methodology.legalBody3')}</strong>
          </p>
        </section>

        <section aria-labelledby="refs">
          <h2 id="refs">{t('methodology.referencesTitle')}</h2>
          <ol className="refs">
            {REFERENCES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
