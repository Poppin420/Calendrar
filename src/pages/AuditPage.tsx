import { useAudit, type Step } from '../components/AuditContext';
import { ResultsDashboard } from '../components/dashboard/ResultsDashboard';
import { Landing } from '../components/Landing';
import { MappingStep } from '../components/mapping/MappingStep';
import { UploadStep } from '../components/upload/UploadStep';
import { useI18n } from '../i18n';

const STEPS: Exclude<Step, 'landing'>[] = ['upload', 'mapping', 'results'];

function Stepper({ step }: { step: Step }) {
  const { t } = useI18n();
  const current = STEPS.indexOf(step as Exclude<Step, 'landing'>);
  return (
    <nav aria-label={t('steps.label')} className="no-print">
      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? 'step' : undefined}
            className={i < current ? 'done' : undefined}
          >
            <span className="num">{i + 1}</span>
            {t(`steps.${s}`)}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AuditPage() {
  const { step } = useAudit();
  if (step === 'landing') return <Landing />;
  return (
    <div className="container">
      <Stepper step={step} />
      {step === 'upload' && <UploadStep />}
      {step === 'mapping' && <MappingStep />}
      {step === 'results' && <ResultsDashboard />}
    </div>
  );
}
