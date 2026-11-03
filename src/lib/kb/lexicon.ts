/**
 * Human-readable labels for the atoms and acts the vertical-slice KB knows
 * about, and the grounding vocabulary the NL-to-goal stage is restricted to.
 *
 * This exists because the LLM parsing stage must not be free to invent terms.
 * If it writes `mistreat(camel_meat)`, the query silently finds no
 * derivation — which looks exactly like a genuine "the KB has no rule for
 * this" answer, but means something completely different ("the KB has never
 * heard of this term"). Those two cases must be told apart, and the only way
 * to do that is to check every atom the LLM used against a known list before
 * proving anything.
 *
 * Kept separate from `ontology.ts`: the ontology is the predicate schema
 * (fixed, load-bearing, rarely changes); this is per-entity vocabulary that
 * grows with the KB content and will eventually be generated from the loaded
 * KB's `instance`/`subclass` facts rather than hand-listed.
 */

export interface ActEntry {
  readonly functor: string;
  readonly arity: number;
  readonly label: string;
  readonly argumentHint: string;
}

export interface AtomEntry {
  readonly atom: string;
  readonly label: string;
  /** Alternate English spellings/phrasings a question might use. */
  readonly aliases?: readonly string[];
}

/**
 * A situation the asker can assert about themselves, as distinct from the act
 * they are asking about.
 *
 * These are the only atoms allowed inside `circumstance/1`, and they are
 * deliberately a separate list from `KNOWN_ATOMS`: a circumstance unlocks a
 * concession, so letting the grounding stage put an arbitrary atom there
 * would let a mis-parse hand out an exemption.
 */
export interface CircumstanceEntry {
  readonly atom: string;
  readonly label: string;
  /** How a question signals this circumstance, for the grounding prompt. */
  readonly cue: string;
  readonly aliases?: readonly string[];
}

