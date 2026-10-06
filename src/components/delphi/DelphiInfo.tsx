import {
  briefingPackUrl,
  constraintCodes,
  glossaryDefinitions,
  glossaryTechnicalTerms,
  instructions,
  referenceScenario,
  type GlossaryEntry,
} from "../../content/delphi";
import { MarkdownLite } from "../MarkdownLite";

/** Static blocks embedded in the Delphi questionnaire through `info` fields (`component`). Copy comes from `content/delphi.ts`. */

export function BriefingPackLink() {
  if (!briefingPackUrl) return <p className="field__help">[PLACEHOLDER: briefing pack link]</p>;
  return (
    <p>
      <a href={briefingPackUrl} target="_blank" rel="noopener noreferrer">
        Open the briefing pack
      </a>{" "}
      (opens in a new tab): one page per technique and one page per domain's legal anchors.
    </p>
  );
}

/** Reference scenario printed at the top of every domain page. Collapsible, expanded by default. */
export function ReferenceScenario() {
  return (
    <details className="callout" open>
      <summary>Reference scenario</summary>
      <MarkdownLite text={referenceScenario} />
    </details>
  );
}

function GlossaryList({ entries }: { entries: GlossaryEntry[] }) {
  return (
    <dl className="glossary__list">
      {entries.map((e) => (
        <div key={e.term}>
          <dt>{e.term}</dt>
          <dd>
            <MarkdownLite text={e.definition} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Collapsed glossary panel: definitions, constraint codes and technical terms. */
export function Glossary() {
  return (
    <details className="glossary">
      <summary>Glossary and briefing pack</summary>
      <BriefingPackLink />
      <h3>Definitions</h3>
      <GlossaryList entries={glossaryDefinitions} />
      <h3>Constraint codes</h3>
      <GlossaryList entries={constraintCodes.map((c) => ({ term: `${c.code}: ${c.label}`, definition: c.description }))} />
      <h3>Technical terms</h3>
      <GlossaryList entries={glossaryTechnicalTerms} />
    </details>
  );
}

/** "How to answer": the participant instructions from §B.1 of the questionnaire. */
export function DelphiInstructions() {
  return (
    <div className="delphi-instructions">
      <MarkdownLite text={instructions.intro} />
      <div className="callout">
        <MarkdownLite text={`**Reference scenario.** ${referenceScenario}`} />
      </div>
      <MarkdownLite text={instructions.countQuestion} />
      <MarkdownLite text={instructions.reviewer} />
      <p>
        <strong>{instructions.stepsHeading}</strong>
      </p>
      <table className="simple-table">
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Enter</th>
          </tr>
        </thead>
        <tbody>
          {instructions.steps.map((s) => (
            <tr key={s.step}>
              <th scope="row">{s.step}</th>
              <td>{s.enter}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <MarkdownLite text={instructions.outsideCompetence} />
      <MarkdownLite text={instructions.rationaleNote} />
      <h3>Definitions used in the items</h3>
      <GlossaryList entries={glossaryDefinitions.slice(0, 3)} />
      <h3>Constraint codes (used in item 01 of each domain)</h3>
      <MarkdownLite text={instructions.allocation} />
      <table className="simple-table">
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {constraintCodes.map((c) => (
            <tr key={c.code}>
              <th scope="row">{c.code}</th>
              <td>
                <strong>{c.label}:</strong> {c.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <MarkdownLite text={instructions.closing} />
      <BriefingPackLink />
    </div>
  );
}

