import { Link } from "wouter";
import { site } from "../content/site";
import { ProcessOverview } from "../components/ProcessOverview";

export function Home() {
  return (
    <div className="container">
      <h1>{site.studyName}</h1>
      <p className="lede">{site.studySummary}</p>
      <p>{site.studyAudience}</p>
      <p>
        <strong>Time commitment:</strong> {site.timeCommitment}
      </p>

      <div className="cta">
        <Link href="/forms/interest" className="button button--primary">
          Express interest
        </Link>
      </div>

      <h2>The process at a glance</h2>
      <ProcessOverview />
    </div>
  );
}
