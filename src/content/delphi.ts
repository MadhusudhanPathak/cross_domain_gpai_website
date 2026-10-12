/**
 * Owner-editable copy for the Delphi questionnaire (Round 1). Set `briefingPackUrl` before launch.
 * Item wording lives in `src/forms/round1.json`.
 * Strings are rendered with MarkdownLite: blank-line paragraphs, "- " lists, **bold** and links (no italics).
 */

/** Link to the briefing pack (one page per technique, one per domain's legal anchors). Leave empty to show a placeholder notice. */
export const briefingPackUrl = "https://drive.google.com/file/d/1H2YL2407raHpF5mR8igbUgt3UXT2uEz6/view";

export const referenceScenario =
  "A provider has placed a **closed-weight general-purpose AI model with systemic risk** on the EU market. The **AI Office** is assessing a compliance claim the provider has made under **Articles 53 and 55 of the AI Act**. The technical evaluation is carried out by an **independent expert appointed under Article 92**. Unless an item says otherwise, assume this expert has **the access the technique needs** to the version of the model actually deployed, and that the technique is applied **competently**.";

/** Part B §B.1 of the questionnaire, split so the component can lay out the tables. */
export const instructions = {
  intro:
    "You will assess 40 items in four blocks, one per technical domain. Items 02–10 in each block refer to the same situation, the **reference scenario**:",
  countQuestion: "**Most items ask you to estimate a count:**\n\n**Of 100 well-informed, independent reviewers given this evidence, how many would accept…?**",
  reviewer:
    "A **well-informed, independent reviewer** understands both the technical method and EU AI Act compliance assessment and has no ties to the provider. You are not being asked whether **you** accept the claim, but how such reviewers as a group would judge it.",
  stepsHeading: "For each such item, give four numbers:",
  steps: [
    { step: "Lower estimate", enter: "The lowest plausible count (0–100)" },
    { step: "Upper estimate", enter: "The highest plausible count (0–100)" },
    { step: "Best estimate", enter: "Your best estimate, between your lower and upper estimates" },
    { step: "Confidence", enter: "How confident you are (50–100%) that the true count lies between your lower and upper estimates" },
    { step: "Rationale", enter: "Optional, up to 100 words; strongly encouraged, as it will be shared anonymously in Round 2" },
  ],
  outsideCompetence:
    "Tick **Outside my competence** instead if you cannot give an informed estimate. This is preferred to guessing.",
  allocation:
    "The first item in each domain asks you to **allocate 100%** across the constraint codes below, in proportion to how much each currently limits verification of that domain's anchor claim, and to give one confidence rating (50–100%). The percentages must add up to exactly 100% before you can answer the rest of that domain. Item 01 comes before the reference scenario on each domain page: answer it for the situation today, without assuming the scenario's access.",
  rationaleNote:
    "Rationales are shared anonymously with other participants in Round 2. Please do not include your name, organisation or other identifying details in them.",
  closing: "Your answers record expert opinion; they do not determine what the law requires.",
};

export type GlossaryEntry = { term: string; definition: string };

/** Definitions from §B.1 and the item wording. */
export const glossaryDefinitions: GlossaryEntry[] = [
  {
    term: "Well-informed, independent reviewer",
    definition:
      "Understands both the technical method and EU AI Act compliance assessment and has no ties to the provider.",
  },
  {
    term: "Adequately supports",
    definition: "A reviewer would rely on the evidence for that specific claim, without needing further evidence for it.",
  },
  {
    term: "Adequately verifiable",
    definition:
      "The AI Office could reach a well-founded conclusion on the claim, **and** an independent party could check or challenge the evidence relied on.",
  },
  {
    term: "As of right",
    definition: "Obtainable through a legal entitlement, rather than only on terms the provider agrees to.",
  },
  {
    term: "Article 92 expert",
    definition:
      "The independent expert appointed by the Commission under Article 92(2) of the AI Act to carry out the technical evaluation on its behalf. The expert has no access powers of their own; access comes through the Commission.",
  },
  {
    term: "Controlled-evaluator-access entitlement",
    definition:
      "A hypothetical right, created by new legislation, for the appointed expert to receive directly the access or records an evaluation needs, in a secure environment, with analysis artefacts preserved for re-analysis. It goes beyond the Commission's current powers under Arts. 91–92 and Implementing Regulation (EU) 2026/1755.",
  },
  {
    term: "Qualified challenger",
    definition:
      "An independent party with the relevant expertise who receives the evidence and results under confidentiality, so that it can check or contest them. Under the entitlement, this sharing is allowed notwithstanding the confidentiality rules of Art. 78.",
  },
  {
    term: "Reference scenario",
    definition: "The situation every item refers to, shown at the top of each domain page.",
  },
];

