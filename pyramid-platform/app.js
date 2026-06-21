/* ===================== DATA ===================== */
const SPACES=[
  {id:'blue',name:'Blue Hall',floor:'Floor -1',cap:220,rate:420,hex:'#2F6FA8',soft:'#E7F0F7'},
  {id:'orange',name:'Orange Hall',floor:'Floor -1',cap:160,rate:340,hex:'#D9762A',soft:'#FBEBDC'},
  {id:'green',name:'Green Hall',floor:'Floor -1',cap:190,rate:380,hex:'#3C8C5E',soft:'#E5F2EA'},
  {id:'yellow',name:'Yellow Hall',floor:'Floor -1',cap:90,rate:240,hex:'#D6A82A',soft:'#FBF3DD'},
];
const sp=id=>SPACES.find(s=>s.id===id);
const TEAMS=[
  {id:'front',name:'Front Office',who:'Ana K.',color:'#2F6FA8'},
  {id:'ops',name:'Operations',who:'Besnik R.',color:'#D9762A'},
  {id:'logistics',name:'Logistics',who:'Drita M.',color:'#3C8C5E'},
  {id:'av',name:'AV Team',who:'Erion P.',color:'#D6A82A'},
];
const team=id=>TEAMS.find(t=>t.id===id);
const ALABEL={chairs:'Chairs',tables:'Tables',mics:'Wireless mics',screens:'LED screens',speakers:'PA speakers'};

let state={
  tab:'dashboard',
  events:[
    {id:1,org:'StartupHub Albania',type:'Conference',guests:180,date:'2026-07-14',space:'blue',status:'confirmed',blurb:'A day of founder talks, demos and investor meetings.'},
    {id:2,org:'Tirana Design Week',type:'Exhibition',guests:90,date:'2026-07-14',space:'yellow',status:'confirmed',blurb:'Albanian product and graphic design, on show.'},
    {id:3,org:'DevFest Tirana',type:'Hackathon',guests:200,date:'2026-07-16',space:'blue',status:'reviewing',blurb:'48 hours of building with the dev community.'},
    {id:4,org:'Balkan Founders',type:'Workshop',guests:60,date:'2026-07-09',space:'green',status:'confirmed',blurb:'Hands-on growth workshop for early teams.'},
  ],
  requests:[
    {id:101,org:'Albania AI Summit',type:'Conference',guests:210,date:'2026-07-16',space:null,status:'new'},
    {id:102,org:'Tech Women Meetup',type:'Workshop',guests:70,date:'2026-07-22',space:null,status:'new'},
  ],
  inventory:[
    {key:'chairs',label:'Chairs',icon:'▦',total:400,loc:{storage:260,blue:60,orange:50,green:30,yellow:0}},
    {key:'tables',label:'Tables',icon:'▭',total:60,loc:{storage:42,blue:8,orange:6,green:4,yellow:0}},
    {key:'mics',label:'Wireless mics',icon:'🎙',total:12,loc:{storage:3,blue:4,orange:3,green:2,yellow:0}},
    {key:'screens',label:'LED screens',icon:'▣',total:6,loc:{storage:2,blue:2,orange:1,green:1,yellow:0}},
    {key:'speakers',label:'PA speakers',icon:'◉',total:10,loc:{storage:7,blue:0,orange:2,green:1,yellow:0}},
  ],
  tasks:[
    {id:1,title:'Confirm quotation — StartupHub',team:'front',done:true,due:'Jul 10'},
    {id:2,title:'Reserve Blue Hall — StartupHub',team:'ops',done:true,due:'Jul 10'},
    {id:3,title:'Pull 180 chairs from storage',team:'logistics',done:false,due:'Jul 13'},
    {id:4,title:'Set up AV for Conference',team:'av',done:false,due:'Jul 13'},
    {id:5,title:'Prep Yellow Hall — Design Week',team:'logistics',done:false,due:'Jul 13'},
  ],
  activity:[
    {id:1,actor:'Ana K.',action:'confirmed quotation for',target:'StartupHub Albania',time:'2h ago',kind:'confirm'},
    {id:2,actor:'Besnik R.',action:'reserved Blue Hall for',target:'StartupHub Albania',time:'2h ago',kind:'reserve'},
    {id:3,actor:'System',action:'flagged a scheduling conflict on',target:'Blue Hall · 16 Jul',time:'5h ago',kind:'conflict'},
    {id:4,actor:'Drita M.',action:'moved 40 chairs to',target:'Orange Hall',time:'Yesterday',kind:'move'},
  ],
  flow:null,chat:[{from:'ai',text:"Hi! Paste or describe an event inquiry and I'll pull out the details."}],chatInput:'',extracted:null,taskFilter:'all',qrOpen:null,moving:null,
};

/* ===================== HELPERS ===================== */
const E=(t,a={},...kids)=>{const el=document.createElement(t);for(const k in a){if(k==='class')el.className=a[k];else if(k==='html')el.innerHTML=a[k];else if(k.startsWith('on'))el.addEventListener(k.slice(2),a[k]);else if(k==='style')el.setAttribute('style',a[k]);else el.setAttribute(k,a[k]);}for(const kid of kids){if(kid==null)continue;el.append(kid.nodeType?kid:document.createTextNode(kid));}return el;};
const fmt=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'—';
const fmtLong=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}):'—';
const need=g=>({chairs:g,tables:Math.ceil(g/10),mics:g>150?4:g>60?2:1,screens:g>150?2:1,speakers:g>100?4:2});
const poolFree=it=>it.total-(it.loc.blue+it.loc.orange+it.loc.green+it.loc.yellow);
const autoMatch=g=>{const c=SPACES.filter(s=>s.cap>=g*1.1).sort((a,b)=>a.cap-b.cap)[0];if(c)return c.id;const a=SPACES.filter(s=>s.cap>=g).sort((a,b)=>a.cap-b.cap)[0];return a?a.id:null;};
function conflicts(){const o=[],ev=state.events;for(let i=0;i<ev.length;i++)for(let j=i+1;j<ev.length;j++)if(ev[i].space&&ev[i].space===ev[j].space&&ev[i].date===ev[j].date)o.push([ev[i],ev[j]]);return o;}
function log(action,target,kind){state.activity.unshift({id:Date.now()+Math.random(),actor:'Besnik R.',action,target,time:'just now',kind});}
function dateConflict(spaceId,date){return state.events.some(e=>e.space===spaceId&&e.date===date);}

/* glyph: 4 coloured cubes around a stone pyramid */
function glyph(size){const s=size,u=s/30;return `<svg width="${s}" height="${s*0.93}" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="15,2 27,24 3,24" fill="#211D17"/>
  <polygon points="15,2 21,13 9,13" fill="#fff" opacity="0.16"/>
  <rect x="1" y="22" width="6" height="5" rx="1" fill="#2F6FA8"/>
  <rect x="9" y="23.5" width="5.5" height="3.5" rx="1" fill="#3C8C5E"/>
  <rect x="16" y="23.5" width="5.5" height="3.5" rx="1" fill="#D6A82A"/>
  <rect x="23" y="22" width="6" height="5" rx="1" fill="#D9762A"/>
</svg>`;}

