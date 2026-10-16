export type Stage = {
  id: string;
  label: string;
  window: string;
  minutes: number;
  durationLabel: string;
  mode: string;
  description: string;
};

// Minutes drive the proportional time bar (§12.5): 45 | 30+30 | 15.
export const stages: Stage[] = [
  {
    id: "round1",
    label: "Round 1: independent ratings",
    window: "17 Oct - 2 Nov",
    minutes: 45,
    durationLabel: "~45 min",
    mode: "Asynchronous online form, own time",
    description: "You rate each claim and technique pair independently, without seeing other panellists' answers.",
  },
  {
    id: "summary",
    label: "Summary prepared",
    window: "3 Nov",
    minutes: 0,
    durationLabel: "none",
    mode: "Prepared by the research team",
    description: "The team anonymises and summarises Round 1 responses and sends it to every Round 1 panellist. You do not need to do anything at this stage.",
  },
  {
    id: "round2",
    label: "Round 2: review and revise",
    window: "4 - 13 Nov",
    minutes: 60,
    durationLabel: "~1 hour",
    mode: "Asynchronous online form, own time",
    description: "You review the anonymised Round 1 summary, then revise your own answers in light of it.",
  },
  {
    id: "interview",
    label: "Interview: reasons and overview",
    window: "14 - 24 Nov",
    minutes: 15,
    durationLabel: "~15 min",
    mode: "Live call, recorded and transcribed",
    description: "The only synchronous part of the process: a short interview to discuss your reasons for any changes and to review the panel's overall responses. Book a time using the scheduling link in the expression-of-interest form. The interview is recorded and transcribed for research use only.",
  },
];

export const totalMinutesLabel =
  "About 2 hours in total, spread over about five and a half weeks. Only the final interview needs a fixed time; everything else is asynchronous but kept within its window.";

export const processNote =
  "Round 2 opens only after every panellist has finished Round 1. Dates may shift by a day or two; the team will give notice in advance.";