/** Constraint codes used in item 01 of each domain. Must match the `codes` of the allocation items in `round1.json` (checked by a test). */
export const constraintCodes = [
  {
    code: "L",
    label: "Legal entitlement missing",
    description:
      "No legal provision gives the AI Office, or an expert acting for it, the access the evidence requires. Any access depends on the provider volunteering it.",
  },
  {
    code: "V",
    label: "Provider cooperation",
    description: "A legal route to the access exists, but in practice the provider controls its scope, timing or which evidence is shared.",
  },
  { code: "T", label: "Technical validation", description: "The method is not yet validated for this use, scale or setting." },
  { code: "E", label: "Narrower evidence", description: "Even when well executed, the method establishes something narrower than, or different from, the claim." },
  { code: "N", label: "Under-specified criterion", description: "The standard the claim must meet (e.g. what counts as fair or appropriate) is not sufficiently specified or agreed." },
  { code: "O", label: "Operational capacity", description: "The bodies involved lack the resources, expertise or procedures to verify in practice." },
  { code: "Ø", label: "Not materially limited", description: "The claim can be adequately verified today." },
];

/**
 * Technical terms used in the items, drawn from the Alignment Technique Taxonomy. They say what a term means,
 * not how well a method works, so the glossary does not prime ratings. Keep them consistent with the briefing pack.
 */
export const glossaryTechnicalTerms: GlossaryEntry[] = [
  {
    term: "Checkpoint",
    definition:
      "A saved snapshot of a model's weights at a given point in training. The **deployed checkpoint** is the exact version served to users.",
  },
  {
    term: "Activations",
    definition:
      "The internal numerical values a model computes at each layer while processing an input (for example, the residual stream).",
  },
  {
    term: "Steering / ablation",
    definition:
      "Interventions on a model's internal activations while it runs. Steering amplifies or adds a feature; ablation removes or zeroes it. Both are used to test how the feature affects behaviour.",
  },
  {
    term: "Subgraph",
    definition:
      "A subset of a model's components (such as attention heads and MLP layers) and the connections between them, identified as carrying out a particular behaviour. Also called a **circuit**.",
  },
  {
    term: "Lens readout",
    definition:
      "The token predictions obtained by projecting an intermediate layer's hidden state into the vocabulary, either directly through the model's own output layer (logit lens) or through a small trained translator for each layer (tuned lens).",
  },
  {
    term: "Protected attribute",
    definition:
      "A personal characteristic, such as gender or ethnic origin, protected under non-discrimination law, which a fairness method aims to keep from influencing a model's outputs.",
  },
  {
    term: "Control token",
    definition:
      "A special token added to the start of each training document to encode a label or score (here, a preference score), so the model learns to generate conditional on it and can be steered by it at inference time.",
  },
  {
    term: "Constitution",
    definition:
      "A written set of natural-language principles. In Constitutional AI it guides the AI-generated feedback used in training; in constitutional classifiers it defines the content categories the classifiers block.",
  },
  {
    term: "Reward function",
    definition:
      "A function that scores a model's behaviour or outputs, which training then seeks to maximise. In inverse reinforcement learning it is inferred from demonstrations rather than specified directly.",
  },
  {
    term: "Universal jailbreak",
    definition:
      "A single attack strategy (for example, a prompt template) that reliably bypasses a model's safeguards across a wide range of harmful queries in a target domain, not just one query.",
  },
  {
    term: "Adaptive attack",
    definition:
      "An attack designed or refined with knowledge of the specific defence in place, and adjusted in response to it, rather than reused unchanged from earlier attacks.",
  },
  {
    term: "Process reward model",
    definition:
      "A reward model that scores each intermediate step of a model's reasoning, rather than only the final output (outcome supervision).",
  },
];

