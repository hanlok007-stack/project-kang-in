import { z } from 'zod';
import { EVENTS, chapterOf } from './game';
import { ACTIVITIES, ENDINGS, NPCS } from '../data/game';
import { LAST_TURN, YOUTH_TURNS, legacyTurn, legacyDate, periodOf } from './timeline';
import { statKeys, type GameState } from './types';
const metric=z.number().finite().min(0).max(100);
const effect=z.record(z.number().finite().min(-100).max(100)).refine(e=>Object.keys(e).every(k=>[...statKeys,'condition','fatigue','happiness','trust','language','popularity','teamwork'].includes(k)));
const stats=z.object(Object.fromEntries(statKeys.map(k=>[k,metric])) as Record<typeof statKeys[number],typeof metric>).strict();
const plan=z.array(z.string().max(40)).max(3);
const match=z.object({opponent:z.string().max(80),context:z.string().max(100).optional(),minute:z.number().int().min(0).max(120),home:z.number().int().min(0).max(20),away:z.number().int().min(0).max(20),probabilities:z.array(metric).length(4),result:z.string().max(500).optional(),success:z.boolean().optional(),rating:z.number().finite().min(0).max(10).optional(),played:z.boolean().optional(),goals:z.number().int().min(0).max(1).optional(),assists:z.number().int().min(0).max(1).optional()}).strict().nullable();
const log=(max:number)=>z.object({turn:z.number().int().min(0).max(max),date:z.string().regex(/^\d{4}\.\d{2}$/).optional(),legacy:z.boolean().optional(),title:z.string().max(300),body:z.string().max(2000),kind:z.enum(['training','event','match','chapter','butterfly']),changes:effect.optional()}).strict();
const count=z.number().int().min(0).max(100);
const common={seed:z.number().int().min(1).max(4294967295),phase:z.enum(['planning','event','match','summary','ended']),stats,condition:metric,fatigue:metric,happiness:metric,trust:metric,language:metric,popularity:metric,teamwork:metric,route:z.enum(['korea','spain']),position:z.enum(['CAM','RW','CM']),potential:z.number().finite().min(86).max(97),injuryMonths:z.number().int().min(0).max(1),plan,flags:z.array(z.string().max(100)).max(300),seenEvents:z.array(z.string().max(20)).max(62),eventId:z.string().max(20).nullable(),match,relations:z.record(metric),matches:count,goals:count,assists:count,wins:count,lastGains:effect,endingId:z.string().max(30).nullable()};
const season=z.object({year:z.number().int().min(2021).max(2023),appearances:z.number().int().min(0).max(12),goals:z.number().int().min(0).max(12),assists:z.number().int().min(0).max(12),wins:z.number().int().min(0).max(12),ratingTotal:z.number().finite().min(0).max(120)}).strict();
const stateSchema=z.object({...common,version:z.literal(2),turn:z.number().int().min(0).max(LAST_TURN),logs:z.array(log(LAST_TURN)).max(500),previousPlan:plan.refine(p=>p.length===0||p.length===3),legacyTurns:z.number().int().min(0).max(48),legacyEnded:z.boolean(),contract:z.enum(['youth','europe','domestic','academy']),season:season.nullable(),seasons:z.array(season.extend({goalMet:z.boolean()})).max(3)}).strict();
const legacySchema=z.object({...common,version:z.literal(1),turn:z.number().int().min(0).max(47),logs:z.array(log(47)).max(500),seenEvents:z.array(z.string().max(20)).max(50),matches:count.max(48),goals:count.max(48),assists:count.max(48),wins:count.max(48)}).strict();
export interface Collection {events:string[];endings:string[]}
const collectionSchema=z.object({events:z.array(z.string()).max(62),endings:z.array(z.string()).max(5)}).strict();
const AUTO='kang-in:auto:v2',MANUAL='kang-in:manual:v2',COLLECTION='kang-in:collection:v2';
function checkCommon(n:z.infer<typeof legacySchema>,chapter:number,maxMatches:number,lastTurn:number,legacyEnded=false){
 const validPlan=(p:string[])=>p.every(id=>ACTIVITIES.some(a=>a.id===id)&&p.filter(x=>x===id).length<=2);
 if(!validPlan(n.plan)||n.seenEvents.some(id=>!EVENTS.some(e=>e.id===id))||new Set(n.seenEvents).size!==n.seenEvents.length||n.eventId&&!EVENTS.some(e=>e.id===n.eventId)||n.endingId&&!ENDINGS.some(e=>e.id===n.endingId)||NPCS.some(p=>typeof n.relations[p.id]!=='number')||Object.keys(n.relations).some(id=>!NPCS.some(p=>p.id===id))||statKeys.some(k=>n.stats[k]>n.potential))throw new Error('저장 데이터의 항목을 확인할 수 없습니다.');
 if(n.phase==='event'&&!n.eventId||['match','summary'].includes(n.phase)&&!n.match||n.phase==='ended'&&(!n.endingId||n.turn!==lastTurn&&!legacyEnded)||n.phase!=='ended'&&n.endingId!==null)throw new Error('저장된 진행 단계가 올바르지 않습니다.');
 if(n.phase==='event'&&(n.seenEvents.includes(n.eventId!)||EVENTS.find(e=>e.id===n.eventId)?.chapter!==chapter)||n.phase==='match'&&(n.match?.played!==undefined||n.match?.result!==undefined)||n.phase==='summary'&&(!n.match?.result||n.match.played===undefined)||n.phase==='planning'&&(n.match!==null||n.eventId!==null)||['event','match','summary'].includes(n.phase)&&n.plan.length!==3||n.goals+n.assists>n.matches||n.wins>n.matches||n.matches>maxMatches||n.logs.some(l=>l.turn>n.turn))throw new Error('저장된 경기와 진행 기록이 일치하지 않습니다.');
}
export function validateState(value:unknown):GameState{
 if(typeof value==='object'&&value!==null&&'version' in value&&value.version===1){
  const old=legacySchema.parse(value);checkCommon(old,Math.floor(old.turn/12),old.turn+1,47);
  if(old.seenEvents.some(id=>Number(id.slice(1))>50)||old.eventId&&Number(old.eventId.slice(1))>50)throw new Error('과거 저장의 사건이 올바르지 않습니다.');
  const turn=old.phase==='ended'?YOUTH_TURNS-1:legacyTurn(old.turn);
  return validateState({...old,version:2,turn,logs:old.logs.map(l=>({...l,turn:legacyTurn(l.turn),date:legacyDate(l.turn),legacy:true})),previousPlan:old.plan.length===3?[...old.plan]:[],legacyTurns:old.turn-turn,legacyEnded:old.phase==='ended',contract:'youth',season:null,seasons:[]});
 }
 const n=stateSchema.parse(value) as GameState;
 const early=n.turn===YOUTH_TURNS-1&&['media','life'].includes(n.endingId||'');
 checkCommon(n as unknown as z.infer<typeof legacySchema>,chapterOf(n),n.turn+1+n.legacyTurns,LAST_TURN,n.legacyEnded||early);
 if(n.previousPlan.some(id=>!ACTIVITIES.some(a=>a.id===id)||n.previousPlan.filter(x=>x===id).length>2)||n.legacyEnded&&(n.phase!=='ended'||n.turn!==YOUTH_TURNS-1)||n.turn<YOUTH_TURNS&&(n.contract!=='youth'||n.season!==null||n.seasons.length>0)||n.turn>=YOUTH_TURNS&&(n.contract==='youth'||!n.season||n.season.year!==periodOf(n.turn).year))throw new Error('시즌 진행 정보가 올바르지 않습니다.');
 const all=[...n.seasons,...(n.season&&!n.seasons.some(x=>x.year===n.season!.year)?[n.season]:[])];
 if(new Set(n.seasons.map(x=>x.year)).size!==n.seasons.length||n.seasons.some(x=>x.year>periodOf(n.turn).year)||all.some(x=>x.goals+x.assists>x.appearances||x.wins>x.appearances||x.ratingTotal>x.appearances*10)||all.reduce((sum,x)=>sum+x.appearances,0)>n.matches||all.reduce((sum,x)=>sum+x.goals,0)>n.goals||all.reduce((sum,x)=>sum+x.assists,0)>n.assists)throw new Error('시즌 경기 기록이 일치하지 않습니다.');
 return n;
}
function validateCollection(value:unknown):Collection{const c=collectionSchema.parse(value);if(new Set(c.events).size!==c.events.length||new Set(c.endings).size!==c.endings.length||c.events.some(id=>!EVENTS.some(e=>e.id===id))||c.endings.some(id=>!ENDINGS.some(e=>e.id===id)))throw new Error('도감 데이터가 올바르지 않습니다.');return c;}
export function parseSave(text:string){if(text.length>2_000_000)throw new Error('저장 파일이 너무 큽니다.');const raw=JSON.parse(text);if(raw.format!=='project-kang-in'||![1,2].includes(raw.version)||raw.version!==raw.state?.version)throw new Error('지원하지 않는 저장 형식입니다.');return {state:validateState(raw.state),collection:validateCollection(raw.collection||{events:[],endings:[]})};}
export function serializeSave(state:GameState,collection:Collection){return JSON.stringify({format:'project-kang-in',version:2,savedAt:new Date().toISOString(),state,collection},null,2);}
export function writeSave(state:GameState,collection:Collection,manual=false){localStorage.setItem(manual?MANUAL:AUTO,serializeSave(state,collection));localStorage.setItem(COLLECTION,JSON.stringify(collection));}
export function readSave(manual=false){const text=localStorage.getItem(manual?MANUAL:AUTO)??localStorage.getItem(manual?'kang-in:manual:v1':'kang-in:auto:v1');return text?parseSave(text):null;}
export function readCollection():Collection{try{return validateCollection(JSON.parse(localStorage.getItem(COLLECTION)??localStorage.getItem('kang-in:collection:v1')??'{"events":[],"endings":[]}'));}catch{return {events:[],endings:[]};}}
export function mergeCollection(a:Collection,b:Collection):Collection{return {events:[...new Set([...a.events,...b.events])].filter(id=>EVENTS.some(e=>e.id===id)),endings:[...new Set([...a.endings,...b.endings])].filter(id=>ENDINGS.some(e=>e.id===id))};}
