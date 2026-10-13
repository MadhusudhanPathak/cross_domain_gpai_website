import type { TermEntry } from "../utils/terms";

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

export type Domain = "D1" | "D2" | "D3" | "D4";

/** A glossary entry. `domain` ties it to one domain's glossary panel; `matches` are the phrases linked to it in item text. */
export type GlossaryEntry = TermEntry & { domain?: Domain };

export const domainNames: Record<Domain, string> = {
  D1: "D1 Model opacity",
  D2: "D2 Data integrity",
  D3: "D3 Normative competence",
  D4: "D4 Adversarial robustness",
};

/** Study terms: definitions from §B.1 and the item wording. The first three are also shown in the instructions. */
export const glossaryDefinitions: GlossaryEntry[] = [
  {
    term: "Well-informed, independent reviewer",
    definition:
      "Understands both the technical method and EU AI Act compliance assessment and has no ties to the provider.",
  },
  {
    term: "Adequately supports",
    definition: "A reviewer would rely on the evidence for that specific claim, without needing further evidence for it.",
    matches: ["adequately supports"],
  },
  {
    term: "Adequately verifiable",
    definition:
      "The AI Office could reach a well-founded conclusion on the claim, **and** an independent party could check or challenge the evidence relied on.",
    matches: ["adequately verifiable"],
  },
  {
    term: "As of right",
    definition: "Obtainable through a legal entitlement, rather than only on terms the provider agrees to.",
    matches: ["as of right"],
  },
  {
    term: "Anchor claim",
    definition:
      "The claim each domain is about, shown at the top of the domain page. Items 01, 09 and 10 ask about it directly.",
    matches: ["anchor claim"],
  },
  {
    term: "Reference scenario",
    definition:
      "The situation items 02–10 refer to, shown on each domain page after item 01. Item 01 asks about the situation today, without it.",
    matches: ["reference scenario"],
  },
  {
    term: "Article 92 expert",
    definition:
      "The independent expert appointed by the Commission under Article 92(2) of the AI Act to carry out the technical evaluation on its behalf. The expert has no access powers of their own; access comes through the Commission.",
    matches: ["Article 92 expert", "independent expert appointed under Article 92"],
  },
  {
    term: "Controlled-evaluator-access entitlement",
    definition:
      "A hypothetical right, created by new legislation, for the appointed expert to receive directly the access or records an evaluation needs, in a secure environment, with analysis artefacts preserved for re-analysis. It goes beyond the Commission's current powers under Arts. 91–92 and Implementing Regulation (EU) 2026/1755.",
    matches: ["controlled-evaluator-access entitlement"],
  },
  {
    term: "Qualified challenger",
    definition:
      "An independent party with the relevant expertise who receives the evidence and results under confidentiality, so that it can check or contest them. Under the entitlement, this sharing is allowed notwithstanding the confidentiality rules of Art. 78.",
    matches: ["qualified challenger"],
  },
];

/**
 * The techniques the items name, in plain language for readers without a machine-learning background. Like the
 * technical terms, they say what a method does and produces, not how well it works, so they do not prime ratings.
 */
