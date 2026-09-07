import { b2PressureModules } from "./b2-pressure.ts";
import { b2NarrativeModules } from "./b2-narratives.ts";
import { c1MediationModules } from "./c1-mediation.ts";
import { c1LongListeningModules } from "./c1-long-listening.ts";
import { c2InterculturalModules } from "./c2-intercultural.ts";
import { c2PrecisionModules } from "./c2-precision.ts";

/** Editorial candidates. Publication requires approved audio and human review.
 * Keep separate from the published curriculum until release acceptance passes.
 * Their IDs are reserved here and must not be reused for different lessons.
 */
export const advancedExpansionModules = [
  ...b2PressureModules, ...b2NarrativeModules,
  ...c1MediationModules, ...c1LongListeningModules,
  ...c2InterculturalModules, ...c2PrecisionModules,
];
export const advancedConversations = advancedExpansionModules.flatMap(courseModule => courseModule.lessons.map(lesson => lesson.listening!));
