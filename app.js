const DATA_FILES=['data/ancient.json','data/medieval.json','data/europe_v4.json','data/modern_v4.json'];
const EVENTS=[
  {year:-722,title:'Fall of the northern Kingdom of Israel',text:'Assyrian conquest destroys the northern kingdom. Judah remains a southern center while deportation and resettlement alter the population map.',major:true,source_key:'broshi_finkelstein_1992'},
  {year:-586,title:'Jerusalem destroyed; Babylonian exile',text:'The Babylonian conquest sharply reduces Judah and creates an enduring eastern center of Jewish life in Babylonia.',major:true,source_key:'persian_judah'},
  {year:70,title:'The Second Temple is destroyed',text:'Rome destroys Jerusalem and the Second Temple. Jewish life continues in the Land of Israel, while major diaspora centers remain active.',major:true,source_key:'cambridge_palestine'},
  {year:1170,title:'Benjamin of Tudela records a dispersed Jewish world',text:'His itinerary offers rare city-level observations from Iberia to Mesopotamia. Baghdad is one of the largest communities he reports.',major:false,source_key:'benjamin_tudela'},
  {year:1492,title:'Expulsion from Spain',text:'The Alhambra Decree accelerates a major Sephardi redistribution toward North Africa, Italy, the Ottoman world and later Western Europe.',major:true,source_key:'dellapergola_2001'},
  {year:1648,title:'War devastates communities in the Polish–Lithuanian Commonwealth',text:'The Khmelnytsky uprising and associated wars destroy many communities, although Eastern Europe remains the demographic center of gravity.',major:false,source_key:'iijg_europe'},
  {year:1772,title:'First Partition of Poland',text:'Russia, Prussia and Austria divide Polish–Lithuanian territory. Russia now acquires a much larger Jewish population in its western provinces.',major:true,source_key:'pale_1897'},
  {year:1791,title:'The future Pale of Settlement begins to take shape',text:'A decree under Catherine II specifically permits Jewish residence in designated western provinces while restricting residence elsewhere in the empire.',major:true,source_key:'pale_1897'},
  {year:1793,title:'Second Partition of Poland',text:'Another large transfer of Polish–Lithuanian territory brings still more Jewish communities under Russian imperial rule.',major:false,source_key:'pale_1897'},
  {year:1795,title:'Third Partition ends the Polish–Lithuanian Commonwealth',text:'The final partition places most of the former Commonwealth’s Jewish population under Russia, Austria and Prussia.',major:true,source_key:'pale_1897'},
  {year:1881,title:'Mass emigration from the Russian Empire accelerates',text:'Pogroms, restrictions and economic pressure help trigger a migration wave that will send roughly two million Jews out of the Russian Empire before World War I.',major:true,source_key:'pale_1897'},
  {year:1882,title:'The May Laws deepen restrictions',text:'Temporary regulations restrict Jewish settlement and economic activity, reinforcing the geography and pressures of the Pale of Settlement.',major:false,source_key:'pale_1897'},
  {year:1897,title:'4.48 million Jews counted inside the Pale',text:'The Russian Empire census records 4,483,300 Jews across the Pale of Settlement and Congress Poland — an extraordinary concentration across today’s Poland, Lithuania, Belarus, Ukraine and Moldova.',major:true,source_key:'pale_1897'},
  {year:1903,title:'Kishinev pogrom',text:'The violence in Kishinev becomes an international symbol of the insecurity facing Jews in the late imperial Russian world and strengthens emigration and political mobilization.',major:false,source_key:'pale_1897'},
  {year:1917,title:'The Pale of Settlement is abolished',text:'After the February Revolution, legal restrictions on Jewish residence are removed. The old Pale disappears as a legal institution, though its demographic geography persists.',major:true,source_key:'pale_1897'},
  {year:1939,title:'Prewar demographic peak: 16.5 million',text:'World Jewry reaches about 16.5 million. Europe still contains the majority on the eve of the Holocaust and the German-Soviet invasion of Poland.',major:true,source_key:'dellapergola_2001'},
  {year:1941,title:'The Holocaust expands eastward',text:'After Germany invades the Soviet Union, mass shootings and extermination policies destroy Jewish communities across Poland, the Baltics, Belarus, Ukraine and beyond.',major:true,source_key:'world_totals_1945_2014'},
  {year:1945,title:'The world Jewish population has fallen to about 11 million',text:'Six million Jews have been murdered. Compared with 1939, the global Jewish population is roughly one-third smaller and the old European demographic center is shattered.',major:true,source_key:'world_totals_1945_2014'},
  {year:1948,title:'State of Israel established',text:'Israel’s establishment and postwar migrations create a rapidly growing new demographic pole, alongside the United States.',major:true,source_key:'dellapergola_2001'},
  {year:1970,title:'Soviet Jewish emigration and the refusenik era',text:'Pressure to emigrate grows. In the 1970s significant numbers leave the USSR, while many applicants are refused exit visas and become known as refuseniks.',major:false,source_key:'fsu_emigration'},
  {year:1989,title:'The Soviet exit gates open',text:'Liberalization produces a sudden surge in emigration. In 1989 about 56,000 Soviet Jewish emigrants went to the United States and about 12,900 to Israel.',major:true,source_key:'fsu_emigration'},
  {year:1990,title:'Mass aliyah from the Soviet Union',text:'About 185,200 Soviet Jewish emigrants arrive in Israel in 1990 alone, rapidly changing Israel’s population and the geography of the former Soviet Jewish world.',major:true,source_key:'fsu_emigration'},
  {year:1991,title:'The USSR collapses amid continuing mass migration',text:'Israel receives about 147,800 more emigrants from the former Soviet Union in 1991; the United States and Germany also receive substantial flows.',major:true,source_key:'fsu_emigration'}
];