export const KNOWN_ACTS: readonly ActEntry[] = [
  { functor: "mistreat", arity: 1, label: "mistreating / disrespecting", argumentHint: "a relative" },
  { functor: "consume", arity: 1, label: "eating or drinking", argumentHint: "a foodstuff or drink" },
  { functor: "consume_beyond_need", arity: 1, label: "eating or drinking more than is needed to survive", argumentHint: "a foodstuff or drink" },
  { functor: "sell", arity: 1, label: "selling / entering into", argumentHint: "a kind of sale contract" },
  { functor: "lend", arity: 1, label: "lending under", argumentHint: "a kind of loan" },
  { functor: "borrow", arity: 1, label: "borrowing under / paying interest on", argumentHint: "a kind of loan" },
  { functor: "give", arity: 1, label: "giving / offering", argumentHint: "a payment such as a bribe" },
  { functor: "take", arity: 1, label: "taking / accepting", argumentHint: "a payment such as a bribe" },
  { functor: "play", arity: 1, label: "taking part in", argumentHint: "a game of chance" },
  { functor: "shorten", arity: 1, label: "shortening", argumentHint: "an act of worship" },
  { functor: "omit", arity: 1, label: "omitting / not performing", argumentHint: "an obligation" },
  { functor: "perform", arity: 1, label: "performing", argumentHint: "an act of worship" },
  { functor: "maintain", arity: 1, label: "keeping ties with / staying in touch with", argumentHint: "a relative" },
  { functor: "document", arity: 1, label: "writing down / recording", argumentHint: "a debt or agreement" },
  { functor: "make_up", arity: 1, label: "making up (performing later, in place of what was missed)", argumentHint: "an act of worship" },
  { functor: "pay", arity: 1, label: "paying / giving", argumentHint: "a due such as a ransom" },
  { functor: "hunt", arity: 1, label: "hunting", argumentHint: "game" },
  { functor: "marry", arity: 1, label: "marrying", argumentHint: "a relative or in-law" },
  { functor: "give_zakat_to", arity: 1, label: "giving one's zakat to", argumentHint: "a recipient or relative" },
  { functor: "speak", arity: 1, label: "saying / engaging in", argumentHint: "a kind of speech" },
  { functor: "wear", arity: 1, label: "wearing", argumentHint: "a material or adornment" },
  { functor: "touch", arity: 1, label: "touching", argumentHint: "an object such as the mushaf" },
  { functor: "kiss", arity: 1, label: "kissing", argumentHint: "a person such as one's spouse" },
  { functor: "divorce", arity: 1, label: "divorcing", argumentHint: "one's wife, in a given state" },
  { functor: "use", arity: 1, label: "using", argumentHint: "an object or practice such as contraception" },
  { functor: "care_for", arity: 1, label: "caring for / sponsoring", argumentHint: "a person such as an orphan" },
  { functor: "give_surname_to", arity: 1, label: "giving one's own surname / lineage to", argumentHint: "an adopted child" },
  { functor: "commit", arity: 1, label: "committing", argumentHint: "a grave act such as theft" },
  { functor: "practise", arity: 1, label: "practising", argumentHint: "a practice such as magic" },
  { functor: "consult", arity: 1, label: "consulting / going to", argumentHint: "a person such as a fortune-teller" },
  { functor: "spy_on", arity: 1, label: "spying on", argumentHint: "another person" },
  { functor: "mock", arity: 1, label: "mocking / ridiculing", argumentHint: "another person" },
  { functor: "return", arity: 1, label: "returning / replying to", argumentHint: "a greeting" },
  { functor: "get", arity: 1, label: "getting / having done", argumentHint: "a body modification such as a tattoo" },
  { functor: "fulfil", arity: 1, label: "fulfilling / honouring", argumentHint: "a contract" },
  { functor: "hoard", arity: 1, label: "hoarding", argumentHint: "a commodity people need" },
  { functor: "obey", arity: 1, label: "obeying", argumentHint: "a person such as one's parents" },
  { functor: "imitate", arity: 1, label: "imitating", argumentHint: "the opposite sex, in dress or manner" },
  { functor: "eat_with", arity: 1, label: "eating or drinking with", argumentHint: "a hand" },
  { functor: "visit", arity: 1, label: "visiting", argumentHint: "a person such as someone sick" },
  { functor: "keep", arity: 1, label: "keeping (as a pet)", argumentHint: "an animal" },
];

