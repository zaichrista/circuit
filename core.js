const GROUPS = ['Upper body', 'Legs', 'Core', 'Cardio'];
const rows = [
 ['Push-ups',0,'Keep a straight line. Use your knees if needed.'],
 ['Knee push-ups',0,'Knees on your mat. Lower your chest with control.'],
 ['Wide push-ups',0,'Place hands a little wider than shoulders. Keep elbows controlled.'],
 ['Close-grip knee push-ups',0,'Hands under shoulders. Keep elbows close as you lower.'],
 ['Prone W raises',0,'Lie face down. Draw elbows back into a W and lift gently.'],
 ['Reverse snow angels',0,'Lie face down. Sweep your arms slowly from hips to overhead.'],
 ['Prone arm pulses',0,'Lie face down, arms in a T. Lift your arms gently and pulse.'],
 ['Squats',1,'Sit your hips down and back. Keep your heels grounded.'],
 ['Reverse lunges',1,'Step back and alternate legs. Stay controlled.'],
 ['Glute bridges',1,'Lie on your back. Lift your hips and squeeze.'],
 ['Side-lying leg raises',1,'Keep hips stacked. Switch sides halfway.'],
 ['Sumo squats',1,'Take a wider stance. Keep knees in line with toes.'],
 ['Calf raises',1,'Rise onto your toes. Lower slowly.'],
 ['Lateral lunges',1,'Step out to one side. Sit back and alternate sides.'],
 ['Dead bugs',2,'Reach opposite arm and leg. Keep your back steady.'],
 ['Heel taps',2,'Lie on your back. Reach side to side to each heel.'],
 ['Reverse crunches',2,'Curl your pelvis up gently. Avoid swinging.'],
 ['Bicycle crunches',2,'Rotate slowly. Alternate opposite elbow and knee.'],
 ['Forearm plank',2,'Brace and breathe. Keep hips level.'],
 ['Side plank',2,'Stack your hips. Switch sides halfway.'],
 ['Seated knee tucks',2,'Lean back slightly. Draw knees in with control.'],
 ['Step jacks',3,'Step one foot out at a time as your arms rise.'],
 ['Standing punches',3,'Keep feet moving gently. Alternate punches.'],
 ['Fast marching',3,'Drive your arms and lift alternating knees.'],
 ['Side steps + reach',3,'Step side to side. Reach your arms overhead.'],
 ['Jumping jacks',3,'Land softly with knees relaxed.'],
 ['High knees',3,'Run on the spot. Drive alternating knees up.'],
 ['Skater hops',3,'Hop side to side. Land softly with control.']
];
const DEFAULTS = rows.map((r,i)=>({id:'ex-'+i,name:r[0],group:GROUPS[r[1]],lowImpact:i<25,cue:r[2],enabled:true}));
function eligible(bank,group,filters={}) {
 return bank.filter(e=>e.enabled && e.group===group && (!filters.lowImpact||e.lowImpact));
}
function generate(bank,count,filters={},previous=[]) {
 const groups=GROUPS.slice(0,count===4?4:3);
 const missing=groups.filter(g=>!eligible(bank,g,filters).length);
 if(missing.length) return {error:'Add or enable a '+missing.join(' / ')+' exercise that matches your filters.'};
 const used=new Set();
 const exercises=groups.map(g=>{
  const all=eligible(bank,g,filters).filter(e=>!used.has(e.name.trim().toLowerCase()));
  const fresh=all.filter(e=>!previous.some(p=>p.id===e.id));
  const pool=fresh.length?fresh:all;
  if(!pool.length) return null;
  const pick=pool[Math.floor(Math.random()*pool.length)]; used.add(pick.name.trim().toLowerCase());return pick;
 });
 if(exercises.some(e=>!e)) return {error:'Enable a different exercise name for each focus.'};
 return {exercises};
}
function swapExercise(bank,current,index,filters={}) {
 const item=current[index];
 if(!item)return {error:'Choose a circuit first.'};
 const options=eligible(bank,item.group,filters).filter(e=>!current.some(p=>p.name.trim().toLowerCase()===e.name.trim().toLowerCase()));
 if(!options.length)return {error:'No other '+item.group.toLowerCase()+' moves match. Add one in Your moves.'};
 const next=current.slice();next[index]=options[Math.floor(Math.random()*options.length)];return {exercises:next};
}
function duration(count,rounds){return (count===4?6:4)*30*rounds;}
function buildTimeline(exercises,rounds){
 const timeline=[{phase:'Ready',seconds:5,exercise:exercises[0],round:1,index:0}];
 for(let r=1;r<=rounds;r++)for(let i=0;i<exercises.length;i++){
  timeline.push({phase:'Work',seconds:30,exercise:exercises[i],round:r,index:i});
  const end=i===exercises.length-1;
  if(end || (exercises.length===4&&i===1)){
   const final=end&&r===rounds;
   timeline.push({phase:'Rest',seconds:30,exercise:final?null:exercises[(i+1)%exercises.length],round:r,index:(i+1)%exercises.length,final});
  }
 }
 return timeline;
}

const Circuit = Object.freeze({GROUPS, DEFAULTS, eligible, generate, swapExercise, duration, buildTimeline});
if (typeof module !== "undefined" && module.exports) module.exports = Circuit;