const $=s=>document.querySelector(s);
const stage=$('#stage'),worldSvg=d3.select('#world'),labelsSvg=d3.select('#labels'),canvas=$('#dots'),ctx=canvas.getContext('2d');
const slider=$('#slider'),playBtn=$('#play'),yearEl=$('#year'),totalTitle=$('#totalTitle'),totalNumber=$('#totalNumber'),totalBar=$('#totalBar'),totalMeta=$('#totalMeta'),qualityEl=$('#quality');
const story=$('#story'),storyKicker=$('#storyKicker'),storyTitle=$('#storyTitle'),storyText=$('#storyText'),sourceLink=$('#source'),topCenters=$('#topCenters'),coverageEl=$('#coverage');
const legend=$('#legend'),anchorLabels=$('#anchorLabels'),eventDots=$('#eventDots'),counter=$('#counter'),interpEl=$('#interp'),popSpark=d3.select('#popSpark');
let config,snapshots=[],worldFeature,projection,path,baseW=0,baseH=0,dpr=1,autoFocus=true,hidden=new Set(),playing=false,raf=null,lastTs=0,holdUntil=0,heldEvents=new Set();
let clusterCache=new Map();
const PEAK=16500000;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const formatYear=y=>y<0?`${Math.abs(Math.round(y))} BCE`:`${Math.max(1,Math.round(y))} CE`;

async function load(){
  const [cfg,...parts]=await Promise.all([
    fetch('data/config.json').then(r=>r.json()),
    ...DATA_FILES.map(f=>fetch(f).then(r=>r.json())),
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json())
  ]);
  config=cfg;
  const atlas=parts.pop();
  snapshots=parts.flat().sort((a,b)=>a.year-b.year);
  worldFeature=topojson.feature(atlas,atlas.objects.countries);
  slider.max=(snapshots.length-1)*1000;
  buildTimeline();
  resize();
  render(0);
  $('#loading').classList.add('done');
}

