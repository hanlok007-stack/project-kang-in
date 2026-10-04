import { ACTIVITIES, CHAPTERS, NPCS } from '../data/game';
import rawEvents from '../data/events.json';
import proEvents from '../data/pro-events.json';
import { statKeys, type Effects, type GameState, type StoryEvent } from './types';
import { LAST_TURN, YOUTH_TURNS, periodOf, dateLabel, stepLabel } from './timeline';
export { LAST_TURN, YOUTH_TURNS, periodOf, dateLabel, stepLabel } from './timeline';
export const EVENTS = [...rawEvents,...proEvents] as StoryEvent[];
export const clamp = (n:number,min=0,max=100) => Math.min(max,Math.max(min,n));
export const chapterOf = (s:GameState) => periodOf(s.turn).chapter;
export const isPro = (s:GameState) => s.turn>=YOUTH_TURNS;
export const clubLabel = (s:GameState) => isPro(s)?({europe:'유럽 프로팀',domestic:'국내 프로팀',academy:'프로 도전팀',youth:'프로 도전팀'})[s.contract]:s.route==='spain'&&chapterOf(s)>=1?'스페인 아카데미':CHAPTERS[chapterOf(s)].place;
export const average = (s:GameState) => statKeys.reduce((sum,key)=>sum+s.stats[key],0)/8;
export function newGame(seed=(Date.now() >>> 0)):GameState {
 const s:GameState={version:2,seed:seed||1,turn:0,phase:'planning',stats:{dribbling:26,passing:28,shooting:18,control:30,vision:24,speed:22,stamina:20,mentality:28},condition:85,fatigue:12,happiness:80,trust:45,language:0,popularity:12,teamwork:45,route:'korea',position:'CAM',potential:92,injuryMonths:0,plan:[],flags:[],seenEvents:[],eventId:null,match:null,logs:[],relations:Object.fromEntries(NPCS.map(n=>[n.id,n.initial])),matches:0,goals:0,assists:0,wins:0,lastGains:{},endingId:null,previousPlan:[],legacyTurns:0,legacyEnded:false,contract:'youth',season:null,seasons:[]};
 s.potential=95;
 s.logs.push({turn:0,kind:'chapter',title:'작은 왼발의 첫 페이지',body:'6~17세는 한 번에 1년, 18~19세는 6개월씩 자란다. 20세부터는 한 달씩 프로 시즌을 즐긴다. 각 기간의 세 가지 활동과 대표 경기 한 번을 선택해 보자.'});
 return s;
}
function copy(s:GameState):GameState { return structuredClone(s); }
export function random(s:GameState) { let x=s.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return s.seed/4294967296; }
export function effectsText(e:Effects) {const labels:Record<string,string>={dribbling:'드리블',passing:'패스',shooting:'슈팅',control:'컨트롤',vision:'시야',speed:'스피드',stamina:'체력',mentality:'멘탈',condition:'컨디션',fatigue:'피로',happiness:'행복',trust:'신뢰',language:'스페인어',popularity:'인지도',teamwork:'팀워크'};return Object.entries(e).filter(([,v])=>v!==0).map(([k,v])=>`${labels[k]||k} ${v!>0?'+':''}${Math.round(v!*10)/10}`).join(' · ');}
function apply(s:GameState,e:Effects,growth=false) {
 const changes:Effects={};
 for(const [k,value] of Object.entries(e)){
  const key=k as keyof Effects;let v=value!;
  if(statKeys.includes(key as typeof statKeys[number])){
   const sk=key as typeof statKeys[number];
   if(growth&&v>0){const pace=[2.7,2.6,2.3,1.8,0.42][chapterOf(s)];const saturation=Math.max(0.25,1-s.stats[sk]/130);const positionBonus=(s.position==='CAM'&&['passing','vision','control'].includes(sk))||(s.position==='RW'&&['dribbling','shooting','speed'].includes(sk))||(s.position==='CM'&&['passing','stamina','mentality'].includes(sk))?1.15:1;v*=pace*saturation*positionBonus*(s.fatigue>70?0.65:1);}
   const prev=s.stats[sk];s.stats[sk]=Math.round(clamp(prev+v,0,s.potential)*10)/10;changes[sk]=Math.round((s.stats[sk]-prev)*10)/10;
  }else {const lk=key as 'condition'|'fatigue'|'happiness'|'trust'|'language'|'popularity'|'teamwork';const prev=s[lk];s[lk]=Math.round(clamp(prev+v)*10)/10;changes[lk]=Math.round((s[lk]-prev)*10)/10;}
 }
 return changes;
}
export function planActivity(s:GameState,id:string):GameState {if(s.phase!=='planning'||s.plan.length>=3||!ACTIVITIES.some(a=>a.id===id)||s.plan.filter(x=>x===id).length>=2)return s;const n=copy(s);n.plan.push(id);return n;}
export function removeActivity(s:GameState,index:number) {if(s.phase!=='planning')return s;const n=copy(s);n.plan.splice(index,1);return n;}
export function reusePlan(s:GameState){if(s.phase!=='planning'||s.previousPlan.length!==3)return s;const n=copy(s);n.plan=[...s.previousPlan];return n;}
export function recommendedPlan(s:GameState){if(s.phase!=='planning')return s;const n=copy(s);n.plan=[];const picked:string[]=[];
 if(s.fatigue>35||s.condition<65||s.injuryMonths)picked.push('rest');
 if(s.route==='spain'&&s.language<30)picked.push('language');
 if(s.trust<65)picked.push('team');
 const ranked=ACTIVITIES.filter(a=>!['rest','language'].includes(a.id)).map(a=>({id:a.id,need:Object.entries(a.effects).filter(([k])=>statKeys.includes(k as typeof statKeys[number])).reduce((sum,[k,v])=>sum+v!*(s.potential-s.stats[k as typeof statKeys[number]]),0)})).sort((a,b)=>b.need-a.need);
 for(const a of ranked)if(!picked.includes(a.id)&&picked.length<3)picked.push(a.id);
 n.plan=picked.slice(0,3);return n;
}
export function previewPlan(s:GameState){const n=copy(s);const e:Effects={};for(const id of n.plan){const a=ACTIVITIES.find(a=>a.id===id)!;const c=apply(n,a.effects,true);for(const [k,v]of Object.entries(c))e[k as keyof Effects]=(e[k as keyof Effects]||0)+v!;}return {effects:e,condition:n.condition,fatigue:n.fatigue};}
function qualifies(s:GameState,e:StoryEvent){if(e.chapter!==chapterOf(s)||s.seenEvents.includes(e.id))return false;const c=e.condition;return (!c?.flag||s.flags.includes(c.flag))&&(!c?.route||s.route===c.route)&&(!c?.min||Object.entries(c.min).every(([k,v])=>((s.stats as unknown as Record<string,number>)[k]??(s as unknown as Record<string,number>)[k])>=v!));}
function pickEvent(s:GameState){if(isPro(s)){if((s.turn-YOUTH_TURNS)%3!==0)return null;const event=EVENTS.find(e=>e.id===`e${51+Math.floor((s.turn-YOUTH_TURNS)/3)}`);return event&&!s.seenEvents.includes(event.id)?event:null;}const mandatory:Record<number,string>={0:'e01',3:'e12',6:'e25',15:'e48'};const fixed=EVENTS.find(e=>e.id===mandatory[s.turn]);if(fixed&&!s.seenEvents.includes(fixed.id))return fixed;const available=EVENTS.filter(e=>qualifies(s,e)&&!Object.values(mandatory).includes(e.id));const followups=available.filter(e=>e.condition?.flag);const pool=followups.length?followups:available;return pool.length?pool[Math.floor(random(s)*pool.length)]:null;}
export function beginMonth(s:GameState){if(s.phase!=='planning'||s.plan.length!==3)return s;const n=copy(s);n.lastGains={};const names=[];
 for(const id of n.plan){const a=ACTIVITIES.find(a=>a.id===id)!;names.push(a.name);const changes=apply(n,a.effects,true);for(const [k,v]of Object.entries(changes))n.lastGains[k as keyof Effects]=Math.round(((n.lastGains[k as keyof Effects]||0)+v!)*10)/10;
  for(const f of a.tags)if(!n.flags.includes(f))n.flags.push(f);
  const rel=id==='rest'?['family','friend']:id==='team'?['coach','teammate']:id==='language'?['teacher']:id==='mental'?['medical']:['mentor','rival'];for(const key of rel)n.relations[key]=clamp(n.relations[key]+2);
 }
 if(n.injuryMonths>0&&n.plan.includes('rest'))n.injuryMonths=0;
 if(n.fatigue>75&&random(n)<(n.fatigue-65)/140){n.injuryMonths=1;apply(n,{condition:-15});n.logs.unshift({turn:n.turn,kind:'event',title:'몸이 보내는 신호',body:'과도한 피로로 이번 대표 경기를 쉬게 됐다. 휴식 · 가족 활동으로 회복할 수 있다.'});}
 n.logs.unshift({turn:n.turn,kind:'training',title:`${stepLabel(n.turn)} 동안의 세 가지 선택`,body:names.join(' · '),changes:n.lastGains});
 const event=pickEvent(n);n.eventId=event?.id||null;n.phase=event?'event':'match';if(!event)prepareMatch(n);return n;
}
export function chooseEvent(s:GameState,index:number){if(s.phase!=='event')return s;const event=EVENTS.find(e=>e.id===s.eventId);const choice=event?.choices[index];if(!event||!choice)return s;const n=copy(s);const changes=apply(n,choice.effects);for(const flag of choice.flags||[])if(!n.flags.includes(flag))n.flags.push(flag);if(choice.route)n.route=choice.route;if(choice.position)n.position=choice.position;n.seenEvents.push(event.id);
 n.logs.unshift({turn:n.turn,kind:'event',title:event.title,body:`${choice.label} — ${choice.description}`,changes});
 const rel=event.category.includes('가족')?'family':event.category.includes('동료')?'teammate':event.category.includes('진로')?'agent':event.category.includes('학교')?'teacher':'coach';n.relations[rel]=clamp(n.relations[rel]+3);
 if(event.condition?.flag)n.logs.unshift({turn:n.turn,kind:'butterfly',title:'그때의 선택이 오늘로',body:`이전에 남긴 선택 '${event.condition.flag}'이(가) 「${event.title}」의 기회를 만들었다.`});
 if(choice.route==='spain'&&n.flags.includes('learned_language')){apply(n,{trust:6,happiness:5});n.logs.unshift({turn:n.turn,kind:'butterfly',title:'미리 배운 언어의 힘',body:'스페인어 공부 → 해외 진출. 첫 인사를 직접 전하며 신뢰 +6, 행복 +5를 얻었다.'});}
 n.phase='match';prepareMatch(n);return n;
}
function prepareMatch(s:GameState){const chapter=chapterOf(s);const rivals=[['동네 유소년팀','주말 축구교실','라이벌 슛돌이'],['지역 주니어팀','유소년 선발팀','주니어 챌린저'],s.route==='spain'?['마드리드 아카데미','바르셀로나 유소년','발렌시아 주니어']:['수도권 아카데미','남부 유소년팀','지역 올스타'],['U-18 라이벌','프로 2군 선발','아카데미 올스타'],['북항FC','중앙 유나이티드','산마루SC']];const opponent=rivals[chapter][Math.floor(random(s)*3)];const contexts=['시즌 개막전','리그 경기','지역 라이벌전','컵 경기','리그 경기','상반기 마지막 경기','후반기 개막전','컵 경기','리그 경기','라이벌 재대결','주전 경쟁 경기','시즌 마지막 경기'];s.match={opponent,context:isPro(s)?contexts[periodOf(s.turn).month-1]:'유소년 대표 경기',minute:87,home:Math.floor(random(s)*3),away:Math.floor(random(s)*3),probabilities:matchProbabilities(s)};}
export function matchProbabilities(s:GameState){const st=s.stats;const opponent=isPro(s)?52+(periodOf(s.turn).year-2021)*12:26+chapterOf(s)*10;const fitness=s.condition*0.17-s.fatigue*0.13+s.happiness*0.025;const p=(skill:number,bonus=0)=>Math.round(clamp(46+(skill-opponent)*0.75+fitness+bonus,15,92));return [p(st.shooting*0.7+st.mentality*0.3,-5),p(st.passing*0.65+st.vision*0.35,s.teamwork*0.06),p(st.dribbling*0.7+st.speed*0.3,-2),p(st.mentality*0.6+st.control*0.4,10)];}
export function playMatch(s:GameState,index:number){if(s.phase!=='match'||!s.match||index<0||index>3)return s;const n=copy(s);const m=n.match!;
 if(n.injuryMonths>0){m.result='몸을 회복하며 벤치에서 팀을 응원했다. 다음 활동에 휴식을 넣어 회복하자.';m.rating=0;m.played=false;n.phase='summary';n.logs.unshift({turn:n.turn,kind:'match',title:'이번 경기는 회복 먼저',body:m.result});return n;}
 const success=random(n)*100<m.probabilities[index];m.success=success;m.played=true;m.goals=0;m.assists=0;n.matches++;
 const labels=['왼발 슛','동료에게 패스','드리블 돌파','안전하게 볼 지키기'];
 if(success){if(index===0||index===2){m.home++;n.goals++;m.goals=1;m.result=index===0?'골! 왼발에서 떠난 공이 골문 구석으로 꽂힌다.':'한 명, 두 명을 제쳤다. 돌파 끝에 직접 골을 넣었다!';}else if(index===1){m.home++;n.assists++;m.assists=1;m.result='완벽한 타이밍의 패스. 동료가 마무리하며 도움을 기록했다!';}else m.result=m.home>=m.away?'침착하게 공을 지켜 현재 스코어로 경기를 마쳤다.':'공은 지켰지만 동점 기회는 만들지 못했다. 스코어는 그대로다.';apply(n,{trust:4,popularity:index===3?1:4,mentality:0.5});n.relations.scout=clamp(n.relations.scout+3);
 }else{m.result=index===0?'슛이 수비수에게 막혔다. 다음엔 더 좋은 각도를 찾아보자.':index===1?'패스 길을 읽혔다. 동료와 타이밍을 더 맞춰야겠다.':index===2?'돌파 도중 공을 빼앗겼다. 오늘의 상대는 쉽지 않았다.':'공을 지키려다 놓쳤다. 마지막까지 집중해야 했다.';apply(n,{trust:-2,happiness:-2});}
 if(m.home>m.away)n.wins++;m.rating=Math.round(clamp(5.3+average(n)/65+(success?1.3:0)+(m.home>m.away?0.5:0),4,10)*10)/10;
 if(n.season){n.season.appearances++;n.season.goals+=m.goals||0;n.season.assists+=m.assists||0;n.season.wins+=m.home>m.away?1:0;n.season.ratingTotal=Math.round((n.season.ratingTotal+m.rating)*10)/10;}
 apply(n,{fatigue:7,condition:-3});n.phase='summary';n.logs.unshift({turn:n.turn,kind:'match',title:`${m.home}:${m.away} · ${labels[index]} ${success?'성공':'실패'}`,body:m.result});return n;
}
export function determineEnding(s:GameState){if(s.flags.includes('choose_life'))return 'life';if(s.flags.includes('choose_media'))return 'media';if(s.route==='spain'&&average(s)>=60&&s.trust>=55&&s.language>=30&&s.injuryMonths===0)return 'europe';if(average(s)>=48&&s.trust>=45&&s.injuryMonths===0)return 'domestic';return 'academy';}
export function skipMatch(s:GameState){if(s.phase!=='match'||!s.match)return s;const n=copy(s);apply(n,{condition:10,fatigue:-15,trust:-2});n.injuryMonths=0;n.match!.result='대표 경기를 쉬며 회복했다. 출전 기회와 감독 신뢰 2를 양보하고 컨디션 +10, 피로 -15를 얻었다.';n.match!.played=false;n.match!.rating=0;n.phase='summary';n.logs.unshift({turn:n.turn,kind:'match',title:'경기 대신 회복',body:n.match!.result});return n;}
export function careerScore(s:GameState){return Math.round(clamp(average(s)*0.55+s.trust*0.12+s.happiness*0.1+s.matches*0.25+s.goals*0.4+s.assists*0.45+s.wins*0.2));}
const emptySeason=(year:number)=>({year,appearances:0,goals:0,assists:0,wins:0,ratingTotal:0});
export function seasonGoal(s:GameState){const season=s.season;if(!season)return null;const rating=season.appearances?season.ratingTotal/season.appearances:0;
 if(season.year===2021)return {label:'새 무대 적응',detail:'대표 경기 8회 출전 · 신뢰 55',progress:season.appearances,target:8,achieved:season.appearances>=8&&s.trust>=55};
 if(season.year===2022){const target=s.position==='CM'?4:6;return {label:'결과로 증명하기',detail:`골+도움 ${target}회 · 평균 평점 6.5`,progress:season.goals+season.assists,target,achieved:season.goals+season.assists>=target&&rating>=6.5};}
 return {label:'팀의 중심으로',detail:'대표 경기 9회 출전 · 신뢰 70 · 팀워크 65',progress:season.appearances,target:9,achieved:season.appearances>=9&&s.trust>=70&&s.teamwork>=65};
}
function finishSeason(s:GameState){if(!s.season||s.seasons.some(x=>x.year===s.season!.year))return;const goal=seasonGoal(s)!;s.seasons.push({...s.season,goalMet:goal.achieved});s.logs.unshift({turn:s.turn,kind:'chapter',title:`${s.season.year} 시즌 · 목표 ${goal.achieved?'달성':'다음에 도전'}`,body:`${goal.label}: ${s.season.appearances}회 출전, ${s.season.goals}골 ${s.season.assists}도움. ${goal.achieved?'인지도 +6, 행복 +4, 신뢰 +3, 멘탈 +1을 얻었다.':'기록을 남기고 새로운 목표에 도전한다.'}`});if(goal.achieved)apply(s,{popularity:6,happiness:4,trust:3,mentality:1});}
export function canContinueCareer(s:GameState){return s.legacyEnded&&s.phase==='ended'&&s.endingId!==null&&!['life','media'].includes(s.endingId);}
export function continueCareer(s:GameState){if(!canContinueCareer(s))return s;const n=copy(s);n.contract=n.endingId as 'europe'|'domestic'|'academy';n.turn=YOUTH_TURNS;n.phase='planning';n.legacyEnded=false;n.endingId=null;n.plan=[];n.eventId=null;n.match=null;n.season=emptySeason(2021);n.logs.unshift({turn:n.turn,kind:'chapter',title:'저장한 인생, 프로 무대로',body:'이전 성장 기록을 이어 간다. 스무 살부터는 한 달씩 시즌 목표에 도전하자.'});return n;}
export function nextMonth(s:GameState){if(s.phase!=='summary')return s;const n=copy(s);const previousChapter=chapterOf(n),period=periodOf(n.turn);n.previousPlan=[...n.plan];
 if(isPro(n)&&period.month===12)finishSeason(n);
 if(n.turn===LAST_TURN||n.turn===YOUTH_TURNS-1&&['media','life'].includes(determineEnding(n))){n.phase='ended';n.endingId=determineEnding(n);return n;}
 if(n.turn===YOUTH_TURNS-1){n.contract=determineEnding(n) as 'europe'|'domestic'|'academy';n.season=emptySeason(2021);}
 n.injuryMonths=Math.max(0,n.injuryMonths-period.months);n.turn++;apply(n,{fatigue:-12,condition:9,happiness:-1});n.phase='planning';n.plan=[];n.eventId=null;n.match=null;
 if(isPro(n)&&periodOf(n.turn).month===1)n.season=emptySeason(periodOf(n.turn).year);
 if(chapterOf(n)!==previousChapter){const c=CHAPTERS[chapterOf(n)],p=periodOf(n.turn);n.logs.unshift({turn:n.turn,kind:'chapter',title:`CHAPTER ${chapterOf(n)+1} · ${c.name}`,body:`${p.year}년, ${p.age}세. ${isPro(n)?'성장은 천천히, 한 달마다 경기와 시즌 목표에 집중한다.':'다음 성장 단계가 시작된다.'} 각 기간의 대표 경기만 기록에 더한다.`});}
 return n;
}

