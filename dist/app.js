(() => {
  'use strict';
  const { GROUPS, DEFAULTS, generate, swapExercise, duration, buildTimeline } = Circuit;
  const $ = selector => document.querySelector(selector);
  const KEY = 'circuit-flat-v1';
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
  const validMove = e => e && typeof e.id === 'string' && typeof e.name === 'string' && GROUPS.includes(e.group);
  let bank = Array.isArray(stored.bank) ? stored.bank.filter(validMove).map(e => ({ ...e, name: e.name.slice(0,65), enabled: true })) : DEFAULTS.map(e => ({ ...e }));
  let rounds = [1,2,3,4,5,6].includes(stored.rounds) ? stored.rounds : 3;
  let sound = stored.sound !== false;
  let current = Array.isArray(stored.current) ? stored.current.map(id => bank.find(e => e.id === id)).filter(Boolean).slice(0,4) : [];
  if (new Set(current.map(e=>e.group)).size !== current.length) current = [];
  if (!stored.current) current = generate(bank, 3).exercises || [];
  let active = false, paused = false, complete = false;
  let timeline = [], position = 0, deadline = 0, remaining = 0, tickHandle = null, lastSecond = -1;
  let wakeLock = null, audio = null, choosingIndex = null;
  const circleLength = 2 * Math.PI * 108;
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function notify(text) { $('#message').textContent = text; $('#message').hidden = !text; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ bank, rounds, sound, current: current.map(e=>e.id) })); }
    catch { notify('Changes could not be saved on this device.'); }
  }
  function clock(seconds) { return Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0'); }
  const swapIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8a7.5 7.5 0 0 0-13-2L3 9m0-6v6h6M5 16a7.5 7.5 0 0 0 13 2l3-3m0 6v-6h-6"/></svg>';
  function renderBoard() {
    const grid = $('#exercise-grid'); grid.replaceChildren();
    current.forEach((exercise,index) => {
      const card = element('article','exercise-card');
      const top = element('div','card-top'); top.append(element('h2','',exercise.group));
      const remove = element('button','remove','×'); remove.setAttribute('aria-label','Remove '+exercise.name);
      remove.addEventListener('click',()=>{ if(active)return; current.splice(index,1); complete=false; renderBoard(); save(); });
      top.append(remove); card.append(top,element('h3','exercise-title',exercise.name));
      const bottom = element('div','card-bottom'); bottom.append(element('span','','30s'));
      const actions = element('div'); const change = element('button','change','Change'); change.setAttribute('aria-label','Choose replacement for '+exercise.name);
      change.addEventListener('click',()=>openChooser(index));
      const swap = element('button','swap'); swap.innerHTML=swapIcon; swap.setAttribute('aria-label','Swap '+exercise.name);
      swap.addEventListener('click',()=>{
        if(active)return; const result=swapExercise(bank,current,index);
        if(result.error){notify('Add another '+exercise.group.toLowerCase()+' exercise in Exercises.');return;}
        current=result.exercises; complete=false; notify(''); renderBoard();save();
      });
      actions.append(change,swap);bottom.append(actions);card.append(bottom);grid.append(card);
    });
    if(current.length<4) {
      const add=element('button','add-card');add.append(element('span','','+'),element('span','','Add exercise'));
      add.addEventListener('click',()=>openChooser(null));grid.append(add);
    }
    const valid=current.length===3||current.length===4;
    document.querySelectorAll('[data-count]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.count)===current.length)));
    $('#rounds').value=String(rounds);$('#start').disabled=!valid;
    $('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));
    const seq=$('#sequence');seq.replaceChildren();
    if(valid){
      const pattern=current.length===3?['1 · 30s','2 · 30s','3 · 30s','Rest · 30s']:['1 · 30s','2 · 30s','Rest · 30s','3 · 30s','4 · 30s','Rest · 30s'];
      pattern.forEach(label=>seq.append(element('li',label.startsWith('Rest')?'rest':'',label)));
    } else {seq.append(element('li','','Choose 3 or 4 exercises.'));}
    if(!active) {
      $('#phase').textContent=complete?'Done':'Timer';$('#rounds-label').hidden=false;$('#round-display').hidden=true;
      $('#seconds').textContent=complete?'0':'30';$('#clock-label').textContent=complete?'Done':'Ready';
      $('#active-name').textContent=current.length+' exercises';$('#next').textContent=valid?clock(duration(current.length,rounds))+' total':'';
      $('#start').textContent=complete?'Start again':'Start';$('#stop').hidden=true;$('#skip').hidden=true;
      $('#ring').style.strokeDashoffset='0';$('.timer-box').classList.remove('resting','running');
    }
  }
  function shuffle(count=current.length===4?4:3) {
    if(active)return;
    const result=generate(bank,count,{},current);
    if(result.error){notify(result.error.replace('that matches your filters.','in Exercises.'));return;}
    current=result.exercises;complete=false;notify('');renderBoard();save();
  }
  document.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>shuffle(Number(b.dataset.count))));
  $('#shuffle').addEventListener('click',()=>shuffle());
  $('#rounds').addEventListener('change',e=>{rounds=Number(e.target.value);complete=false;renderBoard();save();});
  function openChooser(index) {
    if(active)return;choosingIndex=index;
    const list=$('#choose-list');list.replaceChildren();$('#choose-title').textContent=index===null?'Add exercise':'Change exercise';
    const groups=index===null?GROUPS.filter(g=>!current.some(e=>e.group===g)):[current[index].group];
    let options=0;
    groups.forEach(group=>{
      const moves=bank.filter(e=>e.group===group&&!current.some(p=>p.id===e.id));
      if(!moves.length)return;list.append(element('h3','',group));
      moves.forEach(exercise=>{options++;const button=element('button','pick-move',exercise.name);
        button.addEventListener('click',()=>{
          if(choosingIndex===null)current.push(exercise);else current[choosingIndex]=exercise;
          complete=false;$('#choose').close();notify('');renderBoard();save();
        });list.append(button);
      });
    });
    if(!options)list.append(element('p','empty','Add more moves in Exercises.'));
    $('#choose').showModal();
  }
  function renderBank() {
    const list=$('#bank-list');list.replaceChildren();
    GROUPS.forEach(group=>{
      const section=element('section','bank-group');section.append(element('h3','',group));
      bank.filter(e=>e.group===group).forEach(exercise=>{
        const row=element('div','bank-row');row.append(element('span','',exercise.name));const remove=element('button','','Remove');remove.setAttribute('aria-label','Delete '+exercise.name+' from exercises');
        remove.addEventListener('click',()=>{bank=bank.filter(e=>e.id!==exercise.id);current=current.filter(e=>e.id!==exercise.id);complete=false;renderBank();renderBoard();save();});row.append(remove);section.append(row);
      });list.append(section);
    });
  }
  $('#open-bank').addEventListener('click',()=>{if(active)return;renderBank();$('#bank').showModal();});
  document.querySelectorAll('dialog .close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  $('#add-form').addEventListener('submit',e=>{
    e.preventDefault();const name=$('#exercise-name').value.trim().replace(/\s+/g,' ');
    if(!name){$('#exercise-name').focus();return;}
    if(bank.some(ex=>ex.name.toLowerCase()===name.toLowerCase())){$('#exercise-name').setCustomValidity('This exercise already exists.');$('#exercise-name').reportValidity();return;}
    bank.push({id:'custom-'+(globalThis.crypto?.randomUUID?.()||Date.now()),name,group:$('#exercise-group').value,enabled:true,lowImpact:true});
    $('#exercise-name').value='';renderBank();save();
  });
  $('#exercise-name').addEventListener('input',()=>$('#exercise-name').setCustomValidity(''));
  $('#reset-bank').addEventListener('click',()=>{
    // Restore missing defaults while keeping the user's custom exercises.
    for(const move of DEFAULTS)if(!bank.some(e=>e.name.toLowerCase()===move.name.toLowerCase()))bank.push({...move});
    renderBank();save();
  });
  async function prepareAudio() {
    try {audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{}
  }
  function beep(frequency=700,long=false) {
    if(!sound||!audio||audio.state!=='running')return;
    try{
      const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.15,audio.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+(long?.5:.12));
      oscillator.start();oscillator.stop(audio.currentTime+(long?.55:.15));
    }catch{}
  }
  async function stayAwake() {
    if(!active||document.visibilityState!=='visible')return;
    $('#awake').hidden=false;
    if(!('wakeLock' in navigator)){$('#awake').textContent='Keep this page open. Turn off Auto-Lock in phone settings.';return;}
    try{
      if(wakeLock&&!wakeLock.released)return;
      wakeLock=await navigator.wakeLock.request('screen');
      if(!active){await wakeLock.release();wakeLock=null;return;}
      $('#awake').textContent='Screen awake';
      wakeLock.addEventListener('release',()=>{if(active)$('#awake').textContent='Screen lock released. Keep this page open.';});
    }catch{$('#awake').textContent='Keep this page open. Turn off Auto-Lock in phone settings.';}
  }
  function releaseWake(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null;}}
  function showPhase() {
    const step=timeline[position],rest=step.phase==='Rest';
    $('.timer-box').classList.toggle('resting',rest);
    $('#phase').textContent=step.phase==='Ready'?'Get ready':rest?'Rest':'Exercise';
    $('#clock-label').textContent=rest?'Rest':step.phase==='Ready'?'Get ready':'Exercise '+(step.index+1);
    $('#active-name').textContent=rest?'Rest':step.exercise.name;
    $('#round-display').textContent='Round '+step.round+' / '+rounds;
    $('#next').textContent=rest?(step.final?'Finish next':'Next: '+step.exercise.name):timeline[position+1]?(timeline[position+1].phase==='Rest'?'Next: rest':'Next: '+timeline[position+1].exercise.name):'';
    document.querySelectorAll('.exercise-card').forEach((card,index)=>card.classList.toggle('active',!rest&&index===step.index));
    if(paused)$('#phase').textContent='Paused';
  }
  function tick() {
    if(!active||paused)return;
    const now=Date.now();let advanced=false;
    while(now>=deadline){
      position++;if(position>=timeline.length){finish();return;}
      deadline+=timeline[position].seconds*1000;advanced=true;
    }
    if(advanced){showPhase();beep(timeline[position].phase==='Rest'?420:900,true);lastSecond=-1;}
    const left=Math.max(0,deadline-now),second=Math.ceil(left/1000);
    $('#seconds').textContent=String(second).padStart(2,'0');
    $('#ring').style.strokeDashoffset=String(circleLength*(1-left/(timeline[position].seconds*1000)));
    if(second!==lastSecond){if(second>0&&second<=3)beep();lastSecond=second;}
  }
  function start() {
    if(current.length!==3&&current.length!==4)return;
    prepareAudio();active=true;paused=false;complete=false;position=0;lastSecond=-1;timeline=buildTimeline(current,rounds);deadline=Date.now()+timeline[0].seconds*1000;
    document.body.classList.add('training');$('.timer-box').classList.add('running');
    $('#rounds-label').hidden=true;$('#round-display').hidden=false;$('#start').textContent='Pause';$('#stop').hidden=false;$('#skip').hidden=false;
    document.querySelectorAll('.toolbar button,#open-bank').forEach(b=>b.disabled=true);
    notify('');showPhase();tick();tickHandle=setInterval(tick,100);stayAwake();
    $('.timer-box').scrollIntoView({block:'start'});
  }
  function stop(done=false) {
    active=false;paused=false;complete=done;clearInterval(tickHandle);tickHandle=null;releaseWake();
    document.body.classList.remove('training');document.querySelectorAll('.toolbar button,#open-bank').forEach(b=>b.disabled=false);
    $('#awake').hidden=true;renderBoard();
  }
  function finish(){stop(true);beep(1050,true);}
  $('#start').addEventListener('click',()=>{
    if(!active){start();return;}
    if(paused){deadline=Date.now()+remaining;paused=false;$('#start').textContent='Pause';prepareAudio();stayAwake();showPhase();tick();}
    else{remaining=Math.max(0,deadline-Date.now());paused=true;$('#start').textContent='Resume';$('#phase').textContent='Paused';}
  });
  $('#stop').addEventListener('click',()=>stop());
  $('#skip').addEventListener('click',()=>{
    if(!active)return;position++;if(position>=timeline.length){finish();return;}
    remaining=timeline[position].seconds*1000;deadline=Date.now()+remaining;lastSecond=-1;
    showPhase();$('#seconds').textContent=String(timeline[position].seconds).padStart(2,'0');$('#ring').style.strokeDashoffset='0';
    if(!paused){beep(timeline[position].phase==='Rest'?420:900,true);tick();}
  });
  $('#sound').addEventListener('click',()=>{
    sound=!sound;$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));
    if(sound)prepareAudio().then(()=>beep());save();
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active){stayAwake();tick();}});
  renderBoard();
})();
