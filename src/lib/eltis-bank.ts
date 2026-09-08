import "server-only";
import type { EltisSkill, PublicEltisItem } from "./eltis-shared";

export type EltisItem = PublicEltisItem & {
  answer: string;
  explanation: string;
  transcript?: string;
};

const listen = (
  id: string,
  audioId: string,
  prompt: string,
  options: string[],
  answer: string,
  transcript: string,
  explanation: string,
  maxPlays = 1,
): EltisItem => ({ id, audioId, prompt, options, answer, transcript, explanation, maxPlays, section: "Listening", skill: "listening" });
const read = (
  id: string,
  skill: Exclude<EltisSkill, "listening">,
  passage: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
): EltisItem => ({ id, skill, passage, prompt, options, answer, explanation, section: "Reading" });

export const eltisAudioScripts = {
  "bell-work": "Good morning, everyone. Before you open your textbooks, write two sentences explaining why communities create public parks. Work independently for five minutes. Then compare your answer with the person beside you and underline one reason you both included.",
  "lab-safety": "Place your goggles over your eyes before you pick up any equipment. Your partner should check that the glass tube has no cracks. If either of you sees damage, leave the tube on the tray and raise your hand. Do not carry it across the room.",
  "history-project": "Ms. Rivera, do both partners need to speak during the presentation? Yes, each person should explain one source, but you may decide together who introduces the topic. And should our slides include the full paragraphs? No. Use short quotations and explain the evidence in your own words.",
  "math-ratio": "The art club has thirty-six sheets of blue paper. It uses one third of them for posters and divides the remaining sheets equally among four groups. Which expression shows the number of sheets each group receives?",
  "exchange-orientation": "Your host school may feel unfamiliar during the first week. Ask your counselor where to find academic support before you need it. Clubs are also a useful way to meet students who share your interests. You do not have to join immediately; attend a meeting, observe, and decide whether the group suits you.",
  "biology-lecture": "Plants lose water through tiny openings in their leaves. On a hot, dry day, that loss can become faster than the roots can replace it. Some plants respond by closing the openings. This conserves water, although it also limits the carbon dioxide available for photosynthesis.",
  "counselor-schedule": "I can move your chemistry class to second period, but that would place algebra immediately after lunch. Another option is to keep chemistry where it is and move art to Friday afternoon. Look at both schedules tonight, and email me your choice by ten tomorrow morning.",
} as const;

