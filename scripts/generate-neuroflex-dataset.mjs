const fs = require('node:fs');

let seed = 26186;
function rand(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function int(min,max){ return Math.floor(rand()*(max-min+1))+min; }
function normal(mean,sd){ let u=0,v=0; while(!u)u=rand(); while(!v)v=rand(); return mean+sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

const rows=['stress,sleep,fatigue,workload,connection,dutyHours,deploymentDays,leaveGap,trainingLoad,restHours,transferCount,welfare_label'];
for(let i=0;i<2000;i++){
  const stress=int(1,5), sleep=int(1,5), fatigue=int(1,5), workload=int(1,5), connection=int(1,5);
  const duty=Math.round(clamp(normal(50,9),30,75));
  const deployment=Math.round(clamp(normal(28,14),0,70));
  const leave=Math.round(clamp(normal(21,12),0,60));
  const training=Math.round(clamp(normal(60,22),0,100));
  const rest=Math.round(clamp(normal(7,1.2),4,10)*10)/10;
  const transfers=Math.min(5,Math.max(0,Math.round(-Math.log(Math.max(0.000001,rand())))));
  const signal=1.05*stress+0.9*fatigue+0.8*workload+0.7*(6-sleep)+0.35*(duty-45)+0.12*deployment+0.08*leave+0.015*training+(7-rest)-0.35*connection+0.2*transfers;
  const label=signal>=17.5?1:0;
  rows.push([stress,sleep,fatigue,workload,connection,duty,deployment,leave,training,rest,transfers,label].join(','));
}
fs.writeFileSync('data/neuroflex-synthetic-2000.csv', rows.join('\n')+'\n');
console.log('Generated 2000 synthetic records.');
