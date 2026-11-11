const test = require('node:test');
const assert = require('node:assert/strict');
const {GROUPS,DEFAULTS,generate,swapExercise,duration,buildTimeline} = require('../core.js');
test('balanced combinations remain unique and respect impact filters',()=>{
 for(const count of [3,4])for(const lowImpact of [true,false])for(let i=0;i<300;i++){
  const {exercises}=generate(DEFAULTS,count,{lowImpact});
  assert.equal(exercises.length,count);assert.deepEqual(exercises.map(e=>e.group),GROUPS.slice(0,count));
  assert.equal(new Set(exercises.map(e=>e.name)).size,count);if(lowImpact)assert.ok(exercises.every(e=>e.lowImpact));
 }
});
test('new combos and swaps use different moves with the same focus',()=>{
 const first=generate(DEFAULTS,4).exercises;
 const next=generate(DEFAULTS,4,{},first).exercises;
 assert.ok(next.every((e,i)=>e.id!==first[i].id));
 for(let i=0;i<4;i++){const changed=swapExercise(DEFAULTS,first,i).exercises;assert.notEqual(changed[i].id,first[i].id);assert.equal(changed[i].group,first[i].group);assert.equal(changed[(i+1)%4].id,first[(i+1)%4].id);}
});
test('no candidates reports a useful error without ignoring filters',()=>{
 assert.match(generate(DEFAULTS.filter(e=>e.group!=='Core'),3).error,/Core/);
 const first=generate(DEFAULTS,3).exercises;assert.match(swapExercise(first,first,0).error,/No other/);
});
test('three move cycle is work work work rest, every interval 30s',()=>{
 const items=generate(DEFAULTS,3).exercises;
 const timeline=buildTimeline(items,3);assert.equal(timeline[0].phase,'Ready');
 assert.deepEqual(timeline.slice(1).map(s=>s.phase),Array.from({length:3},()=>['Work','Work','Work','Rest']).flat());
 assert.ok(timeline.slice(1).every(s=>s.seconds===30));assert.equal(timeline.slice(1).reduce((s,t)=>s+t.seconds,0),duration(3,3));assert.equal(duration(3,3),360);assert.equal(timeline.at(-1).final,true);
});
test('four move cycle is work work rest work work rest with correct next move',()=>{
 const items=generate(DEFAULTS,4).exercises;const timeline=buildTimeline(items,2);
 assert.deepEqual(timeline.slice(1).map(s=>s.phase),Array.from({length:2},()=>['Work','Work','Rest','Work','Work','Rest']).flat());
 assert.equal(timeline[3].exercise.id,items[2].id);assert.equal(timeline[6].exercise.id,items[0].id);assert.equal(timeline.at(-1).exercise,null);
 assert.ok(timeline.slice(1).every(s=>s.seconds===30));assert.equal(timeline.slice(1).reduce((s,t)=>s+t.seconds,0),duration(4,2));assert.equal(duration(4,3),540);
});