export const KNOWN_ATOMS: readonly AtomEntry[] = [
  { atom: "mother", label: "one's mother" },
  { atom: "father", label: "one's father" },
  { atom: "grandmother", label: "one's grandmother" },
  { atom: "son", label: "one's son" },
  { atom: "daughter", label: "one's daughter" },
  { atom: "brother", label: "one's brother" },
  { atom: "sister", label: "one's sister" },
  { atom: "aunt_maternal", label: "maternal aunt (al-khala, mother's sister)", aliases: ["maternal aunt", "khala"] },
  { atom: "aunt_paternal", label: "paternal aunt (al-amma, father's sister)", aliases: ["paternal aunt", "amma"] },
  { atom: "uncle_maternal", label: "maternal uncle (al-khal, mother's brother)", aliases: ["maternal uncle", "khal"] },
  { atom: "uncle_paternal", label: "paternal uncle (al-amm, father's brother)", aliases: ["paternal uncle", "amm"] },
  { atom: "cousin_paternal", label: "a paternal cousin (child of the father's brother or sister)", aliases: ["cousin on my father's side", "father's brother's daughter"] },
  { atom: "cousin_maternal", label: "a maternal cousin (child of the mother's brother or sister)", aliases: ["cousin on my mother's side", "mother's sister's daughter"] },
  { atom: "niece", label: "a niece (brother's or sister's daughter)", aliases: ["my brother's daughter", "my sister's daughter"] },
  { atom: "mother_in_law", label: "one's wife's mother", aliases: ["mother-in-law", "wife's mother"] },
  { atom: "wifes_sister", label: "one's wife's sister, while married to her", aliases: ["sister-in-law", "wife's sister"] },
  { atom: "wifes_aunt", label: "one's wife's paternal or maternal aunt, while married to her", aliases: ["wife's aunt"] },
  { atom: "milk_mother", label: "a woman who nursed one as an infant", aliases: ["wet nurse", "foster mother by nursing"] },
  { atom: "milk_sibling", label: "someone nursed by the same woman", aliases: ["milk brother", "milk sister", "foster sibling by nursing"] },
  { atom: "carrion", label: "carrion (an animal dead otherwise than by lawful slaughter)", aliases: ["carcass", "dead animal meat"] },
  { atom: "swine", label: "swine / pork", aliases: ["pork", "pig meat"] },
  { atom: "blood", label: "blood" },

  // Food beyond the four named in Qur'an 5:3
  { atom: "dead_fish", label: "a fish that died in the water rather than being caught", aliases: ["dead fish", "fish found dead", "seafood that died on its own"] },
  { atom: "floating_dead_fish", label: "a fish that died of itself and floated to the surface", aliases: ["floating fish", "fish floating dead"] },
  { atom: "locust", label: "locusts", aliases: ["grasshoppers", "locust"] },
  { atom: "residual_blood", label: "the blood left in meat after lawful slaughter", aliases: ["blood in the meat", "blood left in the veins", "pink juice in steak"] },
  { atom: "lion", label: "a lion" },
  { atom: "wolf", label: "a wolf" },
  { atom: "domestic_donkey", label: "the meat of a domestic donkey", aliases: ["donkey meat"] },
  { atom: "horse_meat", label: "horse meat", aliases: ["horse"] },

  // Intoxicants
  { atom: "khamr", label: "khamr (grape wine)", aliases: ["wine", "alcohol"] },
  { atom: "nabidh", label: "nabidh (fermented date or raisin infusion)", aliases: ["date wine"] },
  { atom: "beer", label: "beer" },
  { atom: "spirits", label: "spirits (distilled liquor)", aliases: ["liquor", "vodka", "whisky"] },
  { atom: "sip_of_khamr", label: "a sip of wine, below the intoxicating amount", aliases: ["a small amount of alcohol", "one drink"] },
  { atom: "narcotic", label: "a narcotic or recreational drug", aliases: ["drugs", "cannabis", "hashish", "cocaine"] },

  // Contracts and dealings
  { atom: "interest_loan", label: "a loan repaid with stipulated interest", aliases: ["interest", "usury", "a bank loan with interest", "a conventional mortgage", "a credit card balance with interest", "earning interest on savings"] },
  { atom: "unequal_gold_exchange", label: "exchanging gold for gold in unequal amounts", aliases: ["gold for gold", "currency exchange at unequal weight"] },
  { atom: "unborn_calf", label: "an animal not yet born, or not yet conceived", aliases: ["unborn animal", "an unborn calf", "next year's offspring"] },
  {
    atom: "fish_still_in_water",
    // Distinguished from salam by what is *unspecified*, not by the delay.
    // Both are sales of goods not yet in hand; only this one leaves the
    // quantity and the delivery unfixed, which is the whole difference.
    label: "an uncaught catch, with nothing fixed about how much will be caught or whether it will be",
    aliases: ["fish still in the sea", "whatever the net brings up", "the catch before it is caught"],
  },
  { atom: "maysir", label: "maysir (gambling)", aliases: ["gambling", "betting", "a wager", "the lottery"] },
  { atom: "bribe", label: "a bribe", aliases: ["bribery", "a kickback", "paying an official to look away"] },
  { atom: "spot_sale", label: "an ordinary sale, goods and price exchanged at once", aliases: ["a normal sale", "buying something outright"] },
  {
    atom: "salam_contract",
    label:
      "salam — paying in full now for goods whose quantity, quality and delivery date are all fixed at the time of contract",
    aliases: ["paying upfront for a fixed order", "advance purchase of a specified quantity"],
  },

  // Acts of worship
  { atom: "obligatory_prayer", label: "an obligatory prayer", aliases: ["salah", "the prayer", "prayers"] },
  { atom: "fasting", label: "fasting in Ramadan", aliases: ["the fast", "fasting", "Ramadan"] },
  { atom: "tayammum", label: "tayammum (dry ablution with clean earth)", aliases: ["dry ablution", "wiping with earth instead of washing"] },
  { atom: "fidya", label: "fidya — the ransom of feeding a poor person for each fast missed", aliases: ["ransom for missed fasts", "feeding a poor person instead of fasting"] },
  { atom: "hajj", label: "hajj, the pilgrimage to Mecca", aliases: ["pilgrimage", "the hajj"] },
  { atom: "zakat", label: "zakat, the obligatory alms", aliases: ["zakah", "alms", "obligatory charity"] },
  { atom: "the_poor", label: "the poor", aliases: ["a poor person", "someone in poverty"] },
  { atom: "the_needy", label: "the needy (al-masakin)", aliases: ["a needy person"] },
  { atom: "debtor", label: "a debtor unable to repay", aliases: ["someone in debt"] },
  { atom: "wayfarer", label: "a stranded traveller", aliases: ["ibn al-sabil", "a traveller cut off from their money"] },
  { atom: "wealthy_person", label: "someone already wealthy", aliases: ["a rich person"] },

  // Speech and dress
  { atom: "backbiting", label: "backbiting — mentioning someone absent with what they would dislike", aliases: ["gossip", "ghiba", "talking behind someone's back"] },
  { atom: "lie", label: "a lie", aliases: ["lying", "telling a lie", "saying something untrue"] },
  { atom: "gold", label: "gold jewellery or adornment", aliases: ["a gold ring", "gold chain"] },
  { atom: "silk", label: "pure silk clothing", aliases: ["silk", "a silk shirt"] },
  { atom: "additional_hajj", label: "a further hajj after the first", aliases: ["a second hajj", "hajj again", "another hajj"] },
  { atom: "tawaf", label: "tawaf — circling the Ka'ba", aliases: ["circumambulation", "circling the Kaaba"] },
  { atom: "land_game", label: "land game — wild animals hunted on land", aliases: ["deer", "game birds", "hunting animals"] },
  { atom: "sea_game", label: "sea game — fish and other creatures of the sea", aliases: ["fishing", "fish"] },

  // Other
  { atom: "debt", label: "a debt owed for a fixed term", aliases: ["a loan between people", "money owed"] },
  { atom: "instalment_sale", label: "an instalment sale — a higher price for deferred payment, fixed at contract", aliases: ["buying in instalments", "paying monthly", "hire purchase"] },
  // Prayer
  { atom: "friday_prayer", label: "the Friday prayer (jumu'a)", aliases: ["jumuah", "jummah", "Friday prayer"] },
  { atom: "sitting_prayer", label: "praying an obligatory prayer sitting down", aliases: ["praying sitting", "praying on a chair"] },
  { atom: "combined_prayers", label: "combining two prayers in one time (dhuhr with asr, maghrib with isha)", aliases: ["combining prayers", "jam'"] },
  { atom: "witr", label: "the witr prayer", aliases: ["witr"] },
  { atom: "night_prayer", label: "voluntary night prayer (tahajjud / qiyam al-layl)", aliases: ["tahajjud", "qiyam", "praying at night"] },
  { atom: "wiping_over_khuffs", label: "wiping over leather socks (khuffs) in wudu", aliases: ["wiping over socks", "masah on socks"] },
  { atom: "mushaf", label: "a physical copy of the Qur'an (mushaf)", aliases: ["the Quran", "a Quran copy"] },
  // Fasting
  { atom: "eid_fast", label: "fasting on the day of Eid (al-Fitr or al-Adha)", aliases: ["fasting on Eid"] },
  { atom: "arafah_fast", label: "fasting on the day of 'Arafa (9 Dhu al-Hijja)", aliases: ["fasting Arafah", "day of Arafat fast"] },
  { atom: "ashura_fast", label: "fasting on the day of 'Ashura (10 Muharram)", aliases: ["fasting Ashura"] },
  { atom: "friday_only_fast", label: "fasting on Friday alone, without the day before or after", aliases: ["fasting only on Friday"] },
  { atom: "spouse", label: "one's spouse", aliases: ["my wife", "my husband"] },
  // Marriage
  { atom: "christian_or_jewish_woman", label: "a Christian or Jewish woman (of the People of the Book)", aliases: ["a Christian woman", "a Jewish woman", "a kitabiyya"] },
  { atom: "non_muslim_man", label: "a non-Muslim man (asked about a Muslim woman marrying him)", aliases: ["a Christian man", "a non-Muslim husband"] },
  { atom: "polytheist_woman", label: "a polytheist (idol-worshipping) woman", aliases: ["a mushrik woman", "a Hindu woman"] },
  { atom: "fifth_wife", label: "a fifth wife, while already married to four", aliases: ["more than four wives"] },
  { atom: "woman_in_iddah", label: "a woman still in her waiting period ('idda) after divorce or widowhood", aliases: ["a woman in iddah", "a recently divorced woman before her iddah ends"] },
  { atom: "wife", label: "one's wife", aliases: ["my wife"] },
  { atom: "wife_during_menstruation", label: "one's wife while she is menstruating", aliases: ["my wife during her period"] },
  { atom: "contraception", label: "contraception (withdrawal or reversible birth control)", aliases: ["birth control", "the pill", "condoms", "'azl"] },
  { atom: "orphan", label: "an orphan", aliases: ["an orphan child"] },
  { atom: "adopted_child", label: "an adopted child (as to their name and lineage)", aliases: ["my adopted son", "my adopted daughter"] },
  // Ethics
  { atom: "suicide", label: "suicide", aliases: ["killing oneself"] },
  { atom: "murder", label: "killing someone unlawfully", aliases: ["killing", "murder"] },
  { atom: "theft", label: "theft", aliases: ["stealing"] },
  { atom: "magic", label: "magic / sorcery (sihr)", aliases: ["sorcery", "witchcraft", "black magic"] },
  { atom: "fortune_teller", label: "a fortune-teller or astrologer", aliases: ["a psychic", "horoscopes", "tarot reader"] },
  { atom: "someone", label: "another person", aliases: ["people", "others", "my spouse's phone"] },
  { atom: "greeting_of_peace", label: "the greeting of peace (salam)", aliases: ["salam", "assalamu alaykum"] },
  { atom: "tattoo", label: "a permanent tattoo", aliases: ["tattoos", "getting inked"] },
  { atom: "contract", label: "a lawful contract or agreement", aliases: ["a contract", "an agreement", "a deal"] },
  { atom: "oath_expiation", label: "the expiation (kaffara) for a broken oath", aliases: ["kaffara", "expiation for an oath"] },
  { atom: "gold_or_silver_vessel", label: "a vessel or plate made of gold or silver", aliases: ["gold cups", "silver plates", "gold utensils"] },
  { atom: "tobacco", label: "tobacco / smoking", aliases: ["smoking", "cigarettes", "vaping", "shisha"] },
  // Trade
  { atom: "goods_not_owned", label: "a specific item one does not yet own or possess (not a salam order)", aliases: ["selling something I don't have", "dropshipping before I own the item"] },
  { atom: "staple_food", label: "staple goods people need, held back to raise their price", aliases: ["hoarding food", "stockpiling to raise prices"] },
  { atom: "goods_with_concealed_defect", label: "goods with a defect hidden from the buyer", aliases: ["hiding a defect", "cheating the buyer"] },
  { atom: "offer_undercutting_a_sale", label: "an offer made to break up a sale already agreed between two others", aliases: ["undercutting someone's deal", "selling over another's sale"] },
  // Animals
  { atom: "camel", label: "camel meat", aliases: ["camel"] },
  { atom: "cow", label: "beef / cattle", aliases: ["beef", "cow", "cattle"] },
  { atom: "sheep", label: "lamb / mutton", aliases: ["lamb", "mutton", "sheep"] },
  { atom: "goat", label: "goat meat", aliases: ["goat"] },
  { atom: "chicken", label: "chicken", aliases: ["poultry"] },
  { atom: "rabbit", label: "rabbit", aliases: ["hare"] },
  { atom: "dabb_lizard", label: "the dabb (desert monitor lizard)", aliases: ["lizard", "dhabb"] },
  { atom: "eagle", label: "an eagle" },
  { atom: "hawk", label: "a hawk" },
  { atom: "falcon", label: "a falcon" },
  { atom: "vulture", label: "a vulture" },
  { atom: "tiger", label: "a tiger" },
  { atom: "leopard", label: "a leopard" },
  { atom: "ahl_al_kitab_meat", label: "meat slaughtered by Jews or Christians (People of the Book)", aliases: ["kosher meat", "meat from Christians", "non-halal-labelled meat from Jews or Christians"] },
  { atom: "shrimp", label: "shrimp / prawns and other shellfish", aliases: ["prawns", "shellfish", "lobster", "crab"] },
  { atom: "duck", label: "duck" },
  { atom: "turkey", label: "turkey" },
  { atom: "pigeon", label: "pigeon" },
  { atom: "quail", label: "quail" },
  { atom: "fish", label: "fish, caught or bought", aliases: ["salmon", "tuna", "seafood (fish)"] },
  // Worship, manners and dress (second batch)
  { atom: "congregational_prayer", label: "praying in congregation (jama'a)", aliases: ["praying in the mosque", "jamaah"] },
  { atom: "shawwal_fast", label: "the six voluntary fasts of Shawwal", aliases: ["six days of Shawwal"] },
  { atom: "monday_thursday_fast", label: "voluntary fasting on Mondays and Thursdays", aliases: ["fasting Mondays and Thursdays"] },
  { atom: "parents", label: "one's parents", aliases: ["my parents", "my mother and father"] },
  { atom: "slander", label: "slander — saying something untrue about someone (buhtan)", aliases: ["false accusation", "spreading lies about someone"] },
  { atom: "hijab", label: "the head-covering (hijab / khimar)", aliases: ["headscarf", "covering the hair"] },
  { atom: "opposite_sex", label: "the opposite sex, in dress, manner or adornment", aliases: ["cross-dressing", "men dressing like women", "women dressing like men"] },
  { atom: "left_hand", label: "the left hand", aliases: ["left hand"] },
  { atom: "sick_person", label: "someone who is ill", aliases: ["the sick", "a sick friend"] },
  { atom: "cat", label: "a cat", aliases: ["cats", "a kitten"] },
  { atom: "perfume", label: "perfume or scented products", aliases: ["cologne", "fragrance"] },
  { atom: "haircut", label: "cutting or shaving the hair", aliases: ["shaving my head", "trimming hair"] },
  // Charity
  { atom: "zakat_al_fitr", label: "zakat al-fitr, the alms due at the end of Ramadan", aliases: ["fitrana", "sadaqat al-fitr"] },
  { atom: "voluntary_charity", label: "voluntary charity (sadaqa)", aliases: ["sadaqa", "charity", "donating"] },
];

