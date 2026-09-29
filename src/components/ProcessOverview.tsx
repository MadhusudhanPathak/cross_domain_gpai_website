import { processNote, stages, totalMinutesLabel, type Stage } from "../content/process";

/** Minimum width (%) so zero-minute stages stay visible in the time bar. */
const MIN_SEGMENT_PERCENT = 6;

function segmentWidth(stage: Stage, totalMinutes: number): number {
  if (totalMinutes <= 0) return 100 / stages.length;
  return Math.max((stage.minutes / totalMinutes) * 100, stage.minutes === 0 ? MIN_SEGMENT_PERCENT : 0);
}

/** Proportional time bar plus a timeline describing each stage of the study. */
export function ProcessOverview() {
  const totalMinutes = stages.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div>
      <div className="timebar" role="img" aria-label={`Time commitment: ${stages.map((s) => `${s.label}, ${s.durationLabel}`).join("; ")}`}>
        {stages.map((s) => (
          <div
            className="timebar__seg"
            key={s.id}
            style={{ width: `${segmentWidth(s, totalMinutes)}%` }}
            title={`${s.label}: ${s.durationLabel}`}
          >
            {s.durationLabel}
          </div>
        ))}
      </div>
      <p className="timebar__caption">{totalMinutesLabel}</p>

      <ol className="timeline">
        {stages.map((s) => (
          <li className="timeline__item" key={s.id}>
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__label">{s.label}</div>
            <div className="timeline__meta">
              {s.window} &middot; {s.durationLabel} &middot; {s.mode}
            </div>
            <p>{s.description}</p>
          </li>
        ))}
      </ol>
      <p className="field__help">{processNote}</p>
    </div>
  );
}