export const glossaryTechniques: GlossaryEntry[] = [
  {
    term: "Sparse autoencoders",
    domain: "D1",
    definition:
      "A sparse autoencoder is a small extra network trained to rewrite a model's internal activations as a combination of a much larger set of **features**, only a few of which are active at once. The aim is that each feature corresponds to one recognisable concept, so an analyst can see which features are active when the model shows a behaviour, and amplify or switch them off to test their effect.",
    matches: ["sparse autoencoders"],
  },
  {
    term: "Automated circuit discovery",
    domain: "D1",
    definition:
      "A method that searches a model's internal components (such as attention heads and layers) for a small **circuit** that carries out a chosen behaviour. It repeatedly removes connections between components and keeps only those whose removal changes the behaviour, as measured by a metric the analyst chooses.",
    matches: ["automated circuit discovery"],
  },
  {
    term: "Lens methods (logit lens, tuned lens)",
    domain: "D1",
    definition:
      "Methods that read a model's intermediate layers as if each were the last one, giving for every layer the words the model would output if it stopped there. The logit lens uses the model's own output layer for this; the tuned lens first trains a small translator for each layer. The result is a layer-by-layer view of how the model's prediction forms.",
    matches: ["tuned lens", "logit lens"],
  },
  {
    term: "Adversarial debiasing",
    domain: "D2",
    definition:
      "A training method with two networks. A second network, the adversary, tries to guess a protected attribute (such as gender) from the main model's internal representations, while the main model is trained both to do its task and to make that guess fail. The goal is a model whose representations carry as little information about the attribute as possible.",
    matches: ["adversarial debiasing"],
  },
  {
    term: "Dynamic adversarial data collection",
    domain: "D2",
    definition:
      "A way of building training data in rounds. Human annotators write examples that the current model gets wrong; those examples are added to the training data, the model is retrained, and the next round targets the improved model. The data therefore concentrates on cases the model finds difficult.",
    matches: ["dynamic adversarial data collection"],
  },
  {
    term: "Alignment pretraining (conditional pretraining)",
    domain: "D2",
    definition:
      "Building human preferences into a model's first and largest training stage, pretraining, instead of adding them only afterwards. In conditional pretraining, each training document is labelled with a score from a preference-scoring function, so the model learns to generate text conditional on that score and can be steered towards the preferred kind.",
    matches: ["conditional pretraining", "alignment pretraining"],
  },
  {
    term: "Constitutional AI",
    domain: "D3",
    definition:
      "A training method guided by a written list of principles, the **constitution**. The model critiques and revises its own answers against the principles, and an AI judge, instead of human raters, picks which of two answers better follows them; the model is then trained on those judgements.",
    matches: ["Constitutional AI"],
  },
  {
    term: "AI safety via debate",
    domain: "D3",
    definition:
      "Two copies of a model take turns arguing for opposite answers to a question, and a judge (a person or a weaker model) who cannot check the answer directly decides which side was more truthful and useful. It is designed for questions the judge could not settle unaided.",
    matches: ["AI safety via debate", "debate"],
  },
  {
    term: "Inverse reinforcement learning",
    domain: "D3",
    definition:
      "Instead of being told what counts as good behaviour, the method infers it. It observes demonstrations, for example people handling a situation well, and works out a **reward function** (a scoring rule) that would explain why they acted as they did. The inferred reward can then be used to train a model.",
    matches: ["inverse reinforcement learning"],
  },
  {
    term: "Constitutional classifiers",
    domain: "D4",
    definition:
      "Separate filter models placed around the main model: one checks each user request, another checks each response as it is produced, and they block content in categories the provider defines as harmful. They are trained on examples generated from a written constitution that sets out what is and is not allowed.",
    matches: ["constitutional classifiers", "classifiers trained from a constitution"],
  },
  {
    term: "Circuit breakers",
    domain: "D4",
    definition:
      "A training method that identifies patterns of internal activity linked to harmful outputs and teaches the model to interrupt its own generation when those patterns appear. It acts on the model's internal states rather than filtering the final text.",
    matches: ["circuit breakers"],
  },
  {
    term: "Process reward model",
    domain: "D4",
    definition:
      "A model that scores each step of another model's written reasoning, rather than only its final answer (outcome supervision). Used in training, it rewards reasoning steps that meet the criteria it encodes, here including safety criteria.",
    matches: ["process reward model"],
  },
];

/** AI Act provisions and bodies the items mention, for readers without a legal background. Kept in line with the briefing pack. */
export const glossaryLegalTerms: GlossaryEntry[] = [
  {
    term: "AI Office",
    definition:
      "The European Commission's body that supervises and enforces the AI Act's rules for general-purpose AI models (Art. 88). It can request information from providers and evaluate their models.",
    matches: ["AI Office"],
  },
  {
    term: "General-purpose AI model with systemic risk",
    definition:
      "A general-purpose AI model whose capabilities could have significant effects across the EU, for example on public health, safety or fundamental rights. A model is presumed to be in this category if its training used more than 10^25 floating-point operations, and the Commission can also designate models (Art. 51). These models carry the extra obligations of Art. 55.",
    matches: ["systemic risk", "systemic-risk"],
  },
  {
    term: "Art. 53",
    definition:
      "Duties of every provider of a general-purpose AI model, including technical documentation for the AI Office (point (a), detailed in Annex XI) and information for companies that build on the model (point (b), detailed in Annex XII).",
    matches: ["Art. 53(1)(a)–(b)"],
  },
  {
    term: "Art. 55",
    definition:
      "Extra duties for models with systemic risk: (a) evaluate the model with state-of-the-art methods, including adversarial testing such as red teaming; (b) assess and mitigate systemic risks; (c) report serious incidents; (d) ensure adequate cybersecurity.",
    matches: ["Art. 55(1)(b)", "Art. 55(1)(a)–(b)"],
  },
  {
    term: "Annexes XI and XII",
    definition:
      "Annex XI lists what the technical documentation for the AI Office must contain, such as the training methods, the training data (type, provenance, curation and methods to detect identifiable biases) and, for systemic-risk models, evaluation results and adversarial testing. Annex XII lists the information given to companies that build on the model.",
    matches: ["Annexes XI–XII", "Annex XI"],
  },
  {
    term: "Arts. 91–92",
    definition:
      "The Commission's powers to obtain evidence from a provider. Under Art. 91 it can request documentation and any other information it needs. Under Art. 92 the AI Office can evaluate a model itself, with access through APIs, source code or other technical means, and can appoint independent experts to do so on its behalf. Both apply from 2 August 2026.",
    matches: ["Arts. 91–92"],
  },
  {
    term: "Implementing Regulation (EU) 2026/1755",
    definition:
      "The Commission's detailed rules for evaluations under Art. 92, in force since 10 August 2026. Access may include APIs, model weights, source code, the hosting infrastructure, and inspecting and changing the model's internal state while it runs. The provider may not impose constraints that materially impede the evaluation.",
    matches: ["Implementing Regulation (EU) 2026/1755"],
  },
  {
    term: "Arts. 75(1) and 75a",
    definition:
      "Powers of the AI Office over AI systems that a provider builds on its own general-purpose AI model, including ordering access to the system. They serve the obligations that apply to AI systems, not the model obligations of Art. 55.",
    matches: ["Arts. 75(1) and 75a"],
  },
  {
    term: "Art. 78",
    definition:
      "Confidentiality: everyone applying the AI Act must protect the confidential information they obtain, including trade secrets and source code.",
    matches: ["Art. 78"],
  },
  {
    term: "GDPR",
    definition:
      "The EU General Data Protection Regulation. It limits how personal data, such as users' conversations or personal information in training data, may be accessed and shared, independently of the AI Act.",
    matches: ["GDPR"],
  },
  {
    term: "Code of Practice for general-purpose AI",
    definition:
      "A voluntary code published by the Commission that providers can follow to show they meet their Art. 53 and Art. 55 obligations, with chapters on transparency, copyright, and safety and security.",
  },
];

