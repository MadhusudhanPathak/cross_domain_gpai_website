import { stages, totalMinutesLabel, processNote } from "../content/process";

export function ProcessOverview() {
  const totalMinutes = stages.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div>
      <div className="timebar" role="img" aria-label={`Time commitment: ${stages.map((s) => `${s.label}, ${s.durationLabel}`).join("; ")}`}>
        {stages.map((s) => {
          const width = totalMinutes > 0 ? Math.max((s.minutes / totalMinutes) * 100, s.minutes === 0 ? 6 : 0) : 25;
          return (
            <div className="timebar__seg" key={s.id} style={{ width: `${width}%` }} title={`${s.label}: ${s.durationLabel}`}>
              {s.durationLabel}
            </div>
          );
        })}
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
