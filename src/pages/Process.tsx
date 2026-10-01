import { ProcessOverview } from "../components/ProcessOverview";

export function Process() {
  return (
    <div className="container">
      <h1>The process</h1>
      <ProcessOverview />

      <h2>Frequently asked questions</h2>

      <div className="faq-item">
        <h3>What if I am busy some days?</h3>
        <p>
          Round 1 and Round 2 are asynchronous: you can complete them at any point within their windows, in your own time.
          The only fixed-time commitment is the 30-minute call near the end, and the availability grid in the interest
          form is only there to help us find a slot for that one call.
        </p>
      </div>

      <div className="faq-item">
        <h3>Is my name shared?</h3>
        <p>
          Your individual ratings are never linked to your name. Other panellists see only anonymised, aggregated
          summaries. An appendix listing participants and short profiles is included only for those who consent to it.
        </p>
      </div>

      <div className="faq-item">
        <h3>What is recorded?</h3>
        <p>
          The 30-minute call at the end of the process is recorded and transcribed. The recording and transcript are used
          only for this research.
        </p>
      </div>
    </div>
  );
}
