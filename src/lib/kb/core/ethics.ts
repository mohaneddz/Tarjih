/**
 * Ethics: the grave prohibitions against life and property, the unseen
 * (magic, fortune-telling), how people are treated in speech and in
 * private, the body, oaths and contracts, and luxury.
 *
 * Mostly direct prohibitions stated by a text, so mostly single facts — the
 * value of formalising them is less in the reasoning than in coverage, and in
 * having each answer carry its text. Tobacco is the exception: no text names
 * it, so its ruling is reached through the harm maxim, and the engine shows
 * that it is reasoned rather than stated, with the weaker strength that
 * deserves.
 */

import type { KbEntry } from "../entry";

export const ETHICS: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Life and property
  // -------------------------------------------------------------------------
  {
    id: "quran:4-29:suicide",
    clause: "ruling(commit(suicide), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:29; Sahih al-Bukhari 5778",
      text: "And do not kill yourselves. Indeed, Allah is ever Merciful to you.",
      textArabic: "وَلَا تَقْتُلُوا أَنفُسَكُمْ ۚ إِنَّ اللَّهَ كَانَ بِكُمْ رَحِيمًا",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Among the gravest sins. Someone in this situation should speak to a person they " +
        "trust or a crisis line now; the engine is not a substitute for that.",
    },
  },
  {
    id: "quran:17-33:killing",
    clause: "ruling(commit(murder), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:33; Qur'an 5:32",
      text: "And do not kill the soul which Allah has forbidden, except by right.",
      textArabic: "وَلَا تَقْتُلُوا النَّفْسَ الَّتِي حَرَّمَ اللَّهُ إِلَّا بِالْحَقِّ",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "quran:5-38:theft",
    clause: "ruling(commit(theft), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:38",
      text: "As for the thief, male or female, cut off their hands in recompense for what they committed.",
      textArabic: "وَالسَّارِقُ وَالسَّارِقَةُ فَاقْطَعُوا أَيْدِيَهُمَا جَزَاءً بِمَا كَسَبَا",
      thubut: "qati",
      dalala: "qati",
      notes:
        "A prescribed penalty presupposes a prohibition. The penalty itself is applied only by " +
        "a court, under strict conditions; it is not a matter for individuals.",
    },
  },

  // -------------------------------------------------------------------------
  // The unseen
  // -------------------------------------------------------------------------
  {
    id: "quran:2-102:magic",
    clause: "ruling(practise(magic), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:102",
      text: "It was not Solomon who disbelieved, but the devils disbelieved, teaching people magic.",
      textArabic: "وَمَا كَفَرَ سُلَيْمَانُ وَلَٰكِنَّ الشَّيَاطِينَ كَفَرُوا يُعَلِّمُونَ النَّاسَ السِّحْرَ",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "muslim:2230:fortune-tellers",
    clause: "ruling(consult(fortune_teller), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 2230",
      text:
        "Whoever goes to a fortune-teller and asks him about anything, his prayer is not " +
        "accepted for forty nights.",
      textArabic: "مَنْ أَتَى عَرَّافًا فَسَأَلَهُ عَنْ شَيْءٍ لَمْ تُقْبَلْ لَهُ صَلَاةٌ أَرْبَعِينَ لَيْلَةً",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "The prohibition is inferred from the penalty, hence probable in indication. Believing " +
        "what the fortune-teller says is treated more gravely still (Abu Dawud 3904). " +
        "Horoscopes are the same question.",
    },
  },

  // -------------------------------------------------------------------------
  // How people are treated
  // -------------------------------------------------------------------------
  {
    id: "quran:49-12:spying",
    clause: "ruling(spy_on(someone), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 49:12",
      text: "O you who believe, avoid much suspicion; some suspicion is sin. And do not spy.",
      textArabic: "وَلَا تَجَسَّسُوا",
      thubut: "qati",
      dalala: "qati",
      notes: "Includes reading another's messages or private papers without leave.",
    },
  },
  {
    id: "quran:49-11:mockery",
    clause: "ruling(mock(someone), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 49:11",
      text: "O you who believe, let not a people ridicule another people; perhaps they may be better than them.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا يَسْخَرْ قَوْمٌ مِّن قَوْمٍ عَسَىٰ أَن يَكُونُوا خَيْرًا مِّنْهُمْ",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "quran:4-86:returning-salam",
    clause: "ruling(return(greeting_of_peace), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:86",
      text: "And when you are greeted with a greeting, greet with one better than it or return it.",
      textArabic: "وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا بِأَحْسَنَ مِنْهَا أَوْ رُدُّوهَا",
      thubut: "qati",
      dalala: "qati",
      notes: "A communal obligation for a group greeted together: one reply suffices for all.",
    },
  },
  {
    id: "muslim:54:spreading-salam",
    clause: "ruling(give(greeting_of_peace), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 54",
      text:
        "You will not enter Paradise until you believe, and you will not believe until you love " +
        "one another. Shall I not tell you of something which, if you do it, you will love one " +
        "another? Spread the greeting of peace among you.",
      textArabic: "أَفْشُوا السَّلَامَ بَيْنَكُمْ",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes: "Initiating the greeting is sunnah; returning it is the obligation (4:86).",
    },
  },

  // -------------------------------------------------------------------------
  // The body
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5931:tattooing",
    clause: "ruling(get(tattoo), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5931, Sahih Muslim 2125",
      text:
        "Allah has cursed the women who tattoo and those who have themselves tattooed, ... " +
        "changing the creation of Allah.",
      textArabic: "لَعَنَ اللَّهُ الْوَاشِمَاتِ وَالْمُسْتَوْشِمَاتِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Ibn Mas'ud's report. A curse marks a major sin. This concerns a permanent tattoo " +
        "under the skin; henna and other temporary dyes are a different matter and permitted.",
    },
  },

  // -------------------------------------------------------------------------
  // Oaths and contracts
  // -------------------------------------------------------------------------
  {
    id: "quran:5-1:fulfil-contracts",
    clause: "ruling(fulfil(contract), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:1",
      text: "O you who believe, fulfil [all] contracts.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ",
      thubut: "qati",
      dalala: "qati",
      notes: "Lawful contracts; a contract on something forbidden binds no one to the forbidden thing.",
    },
  },
  {
    id: "quran:5-89:expiation-of-oaths",
    clause: "ruling(pay(oath_expiation), wajib) :- circumstance(broke_oath).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:89",
      text:
        "Its expiation is the feeding of ten needy people from the average of what you feed " +
        "your families, or clothing them, or freeing a slave; whoever cannot find [the means] " +
        "— then fasting three days.",
      textArabic: "فَكَفَّارَتُهُ إِطْعَامُ عَشَرَةِ مَسَاكِينَ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "For a deliberate oath about the future that was broken. A slip of the tongue (laghw) " +
        "carries no expiation, per the start of the same verse.",
    },
  },

  // -------------------------------------------------------------------------
  // Luxury
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5426:gold-and-silver-vessels",
    clause: "ruling(use(gold_or_silver_vessel), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5426, Sahih Muslim 2067",
      text:
        "Do not drink from vessels of gold and silver, nor eat from plates made of them; they " +
        "are for them in this world and for you in the Hereafter.",
      textArabic: "لَا تَشْرَبُوا فِي آنِيَةِ الذَّهَبِ وَالْفِضَّةِ وَلَا تَأْكُلُوا فِي صِحَافِهَا",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "For men and women alike — unlike gold jewellery, which is permitted to women.",
    },
  },

  // -------------------------------------------------------------------------
  // Tobacco: reached through the harm maxim, not stated by any text
  // -------------------------------------------------------------------------
  {
    id: "fact:tobacco-harms",
    /*
     * The one premise here the KB judges rather than reads. Kept as a
     * separate, probable fact so the ruling's derivation shows it: the
     * conclusion is only as good as this claim about harm, and the strength
     * reflects that.
     */
    clause: "causes(consume(tobacco), darar).",
    evidence: {
      kind: "usul",
      reference: "Established medical evidence that tobacco causes serious harm",
      dalala: "zanni",
      notes:
        "Most contemporary scholars and fatwa bodies hold smoking forbidden on this basis, " +
        "through 'no harm' and 'do not throw yourselves into destruction' (2:195). Earlier " +
        "jurists, before its harm was established, often held it merely disliked.",
    },
  },

  // -------------------------------------------------------------------------
  // Parents
  // -------------------------------------------------------------------------
  {
    id: "quran:17-23:obey-parents",
    clause: "ruling(obey(parents), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:23-24",
      text:
        "And your Lord has decreed that you worship none but Him, and that you be dutiful to " +
        "your parents ... and lower to them the wing of humility out of mercy.",
      textArabic: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "Dutifulness (birr) includes obeying them in what is lawful and within reason; the " +
        "reach of obedience in personal matters is discussed at length by the jurists.",
    },
  },
  {
    id: "quran:31-15:no-obedience-in-sin",
    clause: "ruling(obey(parents), haram) :- circumstance(parents_command_sin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 31:15; Sahih al-Bukhari 7257",
      text:
        "But if they strive to make you associate with Me that of which you have no knowledge, " +
        "do not obey them, but accompany them in this world with kindness.",
      textArabic: "وَإِن جَاهَدَاكَ عَلَىٰ أَن تُشْرِكَ بِي مَا لَيْسَ لَكَ بِهِ عِلْمٌ فَلَا تُطِعْهُمَا ۖ وَصَاحِبْهُمَا فِي الدُّنْيَا مَعْرُوفًا",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Bukhari 7257: 'There is no obedience in disobedience to Allah; obedience is only in " +
        "what is right.' Kindness to them continues regardless.",
    },
  },

  // -------------------------------------------------------------------------
  // Speech, dress and manners
  // -------------------------------------------------------------------------
  {
    id: "quran:33-58:slander",
    clause: "ruling(speak(slander), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 33:58; Sahih Muslim 2589",
      text:
        "Those who harm believing men and women for what they have not earned have borne " +
        "slander and manifest sin.",
      textArabic: "وَالَّذِينَ يُؤْذُونَ الْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ بِغَيْرِ مَا اكْتَسَبُوا فَقَدِ احْتَمَلُوا بُهْتَانًا وَإِثْمًا مُّبِينًا",
      thubut: "qati",
      dalala: "qati",
      notes: "Muslim 2589: saying of someone what is untrue is slander (buhtan), worse than backbiting.",
    },
  },
  {
    id: "quran:24-31:head-covering",
    clause: "ruling(wear(hijab), wajib) :- circumstance(female).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 24:31; Qur'an 33:59",
      text: "And let them draw their head-coverings over their chests, and not display their adornment.",
      textArabic: "وَلْيَضْرِبْنَ بِخُمُرِهِنَّ عَلَىٰ جُيُوبِهِنَّ ۖ وَلَا يُبْدِينَ زِينَتَهُنَّ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The four schools agree that an adult woman covers her hair before men who are not " +
        "her mahram; they differ on the face and hands.",
    },
  },
  {
    id: "bukhari:5885:imitating-the-other-sex",
    clause: "ruling(imitate(opposite_sex), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5885",
      text: "The Messenger of Allah cursed men who imitate women and women who imitate men.",
      textArabic: "لَعَنَ رَسُولُ اللَّهِ صلى الله عليه وسلم الْمُتَشَبِّهِينَ مِنَ الرِّجَالِ بِالنِّسَاءِ وَالْمُتَشَبِّهَاتِ مِنَ النِّسَاءِ بِالرِّجَالِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "In dress, manner and adornment specific to the other sex, as custom defines it.",
    },
  },
  {
    id: "muslim:2020:eating-with-the-left-hand",
    clause: "ruling(eat_with(left_hand), makruh).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 2020",
      text: "None of you should eat with his left hand or drink with it, for Satan eats and drinks with his left.",
      textArabic: "لَا يَأْكُلَنَّ أَحَدٌ مِنْكُمْ بِشِمَالِهِ وَلَا يَشْرَبَنَّ بِهَا فَإِنَّ الشَّيْطَانَ يَأْكُلُ بِشِمَالِهِ وَيَشْرَبُ بِهَا",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "Disliked for the majority; some, including a view in the Hanbali school, held it " +
        "forbidden. No dislike where the right hand cannot be used.",
    },
  },
  {
    id: "bukhari:5649:visiting-the-sick",
    clause: "ruling(visit(sick_person), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5649",
      text: "Feed the hungry, visit the sick, and free the captive.",
      textArabic: "أَطْعِمُوا الْجَائِعَ وَعُودُوا الْمَرِيضَ وَفُكُّوا الْعَانِيَ",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes: "Some scholars hold it a communal obligation; for the individual it is a strong sunnah.",
    },
  },
  {
    id: "abudawud:75:cats",
    clause: "ruling(keep(cat), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 75, Jami` at-Tirmidhi 92",
      text: "It is not impure; it is one of those who go around among you.",
      textArabic: "إِنَّهَا لَيْسَتْ بِنَجَسٍ إِنَّهَا مِنَ الطَّوَّافِينَ عَلَيْكُمْ",
      grade: "sahih",
      thubut: "zanni",
      dalala: "zanni",
      notes:
        "Said of a cat drinking from Abu Qatada's wudu water. Keeping one is permitted; " +
        "Bukhari 3318 warns of the woman who starved a cat, so it must be fed and not harmed.",
    },
  },

  // -------------------------------------------------------------------------
  // Ihram
  // -------------------------------------------------------------------------
  {
    id: "bukhari:1542:no-perfume-in-ihram",
    clause: "ruling(use(perfume), haram) :- circumstance(ihram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1542",
      text: "...nor any garment touched by saffron or wars [a fragrant dye].",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      scope: "khass",
      notes: "The schools take it as forbidding perfume to the muhrim; a breach is redeemed by a sacrifice or its alternatives.",
    },
  },
  {
    id: "quran:2-196:no-haircut-in-ihram",
    clause: "ruling(get(haircut), haram) :- circumstance(ihram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:196",
      text: "And do not shave your heads until the sacrificial animal has reached its place.",
      textArabic: "وَلَا تَحْلِقُوا رُءُوسَكُمْ حَتَّىٰ يَبْلُغَ الْهَدْيُ مَحِلَّهُ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes: "The same verse allows it for illness or an ailment of the head, with a ransom.",
    },
  },
];