/** Constraint codes used in item 01 of each domain. Must match the `codes` of the allocation items in `round1.json` (checked by a test). */
export const constraintCodes = [
  { code: "Ø", label: "There is no limit to the verification", description: "The claim can be adequately checked and all aspects are good." },
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
];

/**
 * Technical terms used in the items, drawn from the Alignment Technique Taxonomy. They say what a term means,
 * not how well a method works, so the glossary does not prime ratings. Keep them consistent with the briefing pack.
 */
export const glossaryTechnicalTerms: GlossaryEntry[] = [
  {
    term: "Checkpoint",
    matches: ["checkpoint"],
    definition:
      "A saved snapshot of a model's weights at a given point in training. The **deployed checkpoint** is the exact version served to users.",
  },
  {
    term: "Activations",
    domain: "D1",
    matches: ["activations", "activation"],
    definition:
      "The internal numerical values a model computes at each layer while processing an input (for example, the residual stream).",
  },
  {
    term: "Steering / ablation",
    domain: "D1",
    matches: ["steering", "ablating", "ablation"],
    definition:
      "Interventions on a model's internal activations while it runs. Steering amplifies or adds a feature; ablation removes or zeroes it. Both are used to test how the feature affects behaviour.",
  },
  {
    term: "Subgraph",
    domain: "D1",
    matches: ["subgraph"],
    definition:
      "A subset of a model's components (such as attention heads and MLP layers) and the connections between them, identified as carrying out a particular behaviour. Also called a **circuit**.",
  },
  {
    term: "Lens readout",
    domain: "D1",
    matches: ["lens readout"],
    definition:
      "The token predictions obtained by projecting an intermediate layer's hidden state into the vocabulary, either directly through the model's own output layer (logit lens) or through a small trained translator for each layer (tuned lens).",
  },
  {
    term: "Protected attribute",
    domain: "D2",
    matches: ["protected attribute"],
    definition:
      "A personal characteristic, such as gender or ethnic origin, protected under non-discrimination law, which a fairness method aims to keep from influencing a model's outputs.",
  },
  {
    term: "Control token",
    domain: "D2",
    matches: ["control token"],
    definition:
      "A special token added to the start of each training document to encode a label or score (here, a preference score), so the model learns to generate conditional on it and can be steered by it at inference time.",
  },
  {
    term: "Constitution",
    matches: ["constitution"],
    definition:
      "A written set of natural-language principles. In Constitutional AI it guides the AI-generated feedback used in training; in constitutional classifiers it defines the content categories the classifiers block.",
  },
  {
    term: "Reward function",
    domain: "D3",
    matches: ["reward function"],
    definition:
      "A function that scores a model's behaviour or outputs, which training then seeks to maximise. In inverse reinforcement learning it is inferred from demonstrations rather than specified directly.",
  },
  {
    term: "Universal jailbreak",
    domain: "D4",
    matches: ["universal jailbreak"],
    definition:
      "A single attack strategy (for example, a prompt template) that reliably bypasses a model's safeguards across a wide range of harmful queries in a target domain, not just one query.",
  },
  {
    term: "Adaptive attack",
    domain: "D4",
    matches: ["adaptive attack"],
    definition:
      "An attack designed or refined with knowledge of the specific defence in place, and adjusted in response to it, rather than reused unchanged from earlier attacks.",
  },
];


/** Every entry that can be linked from item text. Order sets priority when two entries claim the same phrase. */
export const linkableTerms: GlossaryEntry[] = [
  ...glossaryTechniques,
  ...glossaryTechnicalTerms,
  ...glossaryLegalTerms,
  ...glossaryDefinitions,
];

/** The reference page listing every technique, term and code (route in `App.tsx`). */
export const referencePath = "/reference";
