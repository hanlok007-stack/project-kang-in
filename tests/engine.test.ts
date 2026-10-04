import assert from 'node:assert/strict';
import {ACTIVITIES} from '../data/game';
import {EVENTS,average,beginMonth,chooseEvent,newGame,nextMonth,planActivity,playMatch,matchProbabilities,skipMatch,determineEnding,LAST_TURN,YOUTH_TURNS,periodOf,dateLabel,stepLabel,recommendedPlan,reusePlan} from '../engine/game';
import {parseSave,serializeSave,validateState} from '../engine/save';
import {statKeys,type GameState} from '../engine/types';

assert.equal(EVENTS.length,62);assert.equal(new Set(EVENTS.map(e=>e.id)).size,62);assert.equal(ACTIVITIES.length,10);
assert.equal(periodOf(15).age,19);assert.equal(periodOf(16).age,20);assert.equal(dateLabel(16),'2021.01');assert.equal(dateLabel(51),'2023.12');assert.equal(stepLabel(0),'1년');assert.equal(stepLabel(12),'6개월');assert.equal(stepLabel(16),'1개월');
let empty=newGame(42);assert.strictEqual(beginMonth(empty),empty,'an incomplete plan cannot advance');
let capped=planActivity(planActivity(empty,'pass'),'pass');assert.equal(planActivity(capped,'pass').plan.length,2,'one activity has max two slots');
assert.deepEqual(matchProbabilities(empty),matchProbabilities(empty));
const completePlan=(state:GameState,mode:string)=>{
 let s=state;
 if(mode==='quiet')return ['language','mental','rest'].reduce((n,id)=>planActivity(n,id),s);
 const training=ACTIVITIES.filter(a=>['dribble','pass','shoot','control','physical','tactics','team','mental'].includes(a.id));
 const sorted=training.map(a=>({id:a.id,need:Object.entries(a.effects).filter(([k])=>statKeys.includes(k as typeof statKeys[number])).reduce((sum,[k,v])=>sum+v!*(100-s.stats[k as typeof statKeys[number]]),0)+(a.id==='team'&&s.trust<65?150:0)})).sort((a,b)=>b.need-a.need);
 const first=mode==='spain'&&s.language<35?'language':sorted[0].id;
 return [first,sorted.find(a=>a.id!==first)!.id,s.fatigue>35?'rest':sorted[2].id].reduce((n,id)=>planActivity(n,id),s);
};
function run(seed:number,mode='spain',final=0){let s=newGame(seed),phases=0;
 while(s.phase!=='ended'){
  if(++phases>250)throw new Error('progress stuck');
  if(s.phase==='planning')s=beginMonth(completePlan(s,mode));
  else if(s.phase==='event'){const e=EVENTS.find(e=>e.id===s.eventId)!;let index=0;if(e.id==='e12')index=mode==='spain'?0:1;else if(e.id==='e48')index=final;else {index=e.choices.map((c,i)=>({i,v:Object.entries(c.effects).reduce((v,[k,n])=>v+n!*(mode==='quiet'?(statKeys.includes(k as typeof statKeys[number])?-1:k==='happiness'?1.2:0.1):(statKeys.includes(k as typeof statKeys[number])?2:k==='fatigue'?-0.4:k==='trust'?1.2:0.2)),0)})).sort((a,b)=>b.v-a.v)[0].i;}s=chooseEvent(s,index);}
  else if(s.phase==='match')s=s.injuryMonths?skipMatch(s):playMatch(s,s.match!.probabilities.indexOf(Math.max(...s.match!.probabilities.slice(0,3))));
  else s=nextMonth(s);
  assert.deepEqual(validateState(s),s,'state is valid in every phase');
  const restored=parseSave(serializeSave(s,{events:s.seenEvents,endings:s.endingId?[s.endingId]:[]})).state;
  assert.deepEqual(restored,s,'save/load round trip preserves every phase and seed');
  for(const k of statKeys)assert.ok(s.stats[k]>=0&&s.stats[k]<=s.potential);
  assert.ok(s.matches<=52&&s.goals+s.assists<=s.matches);
 }
 assert.equal(s.turn,final===0?LAST_TURN:YOUTH_TURNS-1);for(const id of ['e01','e12','e25','e48'])assert.ok(s.seenEvents.includes(id),`mandatory event ${id}`);
 if(final===0){assert.equal(s.seasons.length,3);assert.equal(s.seasons.reduce((sum,x)=>sum+x.appearances,0),s.matches-YOUTH_TURNS);}
 return s;
}
const reports=[];
for(const mode of ['spain','korea','quiet']){let counts:Record<string,number>={};let total=0;for(let seed=1;seed<=24;seed++){const s=run(seed,mode);counts[s.endingId!]=(counts[s.endingId!]||0)+1;total+=average(s);}reports.push({mode,endings:counts,average:Math.round(total/24)});}
assert.equal(run(100,'spain',1).endingId,'media');assert.equal(run(100,'spain',2).endingId,'life');
const good=run(123);assert.ok(good.endingId);assert.equal(determineEnding({...good,route:'spain',trust:90,language:40,injuryMonths:0,stats:Object.fromEntries(statKeys.map(k=>[k,70])) as GameState['stats']}),'europe');
assert.equal(determineEnding({...good,route:'korea',trust:90,injuryMonths:0,stats:Object.fromEntries(statKeys.map(k=>[k,50])) as GameState['stats']}),'domestic');
assert.equal(determineEnding({...good,trust:20,stats:Object.fromEntries(statKeys.map(k=>[k,30])) as GameState['stats']}),'academy');
const envelope=JSON.parse(serializeSave(empty,{events:[],endings:[]}));envelope.state.phase='match';assert.throws(()=>parseSave(JSON.stringify(envelope)));
envelope.state={...empty,turn:100};assert.throws(()=>parseSave(JSON.stringify(envelope)));
envelope.state={...empty,plan:['pass','pass','pass']};assert.throws(()=>parseSave(JSON.stringify(envelope)));
envelope.state={...empty,stats:{...empty.stats,passing:999}};assert.throws(()=>parseSave(JSON.stringify(envelope)));
assert.throws(()=>parseSave('{bad}'));assert.throws(()=>parseSave(JSON.stringify({version:2})));
const month=beginMonth(['pass','team','rest'].reduce((s,id)=>planActivity(s,id),empty));const decision=chooseEvent(month,0);const outcome=playMatch(decision,1);assert.deepEqual(playMatch(decision,1),outcome,'same saved seed yields the same outcome');assert.strictEqual(playMatch(outcome,1),outcome,'resolved match cannot be replayed');
const recovered=skipMatch(decision);assert.equal(recovered.matches,0);assert.equal(recovered.injuryMonths,0);assert.equal(recovered.phase,'summary');
assert.equal(recommendedPlan(empty).plan.length,3);assert.equal(empty.plan.length,0);assert.deepEqual(reusePlan({...empty,previousPlan:['pass','team','rest']}).plan,['pass','team','rest']);
console.log(JSON.stringify({status:'passed',fullCareers:75,assertions:'16 youth + 36 pro turns, early life/media endings, three season records, mandatory events, limits, every-phase save validation, malformed imports, deterministic matches',balance:reports},null,2));
