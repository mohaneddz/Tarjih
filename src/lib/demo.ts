/**
 * The questions a fresh deployment is seeded with (see
 * `src/scripts/seed-demo.ts`), each with the goal a person would confirm in
 * the grounding preview. Kept apart from the script so a test can check that
 * every one still grounds and resolves against the current knowledge base.
 */
export const DEMO_QUESTIONS: readonly { question: string; goal: string }[] = [
  { question: "Can I eat carrion if I'm starving?", goal: "ruling(consume(carrion), H), circumstance(starvation)" },
  { question: "Can I skip the fast while travelling?", goal: "ruling(omit(fasting), H), circumstance(travel)" },
  { question: "Is selling an unborn calf allowed?", goal: "ruling(sell(unborn_calf), H)" },
  { question: "Can I give my zakat to my mother?", goal: "ruling(give_zakat_to(mother), H)" },
  { question: "Is mistreating my maternal aunt haram?", goal: "ruling(mistreat(aunt_maternal), H)" },
  { question: "Can a man wear gold?", goal: "ruling(wear(gold), H), circumstance(male)" },
  { question: "Is it allowed to lie to reconcile two people?", goal: "ruling(speak(lie), H), circumstance(reconciling_people)" },
  { question: "Can I marry my paternal cousin?", goal: "ruling(marry(cousin_paternal), H)" },
  { question: "Is drinking beer forbidden?", goal: "ruling(consume(beer), H)" },
  { question: "Can I hunt while in ihram?", goal: "ruling(hunt(land_game), H), circumstance(ihram)" },
  { question: "Does my fast still count if I ate by mistake?", goal: "ruling(perform(fasting), H), circumstance(ate_forgetfully)" },
  { question: "Is smoking haram?", goal: "ruling(consume(tobacco), H)" },
];