function parseWorldTotal(s){
  if(Number.isFinite(+s.world_total)&&+s.world_total>0)return +s.world_total;
  const text=s.total_label||'';
  if(!/world/i.test(text))return null;
  let m=text.match(/(?:~|about\s*)?([\d.]+)\s*m/i);if(m)return +m[1]*1e6;
  m=text.match(/([\d,.]+)\s*(?:million)/i);if(m)return +m[1].replace(/,/g,'')*1e6;
  return null;
}
function mappedTotal(s){return s.points.reduce((sum,p)=>sum+(Number.isFinite(+p.population)?+p.population:0),0)}
function formatMillions(v){if(!Number.isFinite(v))return '—';return `${(v/1e6).toFixed(v>=1e7?2:2)}m`}

function buildTimeline(){
  anchorLabels.innerHTML=snapshots.map((s,i)=>`<span style="left:${i/(snapshots.length-1)*100}%">${s.label.replace('c. ','')}</span>`).join('');
  eventDots.innerHTML=EVENTS.map(e=>`<i class="${e.major?'major':''}" style="left:${positionForYear(e.year)/slider.max*100}%" title="${e.year<0?Math.abs(e.year)+' BCE':e.year}: ${e.title}"></i>`).join('');
  buildPopulationSpark();
}
function buildPopulationSpark(){
  const pts=snapshots.map((s,i)=>({x:i/(snapshots.length-1)*1000,t:parseWorldTotal(s)}));
  const y=v=>45-clamp(v/PEAK,0,1)*38;
  const line=d3.line().defined(d=>d.t!=null).x(d=>d.x).y(d=>y(d.t)).curve(d3.curveMonotoneX);
  popSpark.selectAll('*').remove();
  popSpark.append('path').datum(pts).attr('class','line').attr('d',line);
  const peak=pts.reduce((best,p)=>p.t>(best?.t||0)?p:best,null);
  if(peak)popSpark.append('circle').attr('class','peak').attr('cx',peak.x).attr('cy',y(peak.t)).attr('r',2.8).append('title').text(`Peak ${formatMillions(peak.t)}`);
}
function positionForYear(y){
  if(y<=snapshots[0].year)return 0;if(y>=snapshots.at(-1).year)return (snapshots.length-1)*1000;
  for(let i=0;i<snapshots.length-1;i++){const a=snapshots[i].year,b=snapshots[i+1].year;if(y>=a&&y<=b)return i*1000+(y-a)/(b-a)*1000}return 0;
}
function segment(pos){const raw=clamp(pos/1000,0,snapshots.length-1),i=Math.min(Math.floor(raw),snapshots.length-2),t=raw-i;return{i,t,a:snapshots[i],b:snapshots[i+1]}}
function yearAt(pos){if(+pos>=+slider.max)return snapshots.at(-1).year;const {a,b,t}=segment(+pos);return mix(a.year,b.year,t)}

function resize(){
  const r=stage.getBoundingClientRect();baseW=r.width;baseH=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(baseW*dpr);canvas.height=Math.round(baseH*dpr);canvas.style.width=baseW+'px';canvas.style.height=baseH+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  worldSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);labelsSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);
  projection=d3.geoNaturalEarth1().fitExtent([[16,14],[baseW-16,baseH-14]],worldFeature);path=d3.geoPath(projection);clusterCache.clear();drawWorld();render(+slider.value);
}
function drawWorld(){
  worldSvg.selectAll('*').remove();const g=worldSvg.append('g').attr('id','mapLayer');
  g.append('path').datum({type:'Sphere'}).attr('d',path).attr('class','ocean');g.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('class','graticule');g.append('path').datum(worldFeature).attr('d',path).attr('class','land');
}
function metric(p){return Number.isFinite(+p.population)&&+p.population>0?+p.population:(+p.weight||0)*1000}
function snapshotCamera(s){
  if(!autoFocus)return{k:1,tx:0,ty:0};const max=Math.max(...s.points.map(metric),1);
  const pts=s.points.filter(p=>metric(p)>=max*.018).map(p=>projection([p.lon,p.lat])).filter(Boolean);if(!pts.length)return{k:1,tx:0,ty:0};
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const spanX=Math.max(76,maxX-minX),spanY=Math.max(52,maxY-minY);const k=clamp(Math.min((baseW*.72)/spanX,(baseH*.65)/spanY),1,3.5);const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  return{k,tx:baseW/2-k*cx,ty:baseH/2-k*cy};
}
function cameraAt(a,b,t){const ca=snapshotCamera(a),cb=snapshotCamera(b),q=t*t*(3-2*t);return{k:mix(ca.k,cb.k,q),tx:mix(ca.tx,cb.tx,q),ty:mix(ca.ty,cb.ty,q)}}
function screenPoint(p,c){const xy=projection([p.lon,p.lat]);return xy?[xy[0]*c.k+c.tx,xy[1]*c.k+c.ty]:null}