/* ===================== SMARTER LOCAL NLU (fallback) ===================== */
function localParse(text){
  const t=text.toLowerCase();
  // guests
  let guests=null;
  const gm=t.match(/(\d{2,4})\s*(?:people|guests|pax|attendees|persons|heads|seats)/)||t.match(/for\s*(?:about\s*|around\s*|~\s*)?(\d{2,4})/)||t.match(/~\s*(\d{2,4})/);
  if(gm)guests=parseInt(gm[1]); else {const any=t.match(/\b(\d{2,4})\b/);if(any)guests=parseInt(any[1]);}
  if(!guests)guests=120;
  // type
  let type='Conference';
  if(/hackathon|hack /.test(t))type='Hackathon';
  else if(/workshop|training|masterclass/.test(t))type='Workshop';
  else if(/exhibition|expo|showcase|fair/.test(t))type='Exhibition';
  else if(/gala|dinner|wedding|private|reception|party/.test(t))type='Private event';
  else if(/perform|concert|show|theatre|theater|gig/.test(t))type='Performance';
  else if(/meetup|gathering|community/.test(t))type='Workshop';
  // multi-day
  const md=t.match(/(\d+)\s*-?\s*day/)||(/two[- ]day/.test(t)?[null,'2']:null)||(/three[- ]day/.test(t)?[null,'3']:null);
  const days=md?parseInt(md[1]):1;
  // date
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let date='2026-07-20',dateGuess=true;
  const dm=t.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:of\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  const dm2=t.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})/);
  if(dm){const mi=months.indexOf(dm[2]);date='2026-'+String(mi+1).padStart(2,'0')+'-'+String(parseInt(dm[1])).padStart(2,'0');dateGuess=false;}
  else if(dm2){const mi=months.indexOf(dm2[1]);date='2026-'+String(mi+1).padStart(2,'0')+'-'+String(parseInt(dm2[2])).padStart(2,'0');dateGuess=false;}
  else {const mid=t.match(/(early|mid|late|end of|beginning of)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);if(mid){const mi=months.indexOf(mid[2]);const day=/early|beginning/.test(mid[1])?6:/late|end/.test(mid[1])?24:15;date='2026-'+String(mi+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');dateGuess=false;}}
  // org
  const om=text.match(/(?:from|by|we are|we're|this is|on behalf of)\s+([A-Z][A-Za-z0-9&'’ ]{2,40})/);
  let org=om?om[1].trim().replace(/\s+(and|to|on|in|at|for|would|want|a|the|next|who|we|is|are).*$/i,''):null;
  if(!org)org='New inquiry';
  // notes / special needs
  const notes=[];
  if(/cater|food|lunch|coffee|refreshment/.test(t))notes.push('catering');
  if(/access|wheelchair|disab/.test(t))notes.push('accessibility');
  if(/stage|keynote|panel/.test(t))notes.push('stage setup');
  if(/stream|broadcast|record/.test(t))notes.push('live streaming');
  return {org,type,guests,date,days,dateGuess,notes};
}

/* ===================== REAL AI (Claude) with graceful fallback ===================== */
async function askClaude(text){
  const system=`You extract structured event-booking details from a planner's message for The Pyramid of Tirana, which has four halls on floor -1: Blue (cap 220), Orange (cap 160), Green (cap 190), Yellow (cap 90).
Return ONLY a JSON object, no markdown, with keys:
{"org": string (organisation/event name, or "New inquiry" if absent),
 "type": one of "Conference","Hackathon","Workshop","Exhibition","Private event","Performance",
 "guests": integer,
 "date": "YYYY-MM-DD" (assume year 2026 if not stated; pick a sensible day for vague dates like "mid July"),
 "days": integer number of days (default 1),
 "notes": array of short strings for special needs (catering, accessibility, stage, streaming) — [] if none,
 "reply": a warm 1-2 sentence reply to the planner that names what you understood and why the hall suits them,
 "missing": array of any genuinely missing essentials (e.g. "date","guests") — [] if all present}`;
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system,messages:[{role:"user",content:text}]})
  });
  const data=await res.json();
  let out=(data.content||[]).map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
  const obj=JSON.parse(out);
  obj.dateGuess=false;obj._ai=true;
  return obj;
}

