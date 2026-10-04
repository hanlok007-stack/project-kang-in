export const statKeys = ['dribbling','passing','shooting','control','vision','speed','stamina','mentality'] as const;
export type StatKey = typeof statKeys[number];
export type Stats = Record<StatKey, number>;
export type Effects = Partial<Record<StatKey | 'condition' | 'fatigue' | 'happiness' | 'trust' | 'language' | 'popularity' | 'teamwork', number>>;
export type Route = 'korea' | 'spain';
export type Position = 'CAM' | 'RW' | 'CM';
export interface Choice { label:string; description:string; effects:Effects; flags?:string[]; route?:Route; position?:Position }
export interface StoryEvent { id:string; chapter:number; title:string; body:string; category:string; choices:Choice[]; condition?:{flag?:string;route?:Route;min?:Partial<Record<keyof Effects,number>>} }
export interface Activity { id:string; name:string; subtitle:string; icon:string; group:string; effects:Effects; tags:string[] }
export interface LogEntry { turn:number; date?:string; legacy?:boolean; title:string; body:string; kind:'training'|'event'|'match'|'chapter'|'butterfly'; changes?:Effects }
export interface Match { opponent:string; context?:string; minute:number; home:number; away:number; probabilities:number[]; result?:string; success?:boolean; rating?:number; played?:boolean; goals?:number; assists?:number }
export interface Season {year:number;appearances:number;goals:number;assists:number;wins:number;ratingTotal:number}
export interface SeasonResult extends Season {goalMet:boolean}
export interface Ending { id:string; title:string; subtitle:string; body:string; color:string }
export interface GameState {
 version:2; seed:number; turn:number; phase:'planning'|'event'|'match'|'summary'|'ended';
 stats:Stats; condition:number; fatigue:number; happiness:number; trust:number; language:number; popularity:number; teamwork:number;
 route:Route; position:Position; potential:number; injuryMonths:number; plan:string[]; flags:string[]; seenEvents:string[]; eventId:string|null;
 match:Match|null; logs:LogEntry[]; relations:Record<string,number>; matches:number; goals:number; assists:number; wins:number;
 lastGains:Effects; endingId:string|null;
 previousPlan:string[];legacyTurns:number;legacyEnded:boolean;contract:'youth'|'europe'|'domestic'|'academy';season:Season|null;seasons:SeasonResult[];
}