export const KNOWN_CIRCUMSTANCES: readonly CircumstanceEntry[] = [
  {
    atom: "starvation",
    label: "facing starvation — a genuine threat to life from lack of food",
    cue: "the asker says they are starving, have no other food, or would die without eating this",
    aliases: ["starving", "famine", "no other food"],
  },
  {
    atom: "travel",
    label: "on a journey",
    cue: "the asker says they are travelling, on a journey, or away from home",
    aliases: ["travelling", "on a trip", "away from home"],
  },
  {
    atom: "illness",
    label: "ill",
    cue: "the asker says they are ill, sick, or unwell",
    aliases: ["sick", "unwell", "not well"],
  },
  {
    atom: "water_unavailable",
    label: "with no water available for ablution",
    cue: "the asker says there is no water, or none they can reach or use",
    aliases: ["no water", "cannot find water"],
  },
  {
    atom: "menstruation",
    label: "menstruating",
    cue: "the asker says they are on their period or menstruating",
    aliases: ["on my period", "menstruating"],
  },
  {
    atom: "too_old_to_fast",
    label: "too old to fast, with no prospect of being able to",
    cue: "the asker says they are elderly and cannot fast, or asks about an elderly person who cannot",
    aliases: ["too old to fast", "elderly and unable to fast"],
  },
  {
    atom: "no_intention",
    label: "did the act without intending it as that act of worship",
    cue: "the asker says they did it without intending it, e.g. went without food all day without meaning to fast",
    aliases: ["without intention", "didn't intend to fast", "no niyya"],
  },
  {
    atom: "able_to_perform_hajj",
    label: "able to perform hajj — with the health, means and safe passage for it",
    cue: "the asker says they can afford hajj and are able to make the journey",
    aliases: ["can afford hajj", "able to go on pilgrimage"],
  },
  {
    atom: "nisab_held_for_year",
    label: "holding wealth at or above the nisab for a full lunar year",
    cue: "the asker says their savings or trade goods have reached the nisab and been held a year",
    aliases: ["my savings are above nisab", "I have had this money a year"],
  },
  {
    atom: "male",
    label: "male",
    cue: "the asker says they are a man or boy, or asks what is permitted to men",
    aliases: ["a man", "for men", "I'm a guy"],
  },
  {
    atom: "female",
    label: "female",
    cue: "the asker says they are a woman or girl, or asks what is permitted to women",
    aliases: ["a woman", "for women", "I'm a girl"],
  },
  {
    atom: "skin_ailment",
    label: "suffering a skin condition such as itching that the material relieves",
    cue: "the asker says they have an itch, rash or skin condition that other fabrics aggravate",
    aliases: ["itchy skin", "eczema", "a rash"],
  },
  {
    atom: "complaining_of_wrong",
    label: "describing a wrong done to them, to someone able to remedy it",
    cue: "the asker says they were wronged and want to tell a judge, authority or someone who can help",
    aliases: ["reporting someone who wronged me", "complaining to a judge"],
  },
  {
    atom: "reconciling_people",
    label: "trying to reconcile two people who have fallen out",
    cue: "the asker says they are trying to make peace between people",
    aliases: ["making peace between friends", "reconciling a quarrel"],
  },
  {
    atom: "ihram",
    label: "in ihram, the consecrated state of hajj or 'umra",
    cue: "the asker says they are in ihram, or on hajj or 'umra having entered ihram",
    aliases: ["in ihram", "on pilgrimage in ihram"],
  },
  {
    atom: "certain_prior_purity",
    label: "certain of having been in a state of purity beforehand",
    cue: "the asker says they know they had wudu, and are now unsure whether they broke it",
    aliases: ["I had wudu", "I know I was pure"],
  },
  {
    atom: "doubt_about_breaking_purity",
    label: "unsure whether that purity was broken",
    cue: "the asker says they are not sure whether they broke wudu",
    aliases: ["not sure if I broke wudu", "I might have broken it"],
  },
  {
    atom: "ritual_impurity",
    label: "in a state of ritual impurity (without wudu or ghusl)",
    cue: "the asker says they have not performed wudu or ghusl, or are in a state of janaba",
    aliases: ["without wudu", "not in a state of purity", "junub"],
  },
  {
    atom: "ate_forgetfully",
    label: "ate or drank while fasting, having forgotten they were fasting",
    cue: "the asker says they ate or drank by mistake or forgot they were fasting",
    aliases: ["ate by mistake", "forgot I was fasting"],
  },
  {
    atom: "currently_fasting",
    label: "fasting at the time",
    cue: "the asker says they are fasting right now, or asks about doing something while fasting",
    aliases: ["while fasting", "during Ramadan daytime"],
  },
  {
    atom: "pregnant",
    label: "pregnant",
    cue: "the asker says they are pregnant",
    aliases: ["expecting"],
  },
  {
    atom: "nursing",
    label: "breastfeeding a child",
    cue: "the asker says they are breastfeeding or nursing a baby",
    aliases: ["breastfeeding"],
  },
  {
    atom: "missed_prayer",
    label: "having missed an obligatory prayer",
    cue: "the asker says they missed, forgot or slept through a prayer",
    aliases: ["missed fajr", "slept through a prayer"],
  },
  {
    atom: "parents_command_sin",
    label: "being told by one's parents to do something sinful",
    cue: "the asker says their parents are telling them to do something forbidden or to abandon an obligation",
    aliases: ["my parents tell me to do something haram"],
  },
  {
    atom: "broke_oath",
    label: "having broken a deliberate oath",
    cue: "the asker says they swore an oath by Allah and then broke it",
    aliases: ["broke my oath", "broke a promise I swore to Allah"],
  },
];

