import { useEffect } from "react";
import { domainNames, glossaryDefinitions, glossaryLegalTerms, glossaryTechnicalTerms, glossaryTechniques, type Domain } from "../content/delphi";
import { BriefingPackLink, GlossaryList, constraintCodeEntries } from "../components/delphi/DelphiInfo";

const DOMAINS: Domain[] = ["D1", "D2", "D3", "D4"];

/** Plain-language reference for every technique, term and code in the Round 1 questionnaire. Terms link here by anchor. */
export function Reference() {
  // The page renders after the browser has tried to scroll to the anchor, so scroll once it exists.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <div className="container reference">
      <h1>Reference: techniques, terms and codes</h1>
      <p className="lede">
        Plain-language explanations of the techniques and terms used in the Round 1 questionnaire. They say what each
        method does and produces, not how well it works: judging that is what the questionnaire asks of you.
      </p>
      <BriefingPackLink />

      <h2>Techniques</h2>
      {DOMAINS.map((d) => (
        <section key={d}>
          <h3>{domainNames[d]}</h3>
          <GlossaryList entries={glossaryTechniques.filter((e) => e.domain === d)} anchors />
        </section>
      ))}

      <h2>Technical terms</h2>
      <GlossaryList entries={glossaryTechnicalTerms} anchors />

      <h2>Legal terms</h2>
      <GlossaryList entries={glossaryLegalTerms} anchors />

      <h2>Study terms</h2>
      <GlossaryList entries={glossaryDefinitions} anchors />

      <h2>Constraint codes (item 01)</h2>
      <GlossaryList entries={constraintCodeEntries} anchors />
    </div>
  );
}
