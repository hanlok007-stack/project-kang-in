export interface Period {year:number;month:number;age:number;months:number;chapter:number}
export const YOUTH_TURNS=16;
export const PERIODS:Period[]=[
  ...Array.from({length:12},(_,i)=>({year:2007+i,month:1,age:6+i,months:12,chapter:i<3?0:i<6?1:i<11?2:3})),
  ...Array.from({length:4},(_,i)=>({year:2019+Math.floor(i/2),month:i%2?7:1,age:18+Math.floor(i/2),months:6,chapter:3})),
  ...Array.from({length:36},(_,i)=>({year:2021+Math.floor(i/12),month:i%12+1,age:20+Math.floor(i/12),months:1,chapter:4}))
];
export const LAST_TURN=PERIODS.length-1;
export const periodOf=(turn:number)=>PERIODS[Math.min(LAST_TURN,Math.max(0,turn))];
export const dateLabel=(turn:number)=>{const p=periodOf(turn);return `${p.year}.${String(p.month).padStart(2,'0')}`;};
export const stepLabel=(turn:number)=>periodOf(turn).months===12?'1년':periodOf(turn).months===6?'6개월':'1개월';
export const legacyTurn=(turn:number)=>[0,3,6,11][Math.min(3,Math.floor(turn/12))];
export const legacyDate=(turn:number)=>`${[2007,2010,2013,2018][Math.min(3,Math.floor(turn/12))]}.${String(turn%12+1).padStart(2,'0')}`;
