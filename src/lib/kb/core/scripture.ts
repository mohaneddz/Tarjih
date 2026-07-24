/**
 * Formalised scriptural texts for the vertical slice.
 *
 * Hand-authored and human-checked, so `unreviewed` is absent throughout —
 * unlike anything the formalisation pipeline will produce.
 *
 * The discipline these are written under: a clause must say what the text
 * says, not what the text is generally taken to imply. Where a wider rule is
 * genuinely intended, it goes through an explicit usul rule so the step is
 * visible in the proof and can be weighed, rather than being smuggled into
 * the reading of the text itself.
 */

import type { KbEntry } from "../entry";

export const SCRIPTURE: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Kinship
  // -------------------------------------------------------------------------
  {
    id: "quran:17-23:parents",
    /*
     * "say not to them a word of disrespect" — the verse forbids even the
     * mildest expression of irritation, so mistreatment falls under it a
     * fortiori. Scoped to parents only; extension to other relatives is left
     * to qiyas, where it can be weighed.
     */
    clause: "ruling(mistreat(mother), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:23",
      text:
        "Your Lord has decreed that you worship none but Him, and that you be " +
        "dutiful to your parents. If one or both of them reach old age with you, " +
        "say not to them a word of disrespect, nor repel them, but speak to them " +
        "a noble word.",
      textArabic: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Forbidding even 'uff' entails forbidding worse treatment by the " +
        "stronger implication (mafhum al-muwafaqa).",
    },
  },
  {
    id: "quran:17-23:father",
    clause: "ruling(mistreat(father), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:23",
      text: "…and that you be dutiful to your parents.",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "quran:17-23:illah",
    clause: "illah(mistreat(mother), qata_rahim).",
    evidence: {
      kind: "usul",
      reference: "Identification of the 'illa in Qur'an 17:23",
      dalala: "zanni",
      notes:
        "The effective cause is identified as severance of the womb-tie. " +
        "This identification is itself a juristic judgement, not something " +
        "the verse states, so it is recorded as a separate clause with its " +
        "own (probable) weight rather than folded into the verse's reading.",
    },
  },
  {
    id: "quran:17-23:generalisable",
    clause: "generalisable(mistreat(mother)).",
    evidence: {
      kind: "usul",
      reference: "The ruling on parents is not a personal concession",
      notes:
        "Nothing marks this ruling as peculiar to a person or occasion, so it " +
        "may serve as the source case of an analogy.",
    },
  },

  {
    id: "bukhari:5984:severing-kinship",
    /*
     * The severing-kinship text reaches every womb-relative, which is what
     * brings aunts within its scope without needing analogy at all.
     */
    clause: "ruling(mistreat(Relative), haram) :- instance_of(Relative, rahim).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5984, Sahih Muslim 2556",
      text: "The one who severs the ties of kinship will not enter Paradise.",
      textArabic: "لا يدخل الجنة قاطع",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "General ('amm) in its subject: it names no particular relative. Its " +
        "indication is probable because the verse condemns severance, and " +
        "treating mistreatment as a form of severance is a juristic reading.",
    },
  },
  {
    id: "bukhari:5971:mothers-right",
    clause: "obligation_toward(ego, mother, birr).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5971, Sahih Muslim 2548",
      text:
        "A man came to the Messenger of Allah and said: who is most deserving " +
        "of my good companionship? He said: your mother. He said: then who? He " +
        "said: your mother. He said: then who? He said: your mother. He said: " +
        "then who? He said: your father.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },

  // The aunt's side of the analogy: same effective cause as the mother's case.
  {
    id: "illah:aunt-maternal",
    clause: "illah(mistreat(aunt_maternal), qata_rahim).",
    evidence: {
      kind: "usul",
      reference: "Shared 'illa: severance of the womb-tie",
      dalala: "zanni",
      notes: "The maternal aunt is a womb-relative, so mistreating her severs the same tie.",
    },
  },
  {
    id: "illah:aunt-paternal",
    clause: "illah(mistreat(aunt_paternal), qata_rahim).",
    evidence: {
      kind: "usul",
      reference: "Shared 'illa: severance of the womb-tie",
      dalala: "zanni",
    },
  },

  {
    id: "harm:mistreat-kin",
    clause: "causes(mistreat(Relative), darar) :- instance_of(Relative, rahim).",
    evidence: {
      kind: "ontology",
      reference: "Mistreatment is harmful by definition",
      notes:
        "Lets the la-darar maxim reach these cases. Carries no independent " +
        "weight of its own.",
    },
  },

  // -------------------------------------------------------------------------
  // Forbidden foods and the necessity exception
  // -------------------------------------------------------------------------
  {
    id: "quran:5-3:forbidden-foods",
    clause: "ruling(consume(Food), haram) :- instance_of(Food, forbidden_food).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:3",
      text:
        "Forbidden to you are carrion, blood, the flesh of swine, and that " +
        "which has been dedicated to other than Allah.",
      textArabic: "حُرِّمَتْ عَلَيْكُمُ الْمَيْتَةُ وَالدَّمُ وَلَحْمُ الْخِنزِيرِ",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
    },
  },
  {
    id: "quran:2-173:necessity",
    /*
     * The same passage that prohibits also carves out the exception, which is
     * why the resulting conflict is not a defect in the KB: both rulings are
     * genuinely textual, and the tarjih layer must resolve them the way the
     * jurists do — the specific qualifies the general.
     */
    clause: "excepted(consume(Food), starvation) :- instance_of(Food, forbidden_food).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:173",
      text:
        "He has only forbidden you carrion, blood, the flesh of swine, and that " +
        "which has been dedicated to other than Allah. But whoever is compelled " +
        "by necessity, neither craving it nor exceeding the limit, there is no " +
        "sin upon him.",
      textArabic: "فَمَنِ اضْطُرَّ غَيْرَ بَاغٍ وَلَا عَادٍ فَلَا إِثْمَ عَلَيْهِ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Specific (khass) relative to the general prohibition: it addresses the " +
        "compelled person in particular. Under the murajjihat the specific " +
        "qualifies the general rather than contradicting it.",
    },
  },
  {
    id: "fact:starvation-is-necessity",
    clause: "necessity(starvation).",
    evidence: {
      kind: "usul",
      reference: "Starvation threatens preservation of life",
      dalala: "qati",
      notes: "Threat to life is the paradigm case of darura, agreed among all schools.",
    },
  },
];