/* ===================== LANDING : AI CHAT ===================== */
const I_EXAMPLES=["A conference for 180 people on 14 July","2-day hackathon for ~200, mid July","Private gala dinner for 80 on 9 Aug"];
function iBoot(){document.getElementById('glyph1').innerHTML=glyph(30);document.getElementById('glyph2').innerHTML=glyph(28);document.getElementById('glyph3').innerHTML=glyph(28);document.getElementById('glyphBig').innerHTML=glyph(64);const gf=document.getElementById('glyphFoot');if(gf)gf.innerHTML=glyph(30);buildSocials();const c=document.getElementById('iChips');c.innerHTML="";I_EXAMPLES.forEach(ex=>c.append(E('button',{class:'chip',onclick:()=>{document.getElementById('iInput').value=ex;iSend();}},ex)));}
const SOCIAL_ICONS={
  instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  facebook:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3l.4-3H14V4.5c0-.8.3-1.5 1.6-1.5H17V.2C16.6.1 15.6 0 14.5 0 12 0 10.3 1.5 10.3 4.3V6H7.5v3h2.8v9H14V9z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h2.9l-6.3 7.2L21.6 21h-5.8l-4.5-5.9L6.1 21H3.2l6.8-7.8L2.7 3h5.9l4.1 5.4L17.5 3zm-1 16.2h1.6L7.6 4.7H5.9l10.6 14.5z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3V9zm6 0h3.8v1.6h.05c.53-1 1.83-2 3.77-2 4 0 4.75 2.6 4.75 6V21H17v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9V9z"/></svg>',
};
function buildSocials(){const host=document.getElementById('socials');if(!host)return;host.innerHTML="";
  const links=[['instagram','Instagram','#'],['facebook','Facebook','#'],['x','X','#'],['linkedin','LinkedIn','#']];
  links.forEach(([k,label,href])=>host.append(E('a',{class:'soc',href,target:'_blank',rel:'noopener','aria-label':label,title:label,html:SOCIAL_ICONS[k]})));
  host.append(E('a',{class:'soc yt',href:'#',target:'_blank',rel:'noopener','aria-label':'YouTube',title:'YouTube',html:'<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M23 7.5a3 3 0 00-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 001 7.5 31 31 0 00.6 12 31 31 0 001 16.5a3 3 0 002.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 002.1-2.1A31 31 0 0023.4 12 31 31 0 0023 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg><span>YouTube</span>'}));
}
function turn(html,who){const w=E('div',{class:'turn '+who});const a=E('div',{class:'av '+who,html:who==='ai'?glyph(16):'<span style="color:#fff;font-size:12px;font-weight:600">You</span>'});const b=E('div',{class:'bubble '+who,html:html});w.append(a,b);return w;}
async function iSend(){
  const inp=document.getElementById('iInput');const txt=inp.value.trim();if(!txt)return;
  const wel=document.getElementById('iwelcome');if(wel)wel.style.display='none';
  const stream=document.getElementById('stream');
  stream.append(turn(txt.replace(/</g,'&lt;'),'me'));inp.value='';
  const typing=E('div',{class:'turn ai'},E('div',{class:'av ai',html:glyph(16)}),E('div',{class:'bubble ai'},E('div',{class:'typing'},E('i'),E('i'),E('i'))));
  stream.append(typing);typing.scrollIntoView({behavior:'smooth',block:'end'});
  let d=null;
  try{ d=await askClaude(txt); }catch(e){ d=null; }
  if(!d)d=localParse(txt);
  typing.remove();
  iRespond(d);
}
function iRespond(d){
  const stream=document.getElementById('stream');
  const sId=autoMatch(d.guests);const s=sp(sId);const n=need(d.guests);
  const clash=s?dateConflict(s.id,d.date):false;
  const days=d.days||1;
  const venue=(s?s.rate:0)*days,setup=150,equip=Math.round(n.chairs*0.6+n.tables*2+n.mics*8+n.screens*25+n.speakers*10),total=venue+setup+equip;
  state._proposal={...d,space:sId,total};
  // assistant reply (use AI reply if present, else compose)
  let reply=d.reply;
  if(!reply){
    const why = s ? `${s.name} fits ${d.guests} comfortably (cap ${s.cap})` : `no single hall fits ${d.guests}, so you may need to split across halls`;
    reply=`A ${d.type.toLowerCase()} for ${d.guests}${days>1?` over ${days} days`:''} on ${fmtLong(d.date)} — ${why}.`;
  }
  stream.append(turn(reply,'ai'));
  const note = (d.notes&&d.notes.length)?`<div class="rrow"><span class="k">Noted needs</span><span class="v">${d.notes.join(' · ')}</span></div>`:'';
  const card=E('div',{class:'result',style:'margin-left:41px'});
  card.innerHTML=`
    <div class="strip" style="background:linear-gradient(90deg,${s?s.hex:'#999'},${s?s.hex:'#999'}aa)"></div>
    <div class="rtop"><div class="sw" style="background:${s?s.hex:'#ccc'}"></div>
      <div><div class="nm">${s?s.name:'Split across halls'}</div><div class="mt">Floor −1 · capacity ${s?s.cap:'—'} · ${d.type}${days>1?` · ${days} days`:''}</div></div></div>
    <div class="rbody">
      <div class="rrow"><span class="k">Availability · ${fmt(d.date)}</span><span class="v">${clash?'<span class="ok-chip" style="background:#FBE9E5;color:#8E2A1D">⚠ clash — needs review</span>':'<span class="ok-chip" style="background:var(--greenS);color:#285E3F">✓ free</span>'}</span></div>
      <div class="rrow"><span class="k">Required assets</span><span class="v">${n.chairs} chairs · ${n.tables} tables · ${n.mics} mics · ${n.screens} screens</span></div>
      ${note}
      <div class="rrow"><span class="k">Venue ${days>1?`(${days} days)`:'(1 day)'}</span><span class="v">€${venue}</span></div>
      <div class="rrow"><span class="k">Setup + equipment</span><span class="v">€${setup+equip}</span></div>
    </div>
    <div class="rtotal"><span class="k">Estimated total</span><span class="v">€${total}</span></div>`;
  stream.append(card);
  const ask = (d.missing&&d.missing.length)?` I assumed a few details (${d.missing.join(', ')}) — tweak the message if needed.`:'';
  stream.append(turn(`I've added <b>${d.org}</b> to the backstage queue.${ask} Want to take it further?`,'ai'));
  const acts=E('div',{class:'actions'},
    E('button',{class:'btn btn-dark',onclick:()=>sendToBackstage()},'◑ Go backstage →'),
    E('button',{class:'btn btn-ghost',onclick:()=>Tour.open()},'▤ Tour floor −1'));
  stream.append(acts);
  const fc=E('div',{class:'followchips'});
  [['Make it 2 days',`${d.type} for ${d.guests} over 2 days on ${fmt(d.date)}`],['Try a bigger hall',`${d.type} for ${Math.min(220,d.guests+60)} on ${fmt(d.date)}`],['Add catering',`${d.type} for ${d.guests} on ${fmt(d.date)} with catering`]].forEach(([lbl,q])=>fc.append(E('button',{class:'fchip',onclick:()=>{document.getElementById('iInput').value=q;iSend();}},lbl)));
  stream.append(fc);
  fc.scrollIntoView({behavior:'smooth',block:'end'});
}
function sendToBackstage(){const p=state._proposal;if(p){const r={id:Date.now(),org:p.org,type:p.type,guests:p.guests,date:p.date,space:null,status:'new'};state.requests.unshift(r);log('logged a request via AI assistant for',p.org,'intake');}goBackstage('requests');}

/* ===================== MODE SWITCH ===================== */
function show(id){['intake','app','tour'].forEach(x=>{const el=document.getElementById(x);el.style.display=(x===id?(x==='intake'?'flex':'block'):'none');});window.scrollTo(0,0);}
function goIntake(){show('intake');}
function goBackstage(tab){state.tab=tab||state.tab||'dashboard';state.flow=null;show('app');render();}
function enterApp(){goBackstage('dashboard');}

