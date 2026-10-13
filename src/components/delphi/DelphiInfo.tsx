import {
  briefingPackUrl,
  constraintCodes,
  domainNames,
  glossaryDefinitions,
  glossaryLegalTerms,
  glossaryTechnicalTerms,
  glossaryTechniques,
  instructions,
  linkableTerms,
  referencePath,
  referenceScenario,
  type Domain,
  type GlossaryEntry,
} from "../../content/delphi";
import { termSlug } from "../../utils/terms";
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

/** Links to the briefing pack and to the reference page, both in a new tab so the questionnaire keeps its place. */
export function ReferenceLinks() {
  return (
    <>
      <BriefingPackLink />
      <p>
        <a href={referencePath} target="_blank" rel="noopener noreferrer">
          Open the reference page
        </a>{" "}
        (opens in a new tab): every technique, term and code in plain language. You can also select an underlined term in
        a question to see its definition.
      </p>
    </>
  );
}

/** Reference scenario printed at the top of every domain page. Collapsible, expanded by default. */
export function ReferenceScenario() {
  return (
    <details className="callout" open>
      <summary>Reference scenario</summary>
      <MarkdownLite text={referenceScenario} terms={linkableTerms} referenceHref={referencePath} />
    </details>
  );
}

/** Definition list of glossary entries. With `anchors`, each entry gets an id so links can point to it. */
export function GlossaryList({ entries, anchors = false }: { entries: GlossaryEntry[]; anchors?: boolean }) {
  return (
    <dl className="glossary__list">
      {entries.map((e) => (
        <div key={e.term} id={anchors ? termSlug(e.term) : undefined}>
          <dt>{e.term}</dt>
          <dd>
            <MarkdownLite text={e.definition} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const constraintCodeEntries: GlossaryEntry[] = constraintCodes.map((c) => ({
  term: `${c.code}: ${c.label}`,
  definition: c.description,
}));

/** The domain a domain-page field belongs to, from its id (e.g. "D2_glossary"). */
const domainOf = (fieldId: string | undefined): Domain | undefined => {
  const m = /^(D[1-4])_/.exec(fieldId ?? "");
  return m ? (m[1] as Domain) : undefined;
};

/** Collapsed glossary panel. On a domain page it lists that domain's techniques and terms first. */
export function Glossary({ fieldId }: { fieldId?: string }) {
  const domain = domainOf(fieldId);
  const inDomain = (e: GlossaryEntry) => !domain || !e.domain || e.domain === domain;
  return (
    <details className="glossary">
      <summary>Glossary and briefing pack</summary>
      <ReferenceLinks />
      <h3>{domain ? `Techniques in ${domainNames[domain]}` : "Techniques"}</h3>
      <GlossaryList entries={glossaryTechniques.filter(inDomain)} />
      <h3>Technical terms</h3>
      <GlossaryList entries={glossaryTechnicalTerms.filter(inDomain)} />
      <h3>Definitions</h3>
      <GlossaryList entries={glossaryDefinitions} />
      <h3>Legal terms</h3>
      <GlossaryList entries={glossaryLegalTerms} />
      <h3>Constraint codes</h3>
      <GlossaryList entries={constraintCodeEntries} />
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
      <ReferenceLinks />
    </div>
  );
}

