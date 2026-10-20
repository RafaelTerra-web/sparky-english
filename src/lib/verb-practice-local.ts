import { blankVerbReview, normalizeVerbReview, type VerbReview } from './verb-practice.ts';
const key=(userId:string)=>`sparky-learning:${encodeURIComponent(userId)}:verbs:v1`;
export function readVerbReview(userId:string):VerbReview{try{const raw=localStorage.getItem(key(userId));return raw&&raw.length<30000?normalizeVerbReview(JSON.parse(raw)):blankVerbReview();}catch{return blankVerbReview();}}
export function saveVerbReview(userId:string,review:VerbReview){try{localStorage.setItem(key(userId),JSON.stringify(normalizeVerbReview(review)));return true;}catch{return false;}}