/* ===================== BACKSTAGE ===================== */
const NAV=[
  {id:'dashboard',label:'Dashboard',ic:'▦'},{id:'intake',label:'AI Intake',ic:'✦'},
  {id:'requests',label:'Requests',ic:'▣',badge:()=>state.requests.filter(r=>r.status==='new').length},
  {id:'calendar',label:'Calendar',ic:'▤'},{id:'inventory',label:'Inventory',ic:'▦'},
  {id:'tasks',label:'Tasks & Teams',ic:'☑',badge:()=>state.tasks.filter(t=>!t.done).length},
  {id:'activity',label:'Activity',ic:'◷'},
];
function go(tab){state.tab=tab;state.flow=null;render();window.scrollTo(0,0);}
function render(){
  const nav=document.getElementById('nav');nav.innerHTML='';const mtop=document.getElementById('mtop');mtop.innerHTML='';
  NAV.forEach(n=>{const b=n.badge?n.badge():0;const mk=h=>{const el=E('div',{class:'navitem'+(state.tab===n.id?' on':''),onclick:()=>go(n.id)},E('span',{class:'ic'},n.ic),E('span',{style:'flex:1'},n.label));if(b>0)el.append(E('span',{class:'bdg'},String(b)));h.append(el);};mk(nav);mk(mtop);});
  const v=document.getElementById('view');v.innerHTML='';
  const map={dashboard:viewDashboard,intake:viewIntake,requests:viewRequests,calendar:viewCalendar,inventory:viewInventory,tasks:viewTasks,activity:viewActivity};
  const node=map[state.tab]();node.classList.add('fade');v.append(node);
}
function pageHead(t,s){return E('div',{class:'ph'},E('div',{class:'ph-t fr'},t),E('div',{class:'ph-s'},s));}
function seclbl(t){return E('div',{class:'seclbl'},t);}
function viewDashboard(){
  const wrap=E('div',{});const cf=conflicts();
  wrap.append(E('div',{style:'display:flex;justify-content:space-between;align-items:flex-start'},pageHead('Operations dashboard','The single source of truth — everything in one place.'),E('button',{class:'btn btn-soft',onclick:()=>goIntake()},'✦  Ask the assistant')));
  const stats=[['confirmed events',state.events.filter(e=>e.status==='confirmed').length,'var(--green)'],['new requests',state.requests.filter(r=>r.status==='new').length,'var(--orange)'],['open tasks',state.tasks.filter(t=>!t.done).length,'var(--blue)'],['conflicts',cf.length,cf.length?'var(--danger)':'var(--grey)']];
  const g=E('div',{class:'grid4',style:'margin-bottom:24px'});stats.forEach(([l,n,c])=>g.append(E('div',{class:'card',style:'padding:20px 22px'},E('div',{class:'statnum fr',style:'color:'+c},String(n)),E('div',{class:'statlbl'},l))));wrap.append(g);
  if(cf.length){wrap.append(E('div',{class:'banner warn',style:'margin-bottom:24px'},E('span',{},'⚠'),E('div',{style:'flex:1'},E('b',{},cf.length+' scheduling conflict'+(cf.length>1?'s':'')+'. '),cf.map(([a,b])=>`${a.org} & ${b.org} both want ${sp(a.space).name} on ${fmt(a.date)}`).join('; ')+'.'),E('button',{class:'btn',style:'background:#8E2A1D;color:#fff;padding:8px 16px;font-size:12.5px',onclick:()=>go('calendar')},'View calendar')));}
  const cols=E('div',{class:'dyn-2',style:'display:grid;grid-template-columns:1.3fr 1fr;gap:20px'});
  const left=E('div',{},seclbl('The four wings · floor −1'));const wg=E('div',{class:'grid2'});
  SPACES.forEach(s=>{const t=state.events.filter(e=>e.space===s.id);wg.append(E('div',{class:'card card-h',style:'padding:18px;cursor:pointer',onclick:()=>go('calendar')},E('div',{style:'display:flex;align-items:center;gap:10px;margin-bottom:12px'},E('span',{class:'swatch',style:'background:'+s.hex}),E('div',{style:'font-weight:600;font-size:14px'},s.name)),E('div',{style:'font-size:11.5px;color:var(--grey)'},s.floor+' · cap '+s.cap),E('div',{style:'font-size:12px;margin-top:10px;color:'+(t.length?'var(--ink)':'var(--grey)')},t.length?t.length+' event'+(t.length>1?'s':'')+' booked':'Free this week')));});left.append(wg);
  const right=E('div',{},seclbl('Inventory pulse'));const ic=E('div',{class:'card',style:'padding:20px'});
  state.inventory.forEach(it=>{const free=poolFree(it),pct=Math.round(free/it.total*100),low=pct<30;ic.append(E('div',{style:'margin-bottom:14px'},E('div',{style:'display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px'},E('span',{},it.label),E('span',{class:'mono',style:'color:'+(low?'var(--danger)':'var(--grey)')},free+'/'+it.total+' free')),E('div',{class:'bar'},E('i',{style:'width:'+pct+'%;background:'+(low?'var(--danger)':'var(--green)')}))));});right.append(ic);
  cols.append(left,right);wrap.append(cols);return wrap;
}
function chatSend(){const t=state.chatInput.trim();if(!t)return;state.chat.push({from:'me',text:t});state.extracted=localParse(t);state.chat.push({from:'ai',text:"Here's what I understood — add it to the queue or edit anything."});state.chatInput='';render();setTimeout(()=>{const b=document.querySelector('.chatbody');if(b)b.scrollTop=b.scrollHeight;},30);}
function addExtracted(){const r={id:Date.now(),...state.extracted,space:null,status:'new'};state.requests.unshift(r);log('logged a request via AI intake for',state.extracted.org,'intake');state.chat.push({from:'ai',text:`Added ${state.extracted.org} to the queue.`});state.extracted=null;render();}
function viewIntake(){
  const wrap=E('div',{});wrap.append(pageHead('AI Intake','The fast front door — a message in, a structured request out.'));
  const cols=E('div',{class:'dyn-2',style:'display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start'});
  const chat=E('div',{class:'card chatwrap'});const body=E('div',{class:'chatbody'});
  state.chat.forEach(m=>{const w=E('div',{style:'align-self:'+(m.from==='ai'?'flex-start':'flex-end')+';max-width:82%'});if(m.from==='ai')w.append(E('div',{class:'ailabel'},'✦ ASSISTANT'));w.append(E('div',{class:'msg '+(m.from==='ai'?'ai':'me')},m.text));body.append(w);});
  if(state.extracted){const ex=state.extracted;const c=E('div',{class:'fade',style:'align-self:flex-start;max-width:92%;background:#fff;border:1px solid var(--line2);border-radius:12px;padding:16px;margin-top:4px'},E('div',{style:'font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--grey);margin-bottom:10px'},'Extracted request'));[['Organization','org'],['Type','type'],['Guests','guests'],['Date','date']].forEach(([lbl,key])=>{const r=E('div',{style:'display:flex;align-items:center;gap:10px;margin-bottom:8px'},E('span',{style:'width:90px;font-size:11.5px;color:var(--grey)'},lbl));r.append(E('input',{class:'inp',style:'padding:7px 10px;font-size:13px',value:String(ex[key]),type:key==='guests'?'number':(key==='date'?'date':'text'),oninput:e=>{state.extracted[key]=key==='guests'?+e.target.value:e.target.value;}}));c.append(r);});c.append(E('button',{class:'btn btn-green',style:'margin-top:8px;width:100%;justify-content:center',onclick:addExtracted},'✓  Add to queue'));body.append(c);}
  chat.append(body);
  chat.append(E('div',{style:'border-top:1px solid var(--line);padding:14px;display:flex;gap:10px'},E('input',{class:'inp',style:'flex:1',placeholder:'Describe the event request…',value:state.chatInput,oninput:e=>state.chatInput=e.target.value,onkeydown:e=>{if(e.key==='Enter')chatSend();}}),E('button',{class:'btn btn-dark',style:'padding:0 16px',onclick:chatSend},'➤')));
  const aside=E('div',{},seclbl('Try an example'));["Hi, we're DevFest Tirana — a 2-day hackathon for about 200 people on 16th July.","Private gala dinner for 80 guests, evening of 9 Aug, with catering."].forEach(ex=>aside.append(E('div',{class:'card card-h',style:'padding:13px 15px;margin-bottom:10px;cursor:pointer;font-size:12.5px;color:var(--grey);line-height:1.5',onclick:()=>{state.chatInput=ex;render();}},ex)));
  cols.append(chat,aside);wrap.append(cols);return wrap;
}
function openFlow(r){state.flow={req:r,step:1,space:r.space||autoMatch(r.guests)};render();}
function finalizeFlow(){const f=state.flow,s=sp(f.space);state.events.push({id:Date.now(),org:f.req.org,type:f.req.type,guests:f.req.guests,date:f.req.date,space:f.space,status:'confirmed',blurb:'Newly confirmed event.'});state.requests=state.requests.filter(r=>r.id!==f.req.id);state.tasks.push({id:Date.now()+1,title:`Reserve ${s.name} — ${f.req.org}`,team:'ops',done:false,due:fmt(f.req.date)},{id:Date.now()+2,title:`Pull ${f.req.guests} chairs from storage`,team:'logistics',done:false,due:fmt(f.req.date)},{id:Date.now()+3,title:`Set up AV — ${f.req.org}`,team:'av',done:false,due:fmt(f.req.date)});log(`confirmed & reserved ${s.name} for`,f.req.org,'confirm');state.flow=null;render();}
function viewRequests(){
  if(state.flow)return flowView();
  const wrap=E('div',{});wrap.append(E('div',{style:'display:flex;justify-content:space-between;align-items:flex-start'},pageHead('Requests','Incoming inquiries waiting to become events.'),E('button',{class:'btn btn-dark',onclick:()=>goIntake()},'✦  New via assistant')));
  if(!state.requests.length)wrap.append(E('div',{class:'fr',style:'text-align:center;padding:50px;color:var(--grey)'},'No open requests. The queue is clear.'));
  state.requests.forEach(r=>{const m=sp(autoMatch(r.guests));wrap.append(E('div',{class:'card card-h',style:'display:flex;align-items:center;gap:16px;padding:16px 18px;margin-bottom:11px;cursor:pointer',onclick:()=>openFlow(r)},E('div',{style:'width:40px;height:40px;border-radius:10px;background:'+(m?m.soft:'#eee')+';display:flex;align-items:center;justify-content:center;color:'+(m?m.hex:'#999')},'◷'),E('div',{style:'flex:1'},E('div',{style:'font-weight:600;font-size:14.5px'},r.org),E('div',{style:'font-size:12px;color:var(--grey);margin-top:2px'},r.type+' · '+r.guests+' guests · '+fmt(r.date))),E('div',{style:'font-size:12px;color:var(--grey)'},'Best fit: ',E('b',{style:'color:'+(m?m.hex:'#999')},m?m.name:'—')),E('span',{class:'pill',style:'background:var(--orangeS);color:var(--orange)'},r.status),E('span',{style:'color:var(--grey)'},'→')));});
  return wrap;
}
function flowView(){
  const f=state.flow,s=sp(f.space),n=need(f.req.guests);
  const venue=s?s.rate:0,setup=150,equip=Math.round(n.chairs*0.6+n.tables*2+n.mics*8+n.screens*25+n.speakers*10),total=venue+setup+equip;const cf=s?dateConflict(s.id,f.req.date):false;
  const wrap=E('div',{});wrap.append(E('div',{style:'display:flex;align-items:center;gap:12px;margin-bottom:14px'},E('span',{style:'cursor:pointer;color:var(--grey);font-size:20px',onclick:()=>{state.flow=null;render();}},'✕'),pageHead(f.req.org,f.req.type+' · '+f.req.guests+' guests · '+fmt(f.req.date))));
  const labels=['Match space','Check assets','Quotation','Confirm'];const steps=E('div',{class:'steps'});labels.forEach((l,i)=>{const nn=i+1;steps.append(E('div',{class:'step'+(nn===f.step?' on':nn<f.step?' dn':''),onclick:()=>{if(nn<=f.step){f.step=nn;render();}}},E('span',{class:'d'}),String(nn).padStart(2,'0')+' '+l));});wrap.append(steps);
  const card=E('div',{class:'card',style:'padding:30px'});
  if(f.step===1){card.append(seclbl('Pick a wing for '+f.req.guests+' guests'));const g=E('div',{class:'grid4'});SPACES.forEach(x=>{const fits=x.cap>=f.req.guests,sel=f.space===x.id;g.append(E('div',{style:'border:2px solid '+(sel?x.hex:'var(--line)')+';border-radius:12px;padding:16px;cursor:'+(fits?'pointer':'not-allowed')+';opacity:'+(fits?1:.4)+';background:'+(sel?x.soft:'#fff')+';transition:.2s',onclick:()=>{if(fits){f.space=x.id;render();}}},E('div',{style:'height:40px;border-radius:8px;background:'+x.hex+';margin-bottom:12px'}),E('div',{style:'font-weight:600;font-size:14px'},x.name),E('div',{style:'font-size:11.5px;color:var(--grey);margin-top:3px'},'cap '+x.cap+' · €'+x.rate+'/day'),E('div',{style:'font-size:11px;margin-top:8px;font-weight:600;color:'+(fits?'var(--green)':'var(--danger)')},fits?'Good fit':'Over capacity')));});card.append(g);}
  if(f.step===2){card.append(E('div',{class:'banner '+(cf?'warn':'ok'),style:'margin-bottom:20px'},E('span',{},cf?'⚠':'✓'),cf?'This hall already has a booking on '+fmt(f.req.date)+' — flagged for ops review.':'All required assets available for this date.'));card.append(seclbl('Required assets'));const g=E('div',{class:'grid2'});Object.entries(n).forEach(([k,v])=>g.append(E('div',{class:'assetrow'},E('span',{},E('span',{class:'mono',style:'color:var(--grey);margin-right:8px'},String(v).padStart(3,'0')),ALABEL[k]))));card.append(g);}
  if(f.step===3){card.append(seclbl('Quotation'));[['Venue rental ('+s.name+')',venue],['Setup & teardown',setup],['Equipment & furnishing',equip]].forEach(([k,v])=>card.append(E('div',{class:'row'},E('span',{class:'k'},k),E('span',{class:'v'},'€'+v))));card.append(E('div',{style:'display:flex;justify-content:space-between;padding-top:16px;margin-top:8px;font-size:22px',class:'fr'},E('span',{style:'font-weight:600'},'Total'),E('span',{style:'font-weight:600;color:var(--accent)'},'€'+total)));}
  if(f.step===4){card.append(seclbl('Operational plan — confirm to dispatch'));[['Confirm quotation','front'],['Reserve '+s.name,'ops'],['Pull chairs & tables','logistics'],['Allocate AV','av']].forEach(([t,st])=>card.append(E('div',{style:'display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--line);font-size:13.5px'},E('span',{class:'swatch',style:'width:8px;height:8px;border-radius:50%;background:'+team(st).color}),t,E('span',{class:'mono',style:'margin-left:auto;font-size:10.5px;color:var(--grey)'},team(st).name.toUpperCase()))));card.append(E('div',{style:'margin-top:18px;font-size:13px;color:var(--grey)'},'Confirming creates the calendar event, reserves the assets, and assigns these tasks to teams automatically.'));}
  const nav=E('div',{style:'display:flex;justify-content:space-between;margin-top:28px'},E('button',{class:'btn btn-ghost',onclick:()=>{if(f.step>1){f.step--;render();}else{state.flow=null;render();}}},'← Back'));
  if(f.step<4)nav.append(E('button',{class:'btn btn-dark',onclick:()=>{f.step++;render();}},'Continue →'));else nav.append(E('button',{class:'btn btn-green',onclick:finalizeFlow},'Confirm & reserve →'));
  card.append(nav);wrap.append(card);return wrap;
}
function viewCalendar(){
  const wrap=E('div',{});wrap.append(pageHead('Calendar','Every wing, every booking. Conflicts surface in red.'));
  const days=[...new Set(state.events.map(e=>e.date))].sort();const cf=conflicts();const isC=e=>cf.some(([a,b])=>a.id===e.id||b.id===e.id);
  const cal=E('div',{class:'cal',style:'grid-template-columns:120px repeat('+days.length+',1fr)'});cal.append(E('div',{}));
  days.forEach(d=>cal.append(E('div',{class:'calhead'},new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))));
  SPACES.forEach(s=>{cal.append(E('div',{class:'calrow'},E('span',{class:'swatch',style:'width:11px;height:11px;background:'+s.hex}),s.name));days.forEach(d=>{const cell=E('div',{style:'min-height:70px'});state.events.filter(e=>e.space===s.id&&e.date===d).forEach(e=>{cell.append(E('div',{class:'ev',style:'background:'+(isC(e)?'#FBE9E5':s.soft)+';border:1px solid '+(isC(e)?'var(--danger)':s.hex)},E('div',{class:'o',style:'color:'+(isC(e)?'#8E2A1D':s.hex)},e.org),E('div',{class:'g'},e.guests+' guests'+(isC(e)?' · ⚠ clash':''))));});cal.append(cell);});});
  wrap.append(cal);return wrap;
}
function qrSVG(value){const grid=11,px=8;let seed=0;for(let i=0;i<value.length;i++)seed=(seed*31+value.charCodeAt(i))&0xffffffff;let s='';for(let r=0;r<grid;r++)for(let c=0;c<grid;c++){let on;if((r<3&&c<3)||(r<3&&c>grid-4)||(r>grid-4&&c<3)){on=(r===0||c===0||r===2||c===2||r===grid-1||c===grid-3||(r===1&&c===1))?1:0;}else{on=Math.sin((r+1)*(c+3)*(seed%97+1))>0.1?1:0;}if(on)s+=`<rect x="${c*px}" y="${r*px}" width="${px}" height="${px}" fill="#211D17"/>`;}return `<svg width="${grid*px}" height="${grid*px}" style="background:#fff;border-radius:6px;border:1px solid var(--line)">${s}</svg>`;}
function moveAsset(key,from,to,qty){const it=state.inventory.find(x=>x.key===key);const amt=Math.min(qty,it.loc[from]);it.loc[from]-=amt;it.loc[to]+=amt;log(`moved ${amt} ${it.label.toLowerCase()} to`,to==='storage'?'Storage':sp(to).name,'move');state.moving=null;render();}
function viewInventory(){
  const wrap=E('div',{});wrap.append(pageHead('Inventory','Track and move shared assets. Each type carries a scannable QR tag.'));
  const locs=['storage','blue','orange','green','yellow'];const ln=l=>l==='storage'?'Storage':sp(l).name;const lh=l=>l==='storage'?'#6E665A':sp(l).hex;
  state.inventory.forEach(it=>{const card=E('div',{class:'card',style:'padding:20px;margin-bottom:14px'});
    card.append(E('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'},E('div',{style:'display:flex;align-items:center;gap:10px'},E('span',{style:'font-size:18px'},it.icon),E('div',{style:'font-weight:600;font-size:15px'},it.label),E('span',{class:'mono',style:'font-size:11px;color:var(--grey)'},it.total+' total · '+poolFree(it)+' in pool')),E('div',{style:'display:flex;gap:8px'},E('button',{class:'btn btn-soft',style:'padding:7px 12px;font-size:12px',onclick:()=>{state.qrOpen=state.qrOpen===it.key?null:it.key;render();}},'▦ Tag'),E('button',{class:'btn btn-soft',style:'padding:7px 14px;font-size:12px',onclick:()=>{state.moving={key:it.key,from:'storage',to:'blue',qty:10};render();}},'⇄ Move'))));
    if(state.qrOpen===it.key)card.append(E('div',{class:'fade',style:'display:flex;gap:16px;align-items:center;padding:16px;background:var(--stone);border-radius:10px;margin-bottom:14px',html:`<div>${qrSVG('PYR-ASSET-'+it.key.toUpperCase())}</div><div><div style="font-weight:600;font-size:13px">Asset tag · ${it.label}</div><div class="mono" style="font-size:11px;color:var(--grey);margin-top:4px">PYR-ASSET-${it.key.toUpperCase()}</div><div style="font-size:12px;color:var(--grey);margin-top:6px;max-width:340px">Print and stick on the crate. Scanning on the floor opens this asset to check it in or out of a hall.</div></div>`}));
    const lg=E('div',{style:'display:grid;grid-template-columns:repeat(5,1fr);gap:10px'});locs.forEach(l=>lg.append(E('div',{class:'loc',style:'border-left-color:'+lh(l)},E('div',{class:'n'},ln(l)),E('div',{class:'q fr'},String(it.loc[l])))));card.append(lg);
    if(state.moving&&state.moving.key===it.key){const m=state.moving;const mv=E('div',{class:'fade',style:'margin-top:16px;padding:16px;background:var(--stone);border-radius:10px;display:flex;gap:12px;align-items:end;flex-wrap:wrap'});const sel=(val)=>{const s=E('select',{class:'inp',onchange:e=>{m[val]=e.target.value;}});locs.forEach(l=>{const o=E('option',{value:l},ln(l));if(m[val]===l)o.selected=true;s.append(o);});return s;};mv.append(E('div',{},E('div',{class:'lbl'},'From'),sel('from')),E('div',{},E('div',{class:'lbl'},'To'),sel('to')),E('div',{},E('div',{class:'lbl'},'Quantity'),E('input',{class:'inp',type:'number',style:'width:90px',value:m.qty,oninput:e=>m.qty=+e.target.value})),E('button',{class:'btn btn-dark',onclick:()=>moveAsset(it.key,m.from,m.to,m.qty)},'Confirm move'),E('button',{class:'btn btn-ghost',onclick:()=>{state.moving=null;render();}},'Cancel'));card.append(mv);}
    wrap.append(card);});
  return wrap;
}
function viewTasks(){
  const wrap=E('div',{});wrap.append(pageHead('Tasks & Teams','Who does what before the doors open — assigned, tracked, done.'));
  const prog=Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100);
  wrap.append(E('div',{class:'card',style:'padding:20px;margin-bottom:20px'},E('div',{style:'display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px'},E('span',{style:'font-weight:600'},'Overall readiness'),E('span',{class:'mono'},prog+'%')),E('div',{class:'bar',style:'height:8px'},E('i',{style:'width:'+prog+'%;background:var(--green)'}))));
  const chips=E('div',{style:'display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap'});chips.append(E('button',{class:'chipf'+(state.taskFilter==='all'?' on':''),onclick:()=>{state.taskFilter='all';render();}},'All teams'));TEAMS.forEach(t=>chips.append(E('button',{class:'chipf'+(state.taskFilter===t.id?' on':''),style:state.taskFilter===t.id?'background:'+t.color+';border-color:'+t.color+';color:#fff':'',onclick:()=>{state.taskFilter=t.id;render();}},t.name)));wrap.append(chips);
  const cols=E('div',{class:'dyn-2',style:'display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start'});const list=E('div',{});const shown=state.taskFilter==='all'?state.tasks:state.tasks.filter(t=>t.team===state.taskFilter);
  shown.forEach(t=>{const tm=team(t.team);list.append(E('div',{class:'card',style:'margin-bottom:9px'},E('div',{class:'task'},E('div',{class:'cb'+(t.done?' on':''),onclick:()=>{t.done=!t.done;render();}},t.done?'✓':''),E('div',{style:'flex:1;'+(t.done?'text-decoration:line-through;color:var(--grey)':'')},t.title),E('span',{class:'pill',style:'background:'+tm.color+'22;color:'+tm.color},tm.name),E('span',{class:'mono',style:'font-size:11px;color:var(--grey)'},'◷ '+t.due))));});
  if(!shown.length)list.append(E('div',{class:'fr',style:'text-align:center;padding:50px;color:var(--grey)'},'No tasks for this team.'));
  const aside=E('div',{},seclbl('The team'));TEAMS.forEach(s=>{const load=state.tasks.filter(t=>t.team===s.id&&!t.done).length;aside.append(E('div',{class:'card',style:'display:flex;align-items:center;gap:12px;padding:13px 15px;margin-bottom:9px'},E('div',{style:'width:34px;height:34px;border-radius:50%;background:'+s.color+'22;color:'+s.color+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px'},s.who.split(' ').map(w=>w[0]).join('')),E('div',{style:'flex:1'},E('div',{style:'font-weight:600;font-size:13px'},s.who),E('div',{style:'font-size:11px;color:var(--grey)'},s.name)),E('span',{class:'mono',style:'font-size:11px;color:'+(load?'var(--orange)':'var(--green)')},load+' open')));});
  cols.append(list,aside);wrap.append(cols);return wrap;
}
function viewActivity(){
  const wrap=E('div',{});wrap.append(pageHead('Activity','Every decision, change and approval — the institutional memory, written down.'));
  const dot={confirm:'#3C8C5E',reserve:'#2F6FA8',conflict:'#BD3B2B',move:'#D9762A',intake:'#D6A82A'};const card=E('div',{class:'card',style:'padding:8px 4px'});
  state.activity.forEach((a,i)=>card.append(E('div',{style:'display:flex;align-items:center;gap:14px;padding:14px 18px;'+(i<state.activity.length-1?'border-bottom:1px solid rgba(33,29,23,.07)':'')},E('span',{class:'swatch',style:'width:9px;height:9px;border-radius:50%;background:'+(dot[a.kind]||'#6E665A')}),E('div',{style:'flex:1;font-size:13.5px',html:`<b>${a.actor}</b> ${a.action} <b>${a.target}</b>`}),E('span',{class:'mono',style:'font-size:11px;color:var(--grey);white-space:nowrap'},a.time))));
  wrap.append(card);return wrap;
}

/* ===================== TOUR ===================== */
const Tour=(function(){
  const FLOORS=[
    {id:"apex",level:"Apex",name:"The glass tip",ctx:"Lookout",desc:"The renovated peak — a glass crown over the city. Not an event space, but the first thing every guest looks up at.",meta:[["Open","To the public"],["View","360° of Tirana"]]},
    {id:"f2",level:"Floor +2",name:"Studios & offices",ctx:"Workspace",desc:"Tech tenants and creative studios — the working life of the Pyramid.",meta:[["Tenants","12 studios"],["Access","Pass holders"]]},
    {id:"f1",level:"Floor +1",name:"Mezzanine & café",ctx:"Social",desc:"The connective heart — café, seating, and balconies over the halls below.",meta:[["Seats","~80"],["Spillover","Yes"]]},
    {id:"f0",level:"Floor 0",name:"Entrance & atrium",ctx:"Arrival",desc:"Where everyone arrives — registration, coat check, and the stair down into the event level.",meta:[["Flow","Main entry"],["Reg desks","4"]]},
    {id:"dest",level:"Floor −1",name:"The event halls",ctx:"Destination",desc:"Below ground, four halls open off a shared concourse. This is where events happen — and the only level you'll book.",meta:[]},
  ];
  const HALLS=[
    {id:"blue",name:"Blue Hall",cap:220,rate:420,hex:"#2F6FA8",fit:"free",note:"The big one — keynotes & conferences"},
    {id:"orange",name:"Orange Hall",cap:160,rate:340,hex:"#D9762A",fit:"free",note:"Flexible — workshops & breakouts"},
    {id:"green",name:"Green Hall",cap:190,rate:380,hex:"#3C8C5E",fit:"tight",note:"Hackathon favourite — long tables"},
    {id:"yellow",name:"Yellow Hall",cap:90,rate:240,hex:"#D6A82A",fit:"free",note:"Intimate — exhibitions & dinners"},
  ];
  let sel=null,ys=[],obs=null,built=false;
  function buildPyramid(){const cx=180,top=40,slabH=44,gap=10;const rows=[{w:70},{w:130},{w:195},{w:260},{w:320}];let s="";let y=top;ys=[];rows.forEach(()=>{ys.push(y);y+=slabH+gap;});const groundY=ys[4]-gap/2-2;
    s+=`<rect x="0" y="${groundY}" width="360" height="${slabH+gap+40}" fill="#211D17" opacity="0.045"/>`;
    s+=`<line x1="0" y1="${groundY}" x2="360" y2="${groundY}" stroke="#211D17" stroke-opacity="0.2" stroke-dasharray="4 5"/>`;
    s+=`<text x="356" y="${groundY-6}" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="#6E665A" letter-spacing="1">GROUND</text>`;
    rows.forEach((r,i)=>{const x=cx-r.w/2,yy=ys[i];s+=`<g data-i="${i}"><rect class="slab" id="slab-${i}" x="${x}" y="${yy}" width="${r.w}" height="${slabH}" rx="6" fill="#ECE6D9" stroke="rgba(33,29,23,.14)"/>`;const ticks=Math.max(2,Math.round(r.w/40));for(let t=0;t<ticks;t++)s+=`<rect x="${x+10+t*((r.w-20)/ticks)}" y="${yy+slabH/2-6}" width="6" height="12" rx="1.5" fill="#211D17" opacity="0.12"/>`;s+=`<text class="slab-label" id="lab-${i}" x="${x-12}" y="${yy+slabH/2+4}" text-anchor="end" font-family="JetBrains Mono" font-size="10" fill="#6E665A">${FLOORS[i].level.replace('Floor ','')}</text></g>`;});
    s+=`<polygon points="${cx-26},${top} ${cx+26},${top} ${cx},${top-30}" fill="#DCEBF2" stroke="rgba(33,29,23,.16)"/>`;
    s+=`<g class="cam" id="cam" transform="translate(0,${ys[0]+slabH/2})"><polygon points="${cx+170},-7 ${cx+170},7 ${cx+180},0" fill="#C75B2A"/></g>`;
    document.getElementById('pyr').innerHTML=s;ys=ys.map(v=>v+slabH/2);}
  function buildFloors(){const host=document.getElementById('floors');host.innerHTML="";FLOORS.forEach((f,i)=>{const sec=document.createElement('section');sec.className='floor'+(f.id==='dest'?' dest':'');sec.id='tfloor-'+i;sec.dataset.i=i;
    if(f.id!=='dest')sec.innerHTML=`<span class="tag-ctx">${f.ctx}</span><div class="lvl"><span class="dot"></span>${f.level}</div><h2 class="fr">${f.name}</h2><p>${f.desc}</p><div class="meta">${f.meta.map(m=>`<div class="m"><b>${m[1]}</b>${m[0]}</div>`).join('')}</div>`;
    else sec.innerHTML=`<span class="focusbadge">★ Where you'll book</span><div class="lvl"><span class="dot"></span>${f.level}</div><h2 class="fr">${f.name}</h2><p>${f.desc}</p><div class="halls" id="thalls"></div><div class="selpanel" id="tselpanel"></div>`;
    host.appendChild(sec);});buildHalls();buildRail();}
  function buildHalls(){const host=document.getElementById('thalls');host.innerHTML="";HALLS.forEach(h=>{const el=document.createElement('div');el.className='hall'+(sel===h.id?' sel':'');el.onclick=()=>selectHall(h.id);const ft=h.fit==='free'?'Comfortable fit':'Tighter fit';const fc=h.fit==='free'?'#3C8C5E':'#C9A23A';el.innerHTML=`<div class="top" style="background:linear-gradient(135deg,${h.hex},${h.hex}cc)"><span class="cap">cap ${h.cap}</span><span class="check">✓</span></div><div class="body"><div class="nm">${h.name}</div><div class="sub">${h.note}</div><div class="av2"><span class="d" style="background:${fc}"></span>${ft} · €${h.rate}/day</div></div>`;host.appendChild(el);});}
  function selectHall(id){sel=id;buildHalls();const h=HALLS.find(x=>x.id===id);const p=document.getElementById('tselpanel');p.innerHTML=`<div class="row"><span class="k">Selected space</span><span class="v" style="color:${h.hex}">${h.name}</span></div><div class="row"><span class="k">Floor</span><span class="v">−1 · event level</span></div><div class="row"><span class="k">Capacity</span><span class="v">${h.cap} guests</span></div><div class="row"><span class="k">Day rate</span><span class="v">€${h.rate}</span></div><button class="btn btn-dark" style="margin-top:18px;width:100%;justify-content:center" id="tbook">Take ${h.name} to backstage →</button>`;p.classList.add('show');document.getElementById('tbook').onclick=()=>{const r={id:Date.now(),org:'Walk-in selection',type:'Conference',guests:Math.round(h.cap*0.7),date:'2026-07-20',space:null,status:'new'};state.requests.unshift(r);log('selected '+h.name+' via floor tour for','a new event','intake');goBackstage('requests');};setTimeout(()=>p.scrollIntoView({behavior:'smooth',block:'nearest'}),120);}
  function buildRail(){const rail=document.getElementById('rail');rail.innerHTML="";FLOORS.forEach((f,i)=>{const pip=document.createElement('div');pip.className='pip';pip.title=f.level;pip.onclick=()=>document.getElementById('tfloor-'+i).scrollIntoView({behavior:'smooth'});rail.appendChild(pip);});}
  function setActive(i){document.querySelectorAll('#floors .floor').forEach((el,idx)=>el.classList.toggle('active',idx===i));document.querySelectorAll('#rail .pip').forEach((el,idx)=>el.classList.toggle('on',idx===i));FLOORS.forEach((f,idx)=>{const slab=document.getElementById('slab-'+idx),lab=document.getElementById('lab-'+idx);if(!slab)return;if(idx===i){slab.setAttribute('fill',idx===4?'#C75B2A':'#211D17');slab.style.opacity='1';lab.style.opacity='1';lab.setAttribute('font-weight','700');lab.setAttribute('fill','#211D17');}else{slab.setAttribute('fill','#ECE6D9');slab.style.opacity=idx<i?'0.55':'0.9';lab.style.opacity='0.6';lab.setAttribute('font-weight','400');lab.setAttribute('fill','#6E665A');}});const cam=document.getElementById('cam');if(ys.length&&cam)cam.setAttribute('transform',`translate(0,${ys[i]})`);}
  function open(){show('tour');if(!built){buildPyramid();buildFloors();obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)setActive(+e.target.dataset.i);});},{rootMargin:"-45% 0px -45% 0px",threshold:0});document.querySelectorAll('#floors .floor').forEach(el=>obs.observe(el));built=true;}setActive(0);window.scrollTo(0,0);}
  return {open};
})();

/* ===================== BOOT ===================== */
iBoot();show('intake');