export const eltisBank: EltisItem[] = [
  listen("el-l01", "bell-work", "What should students do first?", ["Write two sentences", "Open their textbooks", "Move into groups", "Underline the textbook"], "Write two sentences", eltisAudioScripts["bell-work"], "The teacher asks students to write before opening the textbook."),
  listen("el-l02", "bell-work", "Why do students compare answers?", ["To identify a shared reason", "To choose a new partner", "To correct two sentences", "To design a public park"], "To identify a shared reason", eltisAudioScripts["bell-work"], "They must underline one reason that appears in both answers."),
  listen("el-l03", "lab-safety", "What must happen before students use the tube?", ["A partner checks it for cracks", "The teacher carries it", "It is filled with water", "The tray is moved"], "A partner checks it for cracks", eltisAudioScripts["lab-safety"], "The partner checks the glass before it is used."),
  listen("el-l04", "lab-safety", "What should a student do after finding damage?", ["Leave the tube and raise a hand", "Carry the tube to the teacher", "Repair the tube with a partner", "Put the tube in a backpack"], "Leave the tube and raise a hand", eltisAudioScripts["lab-safety"], "The direction explicitly says not to carry a damaged tube."),
  listen("el-l05", "history-project", "What is required of both partners?", ["Each must explain one source", "Each must design separate slides", "Both must introduce the topic", "Both must read full paragraphs"], "Each must explain one source", eltisAudioScripts["history-project"], "They may choose the introducer, but each person explains a source."),
  listen("el-l06", "history-project", "What does the teacher recommend for the slides?", ["Short quotations with explanation", "Complete paragraphs from sources", "Pictures without any text", "Only a list of source titles"], "Short quotations with explanation", eltisAudioScripts["history-project"], "The teacher rejects full paragraphs and asks for brief evidence plus explanation."),
  listen("el-l07", "math-ratio", "Which expression represents the calculation?", ["(36 − 36 ÷ 3) ÷ 4", "36 − (3 ÷ 4)", "36 ÷ (3 + 4)", "(36 − 3) × 4"], "(36 − 36 ÷ 3) ÷ 4", eltisAudioScripts["math-ratio"], "Subtract one third of 36, then divide what remains among four groups.", 2),
  listen("el-l08", "exchange-orientation", "What does the speaker advise before academic help is needed?", ["Locate the available support", "Change the class schedule", "Join every school club", "Call the host family"], "Locate the available support", eltisAudioScripts["exchange-orientation"], "The counselor should be asked where support is located in advance."),
  listen("el-l09", "exchange-orientation", "What is the speaker's view of joining a club?", ["Students may observe before deciding", "Students should join on the first day", "Only advanced students should join", "Clubs are mainly for academic support"], "Students may observe before deciding", eltisAudioScripts["exchange-orientation"], "Attending once is presented as a low-pressure way to decide."),
  listen("el-l10", "biology-lecture", "Why might a plant close the openings in its leaves?", ["To reduce water loss", "To absorb more sunlight", "To increase carbon dioxide", "To make its roots grow"], "To reduce water loss", eltisAudioScripts["biology-lecture"], "Closing the openings conserves water."),
  listen("el-l11", "biology-lecture", "What trade-off does the lecturer describe?", ["Saving water can limit photosynthesis", "Growing roots can reduce sunlight", "Dry air can increase carbon dioxide", "Photosynthesis can damage leaves"], "Saving water can limit photosynthesis", eltisAudioScripts["biology-lecture"], "The response conserves water but reduces access to carbon dioxide."),
  listen("el-l12", "counselor-schedule", "What must the student do by ten tomorrow?", ["Email a schedule choice", "Attend chemistry class", "Meet the algebra teacher", "Move art to Friday"], "Email a schedule choice", eltisAudioScripts["counselor-schedule"], "The counselor offers two options and asks for a decision by email."),
  read("el-r01", "grammar", "Maya had reviewed the chapter before the study group met, so she was able to explain the main argument.", "Which sentence best preserves the time relationship?", ["Maya reviewed first; the group met later.", "The group met before Maya reviewed.", "Both events are future plans.", "Maya did not attend the group."], "Maya reviewed first; the group met later.", "Past perfect marks the earlier past event."),
  read("el-r02", "vocabulary", "The principal described the schedule as tentative because the bus company had not confirmed the new route.", "What does tentative most nearly mean?", ["Not yet final", "Carefully hidden", "Unusually early", "Officially canceled"], "Not yet final", "The missing confirmation means the schedule may still change."),
  read("el-r03", "grammar", "The robotics team will test the revised design tomorrow, provided that the replacement motor arrives today.", "What condition must be met?", ["The motor must arrive today", "The design must be replaced", "The test must happen today", "The team must buy a robot"], "The motor must arrive today", "Provided that introduces a necessary condition."),
  read("el-r04", "vocabulary", "Although the article presents a plausible explanation, the author acknowledges that the available evidence is limited.", "What does plausible mean here?", ["Reasonable and possible", "Already proven", "Deliberately misleading", "Impossible to evaluate"], "Reasonable and possible", "Plausible describes an explanation that could be true without saying it is proven."),
  read("el-r05", "reading", "A student council proposed extending library hours during exam week. In a survey, many students supported the idea, but evening attendance records from the previous term were low. The librarian suggested a three-day trial before changing the permanent schedule.", "Why does the librarian suggest a trial?", ["To collect evidence before a lasting change", "To replace the student survey", "To shorten exam week", "To prevent students from using the library"], "To collect evidence before a lasting change", "The survey and earlier attendance point in different directions, so a trial supplies new evidence."),
  read("el-r06", "reading", "A student council proposed extending library hours during exam week. In a survey, many students supported the idea, but evening attendance records from the previous term were low. The librarian suggested a three-day trial before changing the permanent schedule.", "Which statement best summarizes the evidence?", ["Interest is high, but actual evening use has been low", "All available evidence supports permanent hours", "Students oppose opening during exam week", "Attendance records are unavailable"], "Interest is high, but actual evening use has been low", "The passage contrasts reported interest with past behavior."),
  read("el-r07", "grammar", "Neither the coach nor the players ___ aware that the field had been closed.", "Which form completes the sentence?", ["were", "was", "be", "has"], "were", "With neither...nor, the verb commonly agrees with the nearer subject, players."),
  read("el-r08", "vocabulary", "The researcher cautioned that the apparent improvement might reflect a change in the way results were measured.", "What does cautioned mean?", ["Warned against a quick conclusion", "Celebrated the final result", "Refused to collect data", "Repeated an earlier measurement"], "Warned against a quick conclusion", "The researcher identifies an alternative explanation for the improvement."),
  read("el-r09", "reading", "When Malik reached the auditorium, the final rehearsal had already begun. He stood near the back until the director noticed him, then silently held up the repaired costume. The director's tense expression softened, and she pointed toward the dressing room.", "What can reasonably be inferred?", ["The costume's arrival solved an immediate problem", "Malik was performing in the rehearsal", "The director had canceled the event", "The dressing room was locked"], "The costume's arrival solved an immediate problem", "The repaired costume changes the director's visible reaction."),
  read("el-r10", "reading", "When Malik reached the auditorium, the final rehearsal had already begun. He stood near the back until the director noticed him, then silently held up the repaired costume. The director's tense expression softened, and she pointed toward the dressing room.", "Why does the author mention the director's expression?", ["To show the effect of Malik's arrival", "To describe the auditorium lighting", "To prove Malik was late for class", "To explain how the costume broke"], "To show the effect of Malik's arrival", "The shift from tense to softer conveys relief without stating it directly."),
  read("el-r11", "grammar", "The data from the first trial were incomplete; ___, the team postponed its recommendation.", "Which connector best completes the sentence?", ["therefore", "for example", "meanwhile", "otherwise"], "therefore", "The postponement is a result of incomplete data."),
  read("el-r12", "vocabulary", "The new evidence does not contradict the earlier finding; rather, it refines our understanding of when the effect occurs.", "What does refines mean here?", ["Makes more precise", "Completely rejects", "Makes easier to ignore", "Copies without changing"], "Makes more precise", "The evidence narrows or clarifies the earlier conclusion."),
];

export const publicEltisItem = (item: EltisItem): PublicEltisItem => ({
  id: item.id,
  section: item.section,
  skill: item.skill,
  prompt: item.prompt,
  options: item.options,
  ...(item.passage ? { passage: item.passage } : {}),
  ...(item.audioId ? { audioId: item.audioId, maxPlays: item.maxPlays } : {}),
});