const ACT_INDEX = new Map<string, ActEntry>(KNOWN_ACTS.map((a) => [`${a.functor}/${a.arity}`, a]));
const ATOM_INDEX = new Map<string, AtomEntry>(KNOWN_ATOMS.map((a) => [a.atom, a]));
const CIRCUMSTANCE_INDEX = new Map<string, CircumstanceEntry>(
  KNOWN_CIRCUMSTANCES.map((c) => [c.atom, c])
);

export function findAct(functor: string, arity: number): ActEntry | undefined {
  return ACT_INDEX.get(`${functor}/${arity}`);
}

export function findAtom(name: string): AtomEntry | undefined {
  return ATOM_INDEX.get(name);
}

export function isKnownAtom(name: string): boolean {
  return ATOM_INDEX.has(name);
}

export function findCircumstance(name: string): CircumstanceEntry | undefined {
  return CIRCUMSTANCE_INDEX.get(name);
}

/**
 * Renders the vocabulary as a block for an LLM prompt.
 *
 * `includeCircumstances` is off for the formalisation stage. A hadith
 * establishes what the law is, never that the person reading it is starving,
 * so offering that vocabulary there can only invite a clause that asserts a
 * situation on everyone's behalf. `validateClause` refuses such a clause
 * outright; not advertising the predicate keeps the model from spending
 * attempts on one.
 */
