export type Stage = {
  id: string;
  label: string;
  window: string;
  minutes: number;
  durationLabel: string;
  mode: string;
  description: string;
};

// Minutes drive the proportional time bar (§12.5): 45 | 30+30 | 30.
export const stages: Stage[] = [
  {
    id: "round1",
    label: "Round 1: independent ratings",
    window: "01 - 10 Oct",
    minutes: 45,
    durationLabel: "~45 min",
    mode: "Asynchronous online form, own time",
    description: "You rate each claim and technique pair independently, without seeing other panellists' answers.",
  },
  {
    id: "summary",
    label: "Summary prepared",
    window: "10 - 12 Oct",
    minutes: 0,
    durationLabel: "none",
    mode: "Prepared by the research team",
    description: "The team anonymises and summarises Round 1 responses. You do not need to do anything at this stage.",
  },
  {
    id: "round2",
    label: "Round 2: review and revise",
    window: "13 - 20 Oct",
    minutes: 60,
    durationLabel: "~30 min + ~30 min",
    mode: "Asynchronous online form, own time",
    description: "You review the anonymised Round 1 summary, then revise your own answers in light of it.",
  },
  {
    id: "call",
    label: "Short call: reasons and overview",
    window: "20 - 27 Oct",
    minutes: 30,
    durationLabel: "30 min",
    mode: "Live call, recorded and transcribed",
    description: "The only synchronous part of the process: a 30-minute call to discuss your reasons for any changes and to review the panel's overall responses. The call is recorded and transcribed for research use only.",
  },
];

export const totalMinutesLabel =
  "About 2 hours 15 minutes in total, spread over three weeks. Only the final 30-minute call needs a fixed time; everything else is asynchronous but kept within its window.";

export const processNote =
  "Round 2 opens only after every panellist has finished Round 1. Dates may shift by a day or two; the team will give notice in advance.";