function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng32(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function spreadPixels(p,count){
  const center=projection([p.lon,p.lat]);if(!center)return[5,4];const pr=String(p.precision||'');
  if(pr.includes('city')||pr.includes('site')){const r=clamp(3.5+Math.sqrt(Math.max(1,count))*.58,4,27);return[r,r*.72]}
  let slon=+p.spread_lon||0,slat=+p.spread_lat||0,f=1;
  if(pr.includes('governorate')){slon=slon||1.4;slat=slat||1;f=1}
  else if(pr.includes('republic')){slon=slon||2.7;slat=slat||1.8;f=1.7}
  else if(pr.includes('country')){slon=slon||3.2;slat=slat||2.1;f=1.65}
  else if(pr.includes('region')||pr.includes('reconstruction')){slon=slon||5;slat=slat||3.3;f=3.2}
  else{slon=1;slat=.7}
  const ex=projection([+p.lon+slon*f,+p.lat]),ey=projection([+p.lon,+p.lat+slat*f]);
  return[clamp(Math.abs((ex?.[0]??center[0]+8)-center[0]),5,95),clamp(Math.abs((ey?.[1]??center[1]+6)-center[1]),4,70)];
}
function clusterFor(p){
  const quantum=+config.dot_quantum||1000,pop=+p.population;if(!(pop>0))return null;
  const key=`${p.id}|${pop}|${baseW}|${baseH}`;if(clusterCache.has(key))return clusterCache.get(key);
  const center=projection([p.lon,p.lat]);if(!center)return null;const full=Math.floor(pop/quantum),frac=(pop%quantum)/quantum,count=full+(frac>.08?1:0);const [rx,ry]=spreadPixels(p,count);const rnd=rng32(hashString(key)),dots=[];
  for(let i=0;i<count;i++){
    const a=Math.PI*2*rnd(),rad=Math.sqrt(rnd()),jitter=.86+.28*rnd();dots.push({x:center[0]+Math.cos(a)*rx*rad*jitter,y:center[1]+Math.sin(a)*ry*rad*jitter,f:i===count-1&&frac>.08&&i>=full?frac:1});
  }
  clusterCache.set(key,dots);return dots;
}
function drawSnapshot(s,alpha,c){
  if(alpha<.005)return;ctx.save();
  for(const p of s.points){
    if(hidden.has(p.tradition))continue;const def=config.traditions[p.tradition]||{color:'#777'};const dots=clusterFor(p);
    if(dots){ctx.fillStyle=def.color;ctx.globalAlpha=alpha*(p.confidence==='low'?.52:p.confidence==='medium'?.72:.88);ctx.beginPath();
      for(const d of dots){const x=d.x*c.k+c.tx,y=d.y*c.k+c.ty,r=clamp(1.2*Math.sqrt(d.f)*Math.sqrt(c.k),.55,2.15);if(x<-4||x>baseW+4||y<-4||y>baseH+4)continue;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2)}ctx.fill();
    }else{
      const xy=screenPoint(p,c);if(!xy)continue;const r=clamp(5+Math.sqrt(+p.weight||4)*.7,6,17)*Math.sqrt(c.k);ctx.globalAlpha=alpha*(p.confidence==='low'?.45:.65);ctx.strokeStyle=def.color;ctx.lineWidth=1.2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(xy[0],xy[1],r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }
  }ctx.restore();
}

function drawLabels(s,c){
  labelsSvg.selectAll('*').remove();const candidates=[...s.points].sort((a,b)=>metric(b)-metric(a)),chosen=[];
  for(const p of candidates){if(hidden.has(p.tradition))continue;const xy=screenPoint(p,c);if(!xy||xy[0]<22||xy[0]>baseW-22||xy[1]<20||xy[1]>baseH-20)continue;const tooClose=chosen.some(q=>Math.hypot(q.xy[0]-xy[0],q.xy[1]-xy[1])<64);if(!tooClose){chosen.push({p,xy});if(chosen.length>=10)break}}
  const g=labelsSvg.append('g').attr('class','labels-layer');for(const {p,xy} of chosen){const def=config.traditions[p.tradition]||{color:'#777'};const item=g.append('g').attr('class','place-label').attr('transform',`translate(${xy[0]},${xy[1]})`);item.append('circle').attr('r',3).attr('fill',p.population?def.color:'#fff').attr('stroke',def.color).attr('stroke-width',1.4);item.append('text').attr('x',7).attr('y',3).text(p.name);item.append('title').text(`${p.name}${p.population?` — ${fmt(p.population)}`:' — presence/reconstruction'}`)}
}
function currentCategories(a,b){
  const ids=new Set([...a.points,...b.points].map(p=>p.tradition));legend.innerHTML=[...ids].filter(id=>config.traditions[id]).map(id=>`<button data-id="${id}" class="${hidden.has(id)?'off':''}"><i style="background:${config.traditions[id].color}"></i>${config.traditions[id].label}</button>`).join('')+`<button disabled><span class="ring-key"></span>uncounted presence</button>`;
  legend.querySelectorAll('button[data-id]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;hidden.has(id)?hidden.delete(id):hidden.add(id);render(+slider.value)});
}
function nearestEvent(pos){const arr=EVENTS.map(e=>({...e,pos:positionForYear(e.year)})).sort((x,y)=>Math.abs(x.pos-pos)-Math.abs(y.pos-pos));const e=arr[0];return e&&Math.abs(e.pos-pos)<58?e:null}

function totalState(a,b,q){
  const ta=parseWorldTotal(a),tb=parseWorldTotal(b);if(ta!=null&&tb!=null)return{value:mix(ta,tb,q),world:true,interpolated:q>.02&&q<.98};
  const s=q<.5?a:b,t=parseWorldTotal(s);if(t!=null)return{value:t,world:true,interpolated:false};
  if(s.year===-800)return{value:mappedTotal(s),world:false,interpolated:false,title:'Estimated Israelite/Judahite population'};
  return{value:null,world:false,interpolated:false,title:'World total not defensibly known'};
}
function updatePopulation(a,b,q,dominant){
  const state=totalState(a,b,q);totalTitle.textContent=state.title||(state.world?'World Jewish population':'Population represented by source');
  if(state.value==null){totalNumber.textContent='—';totalBar.style.width='0%';totalMeta.textContent='The source supports locations, but not a defensible global headcount.';return}
  totalNumber.textContent=`${state.interpolated?'≈ ':dominant.world_total_approx?'≈ ':''}${formatMillions(state.value)}`;totalBar.style.width=`${clamp(state.value/PEAK*100,0,100)}%`;
  const mt=mappedTotal(dominant),wt=parseWorldTotal(dominant);let meta=state.interpolated?'Visual interpolation between source totals. ':'';
  if(wt){const pct=clamp(mt/wt*100,0,100);meta+=`Numeric dots localize ${formatMillions(mt)} (${pct.toFixed(0)}%) of this source total.`}
  else meta+=dominant.total_label||'';
  const idx=snapshots.indexOf(dominant);if(wt&&idx>0){let prev=null;for(let i=idx-1;i>=0;i--){const t=parseWorldTotal(snapshots[i]);if(t!=null){prev={s:snapshots[i],t};break}}if(prev){const d=(wt-prev.t)/prev.t*100;if(Math.abs(d)>4)meta+=` ${d<0?'▼':'▲'} ${Math.abs(d).toFixed(1)}% vs ${prev.s.label}.`}}
  totalMeta.textContent=meta;
}

function render(pos){
  if(!snapshots.length||!projection)return;const {a,b,t}=segment(pos),q=t*t*(3-2*t),y=yearAt(pos),c=cameraAt(a,b,q),dominant=q<.5?a:b;
  worldSvg.select('#mapLayer').attr('transform',`translate(${c.tx},${c.ty}) scale(${c.k})`);ctx.clearRect(0,0,baseW,baseH);drawSnapshot(a,1-q,c);drawSnapshot(b,q,c);drawLabels(dominant,c);
  yearEl.textContent=formatYear(y);counter.textContent=formatYear(y);qualityEl.textContent=dominant.quality;interpEl.textContent=(q<.035||q>.965)?'source snapshot':`visual interpolation · ${a.label} → ${b.label}`;updatePopulation(a,b,q,dominant);
  const ev=nearestEvent(pos);story.classList.toggle('event',!!ev);storyKicker.textContent=ev?'Historical event':dominant.label;storyTitle.textContent=ev?ev.title:dominant.headline;storyText.textContent=ev?ev.text:dominant.caveat;
  const sourceKey=ev?.source_key||dominant.source_key,src=config.sources[sourceKey];sourceLink.href=src?.url||'#';sourceLink.textContent=src?`${src.author} ↗`:'Source ↗';
  const wt=parseWorldTotal(dominant),mt=mappedTotal(dominant);coverageEl.textContent=wt?`${clamp(mt/wt*100,0,100).toFixed(0)}% numerically localized`:dominant.quality;updateTopCenters(dominant);currentCategories(a,b);
}
function updateTopCenters(s){
  const top=[...s.points].filter(p=>!hidden.has(p.tradition)).sort((a,b)=>metric(b)-metric(a)).slice(0,5);topCenters.innerHTML=top.map(p=>{const def=config.traditions[p.tradition]||{color:'#777'},value=p.population?fmt(p.population):'uncounted';return `<div><i style="background:${def.color}"></i><span>${p.name}</span><b>${value}</b></div>`}).join('');
}

$('#focusBtn').onclick=()=>{autoFocus=!autoFocus;$('#focusBtn').classList.toggle('active',autoFocus);render(+slider.value)};
slider.addEventListener('input',()=>render(+slider.value));window.addEventListener('resize',()=>{clearTimeout(window.__rt);window.__rt=setTimeout(resize,100)});
function playLoop(ts){
  if(!playing)return;if(holdUntil&&ts<holdUntil){lastTs=ts;raf=requestAnimationFrame(playLoop);return}if(!lastTs)lastTs=ts;const dt=Math.min(80,ts-lastTs);lastTs=ts;const old=+slider.value;let next=old+dt*.09;
  const crossed=EVENTS.map(e=>({...e,pos:positionForYear(e.year)})).filter(e=>e.pos>old&&e.pos<=next&&!heldEvents.has(e.year)).sort((a,b)=>a.pos-b.pos)[0];
  if(crossed){slider.value=crossed.pos;render(crossed.pos);heldEvents.add(crossed.year);holdUntil=ts+(crossed.major?2600:1700);raf=requestAnimationFrame(playLoop);return}
  if(next>+slider.max){next=0;heldEvents.clear()}slider.value=next;render(next);raf=requestAnimationFrame(playLoop);
}
playBtn.onclick=()=>{playing=!playing;playBtn.textContent=playing?'❚❚':'▶';lastTs=0;holdUntil=0;if(playing)raf=requestAnimationFrame(playLoop);else cancelAnimationFrame(raf)};
load().catch(err=>{console.error(err);$('#loading').innerHTML=`<div>Could not load atlas data.<small>${err.message}</small></div>`});