/** True when a label says no more than the atom's own name ("eagle" / "an eagle"). */
function labelIsJustTheName(atom: string, label: string): boolean {
  const words = (text: string) => text.toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/[^a-z]+/g, " ").trim();
  return words(label) === words(atom);
}

/**
 * The vocabulary as the grounding prompt shows it. Compact on purpose: it is
 * sent with every question, the provider limits tokens per minute, and the
 * list grows with the KB — so the boilerplate is said once in the headings
 * rather than on every line, and a label that only repeats the atom's name is
 * left out.
 */
export function lexiconPromptBlock(includeCircumstances = true): string {
  const acts = KNOWN_ACTS.map((a) => `  - ${a.functor}(X): ${a.label} [X: ${a.argumentHint}]`).join("\n");
  const atoms = KNOWN_ATOMS.map((a) => {
    const label = labelIsJustTheName(a.atom, a.label) ? "" : `: ${a.label}`;
    const aliasText = a.aliases?.length ? ` | ${a.aliases.join("; ")}` : "";
    return `  - ${a.atom}${label}${aliasText}`;
  }).join("\n");
  const base =
    `Known acts (X must be one of the entities below):\n${acts}\n\n` +
    `Known entities — use exactly these atom names; after "|" are other ways a question may say it:\n${atoms}`;
  if (!includeCircumstances) return base;

  const circumstances = KNOWN_CIRCUMSTANCES.map((c) => `  - ${c.atom}: ${c.label}. Only if ${c.cue}.`).join("\n");
  return (
    `${base}\n\nKnown circumstances — about the ASKER's own situation, not the act; written as ` +
    `circumstance(<name>):\n${circumstances}`
  );
}
