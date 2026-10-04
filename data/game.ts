import type { Activity, Ending, StatKey } from '../engine/types';
export const STAT_LABELS:Record<StatKey,string> = {dribbling:'드리블',passing:'패스',shooting:'슈팅',control:'볼 컨트롤',vision:'시야',speed:'스피드',stamina:'체력',mentality:'멘탈'};
export const CHAPTERS = [
 {year:2007,age:6,name:'작은 왼발',place:'슛돌이 FC',description:'공이 좋은 아이. 모든 가능성은 여기서 시작된다.',goal:'기술의 기초와 좋아하는 플레이 찾기'},
 {year:2010,age:9,name:'더 넓은 운동장',place:'국내 유소년팀',description:'낯선 곳으로 떠날 용기, 익숙한 곳에서 자랄 믿음.',goal:'스페인 진출과 국내 성장 중 선택하기'},
 {year:2013,age:12,name:'나의 플레이',place:'유소년 아카데미',description:'재능에 나만의 색을 입히는 시간.',goal:'포지션과 선수 스타일 확립하기'},
 {year:2018,age:17,name:'첫 번째 계약',place:'U-18 아카데미',description:'지금까지의 선택이 첫 계약을 만든다.',goal:'출전 기회, 실력, 적응을 함께 준비하기'},
 {year:2021,age:20,name:'프로의 하루',place:'프로팀',description:'한 달마다 한 경기, 한 번의 판단. 세 시즌 동안 나만의 자리를 만든다.',goal:'시즌 목표를 달성하고 다음 계약 준비하기'}
];
export const ACTIVITIES:Activity[] = [
 {id:'dribble',name:'드리블 훈련',subtitle:'좁은 공간을 나의 무대로',icon:'◎',group:'기술',effects:{dribbling:3,control:1,fatigue:10,condition:-3},tags:['creative']},
 {id:'pass',name:'패스 훈련',subtitle:'동료의 다음 움직임까지',icon:'↗',group:'기술',effects:{passing:3,vision:1,teamwork:2,fatigue:8,condition:-2},tags:['playmaker']},
 {id:'shoot',name:'슈팅 훈련',subtitle:'왼발 끝에서 시작되는 골',icon:'⊕',group:'기술',effects:{shooting:3,mentality:1,fatigue:10,condition:-3},tags:['finisher']},
 {id:'control',name:'볼 컨트롤',subtitle:'첫 터치로 만드는 여유',icon:'◈',group:'기술',effects:{control:3,dribbling:1,fatigue:7,condition:-2},tags:['creative']},
 {id:'physical',name:'피지컬 훈련',subtitle:'끝까지 뛸 수 있는 몸',icon:'ϟ',group:'신체',effects:{speed:2,stamina:3,fatigue:14,condition:-4},tags:['athlete']},
 {id:'tactics',name:'전술 공부',subtitle:'공이 없을 때도 생각한다',icon:'▦',group:'전술',effects:{vision:3,passing:1,trust:2,fatigue:4},tags:['playmaker']},
 {id:'team',name:'팀 훈련',subtitle:'함께 뛰어야 더 멀리 간다',icon:'♧',group:'관계',effects:{stamina:1,passing:1,trust:6,teamwork:5,fatigue:8,condition:-2},tags:['team_player']},
 {id:'mental',name:'멘탈 훈련',subtitle:'큰 순간에도 나를 믿기',icon:'◇',group:'멘탈',effects:{mentality:3,happiness:3,fatigue:-5,condition:3},tags:['composed']},
 {id:'language',name:'스페인어 공부',subtitle:'언어도 새로운 패스다',icon:'Aa',group:'생활',effects:{language:7,vision:1,happiness:-1,fatigue:3},tags:['learned_language']},
 {id:'rest',name:'휴식 · 가족',subtitle:'잘 쉬는 것도 실력이야',icon:'☀',group:'회복',effects:{fatigue:-26,condition:17,happiness:8,mentality:1},tags:['family_bond']}
];
export const NPCS = [
 {id:'family',name:'가족',role:'가장 든든한 서포터',initial:78},
 {id:'coach',name:'유소년 감독',role:'성장의 방향을 잡는 사람',initial:45},
 {id:'teammate',name:'팀 동료',role:'함께 만드는 한 번의 패스',initial:50},
 {id:'rival',name:'동갑 라이벌',role:'좋은 자극이 되는 경쟁자',initial:40},
 {id:'mentor',name:'기술 코치',role:'왼발을 다듬는 조언자',initial:45},
 {id:'teacher',name:'학교 선생님',role:'축구 밖의 가능성',initial:55},
 {id:'scout',name:'스카우트',role:'다음 무대를 지켜보는 눈',initial:25},
 {id:'friend',name:'어릴 적 친구',role:'평범한 하루의 즐거움',initial:60},
 {id:'medical',name:'재활 코치',role:'몸의 신호를 읽는 사람',initial:50},
 {id:'agent',name:'진로 상담가',role:'첫 계약을 함께 고민',initial:40}
];
export const ENDINGS:Ending[] = [
 {id:'europe',title:'유럽의 문을 열다',subtitle:'EUROPEAN DREAM',body:'첫 유럽 프로 계약서 위에 이름을 적었다. 낯선 언어를 배우던 날, 한 번 더 패스를 건네던 날. 작은 선택들이 너를 이 무대로 데려왔다.',color:'#b9ef45'},
 {id:'domestic',title:'우리 리그의 새 별',subtitle:'HOMEGROWN TALENT',body:'국내 프로팀에서 첫 기회를 얻었다. 익숙한 운동장에서 쌓아 올린 실력과 믿음. 이곳에서 너만의 역사를 시작한다.',color:'#7ac7ff'},
 {id:'academy',title:'아직 끝나지 않은 꿈',subtitle:'ONE MORE SEASON',body:'바로 계약으로 이어지지는 않았다. 아카데미는 다시 도전할 기회를 건넸다. 재능은 마감일이 없다. 더 단단한 다음 시즌이 기다린다.',color:'#b3a0ff'},
 {id:'media',title:'또 다른 무대의 주인공',subtitle:'BEYOND THE PITCH',body:'공을 사랑하는 마음은 다른 무대에서도 빛났다. 축구 이야기를 전하는 콘텐츠와 방송, 사람들과 함께 웃는 하루. 너는 새로운 진로를 골랐다.',color:'#ffb86a'},
 {id:'life',title:'행복의 다른 이름',subtitle:'MY OWN LIFE',body:'스포트라이트보다 소중한 것을 찾았다. 좋아하는 사람들, 배우고 싶은 일, 주말의 축구. 너의 인생은 점수가 매길 수 없는 방식으로 자란다.',color:'#ff91ba'}
];
