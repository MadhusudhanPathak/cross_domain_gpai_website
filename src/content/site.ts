// All owner-editable placeholders live here. Never hard-code these in components.

export const site = {
  studyName: "GPAI Delphi Study",
  shortName: "GPAI Delphi Study",
  contactEmail: "[EMAIL]",
  siteUrl: "[SITE_URL]",
  replyByDate: "[DATE]",
  retentionPeriod: "[RETENTION PERIOD]",
  dataController: "[INSTITUTION / DATA CONTROLLER]",
  transcriptionTool: "[TRANSCRIPTION TOOL]",
  teamNames: "[TEAM NAMES]",
  studySummary:
    "We are researching how convincingly the techniques available today can substantiate safety and compliance claims about general-purpose AI models, and how much weight expert judgement gives them. This is a two-round structured expert elicitation (a Delphi study) with a panel of 16 experts across four technical domains.",
  studyAudience:
    "You have been invited because of your expertise in AI safety, evaluation, interpretability, security, or AI law, governance and compliance.",
  timeCommitment: "About 2 hours in total, all between 1 and 20 October 2026.",
};

export type Site = typeof site;
