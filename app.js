const DATA_FILES=['data/ancient.json','data/medieval.json','data/europe.json','data/contemporary.json'];
const EVENTS=[
  {year:-722,title:'Fall of the northern Kingdom of Israel',text:'Assyrian conquest destroys the northern kingdom and begins a major redistribution of its population. Judah remains a separate southern center.',major:true},
  {year:-586,title:'Jerusalem destroyed; Babylonian exile',text:'The Babylonian conquest sharply reduces the population of Judah and creates an enduring eastern center of Jewish life in Babylonia.',major:true},
  {year:70,title:'The Second Temple is destroyed',text:'The Roman destruction of Jerusalem is a major political and religious rupture. Jewish life continues in the Land of Israel while diaspora centers remain substantial.',major:true},
  {year:1170,title:'Benjamin of Tudela records a dispersed Jewish world',text:'His itinerary gives rare city-level observations from Iberia to Mesopotamia. Baghdad is one of the largest communities he reports.',major:false},
  {year:1492,title:'Expulsion from Spain',text:'The Alhambra Decree accelerates a major Sephardi redistribution toward Portugal, North Africa, Italy, the Ottoman world and later Western Europe.',major:true},
  {year:1648,title:'Wars in the Polish–Lithuanian Commonwealth',text:'The Khmelnytsky uprising and associated wars devastate many Jewish communities, even as Eastern Europe remains the demographic center of gravity.',major:false},
  {year:1881,title:'Mass migration out of Eastern Europe accelerates',text:'Pogroms, restrictions and economic pressures coincide with a huge migration wave, especially toward the United States and Western Europe.',major:true},
  {year:1939,title:'Prewar demographic peak',text:'Roughly 16.5 million Jews live worldwide on the eve of the Holocaust; Europe still contains the majority.',major:true},
  {year:1945,title:'The Holocaust destroys the historic European center',text:'Six million Jews are murdered. Hundreds of communities disappear and the demographic geography of Jewish life is permanently transformed.',major:true},
  {year:1948,title:'State of Israel established',text:'Postwar migration and the establishment of Israel rapidly create a new demographic pole in the Jewish world.',major:true},
  {year:1990,title:'Large-scale emigration from the former Soviet Union',text:'The opening of the Soviet Union drives another major redistribution, especially toward Israel, the United States and Germany.',major:false}
];

const $=s=>document.querySelector(s);
const stage=$('#stage'),worldSvg=d3.select('#world'),labelsSvg=d3.select('#labels'),canvas=$('#heat'),ctx=canvas.getContext('2d');
const slider=$('#slider'),playBtn=$('#play'),yearEl=$('#year'),totalEl=$('#total'),qualityEl=$('#quality'),story=$('#story'),storyKicker=$('#storyKicker'),storyTitle=$('#storyTitle'),storyText=$('#storyText'),sourceLink=$('#source'),topCenters=$('#topCenters'),legend=$('#legend'),anchorLabels=$('#anchorLabels'),eventDots=$('#eventDots'),counter=$('#counter'),interpEl=$('#interp');
let config,snapshots=[],worldFeature,projection,path,baseW=0,baseH=0,dpr=1,colorMode='tradition',autoFocus=true,hidden=new Set(),playing=false,raf=null,lastTs=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const formatYear=y=>y<0?`${Math.abs(Math.round(y))} BCE`:`${Math.max(1,Math.round(y))} CE`;
const hexToRgb=h=>{const x=parseInt(h.slice(1),16);return[(x>>16)&255,(x>>8)&255,x&255]};

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

function buildTimeline(){
  anchorLabels.innerHTML=snapshots.map((s,i)=>`<span style="left:${i/(snapshots.length-1)*100}%">${s.label.replace('c. ','')}</span>`).join('');
  eventDots.innerHTML=EVENTS.map(e=>`<i class="${e.major?'major':''}" style="left:${positionForYear(e.year)/slider.max*100}%" title="${e.title}"></i>`).join('');
}

function positionForYear(y){
  if(y<=snapshots[0].year)return 0;
  if(y>=snapshots.at(-1).year)return (snapshots.length-1)*1000;
  for(let i=0;i<snapshots.length-1;i++){
    const a=snapshots[i].year,b=snapshots[i+1].year;
    if(y>=a&&y<=b)return i*1000+(y-a)/(b-a)*1000;
  }
  return 0;
}

function segment(pos){
  const raw=clamp(pos/1000,0,snapshots.length-1),i=Math.min(Math.floor(raw),snapshots.length-2),t=raw-i;
  return {i,t,a:snapshots[i],b:snapshots[i+1]};
}
function yearAt(pos){
  if(+pos>=+slider.max)return snapshots.at(-1).year;
  const {a,b,t}=segment(+pos);return mix(a.year,b.year,t);
}

function resize(){
  const r=stage.getBoundingClientRect();baseW=r.width;baseH=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(baseW*dpr);canvas.height=Math.round(baseH*dpr);canvas.style.width=baseW+'px';canvas.style.height=baseH+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  worldSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);labelsSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);
  projection=d3.geoNaturalEarth1().fitExtent([[16,14],[baseW-16,baseH-14]],worldFeature);path=d3.geoPath(projection);
  drawWorld();render(+slider.value);
}

function drawWorld(){
  worldSvg.selectAll('*').remove();
  const g=worldSvg.append('g').attr('id','mapLayer');
  g.append('path').datum({type:'Sphere'}).attr('d',path).attr('class','ocean');
  g.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('class','graticule');
  g.append('path').datum(worldFeature).attr('d',path).attr('class','land');
}

function snapshotCamera(s){
  if(!autoFocus)return {k:1,tx:0,ty:0};
  const max=Math.max(...s.points.map(p=>+p.weight||0),1);
  const pts=s.points.filter(p=>(+p.weight||0)>=max*.025).map(p=>projection([p.lon,p.lat])).filter(Boolean);
  if(pts.length<1)return {k:1,tx:0,ty:0};
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const spanX=Math.max(80,maxX-minX),spanY=Math.max(55,maxY-minY);
  const k=clamp(Math.min((baseW*.70)/spanX,(baseH*.64)/spanY),1,3.4);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  return {k,tx:baseW/2-k*cx,ty:baseH/2-k*cy};
}

function cameraAt(a,b,t){
  const ca=snapshotCamera(a),cb=snapshotCamera(b);
  const q=t*t*(3-2*t);
  return {k:mix(ca.k,cb.k,q),tx:mix(ca.tx,cb.tx,q),ty:mix(ca.ty,cb.ty,q)};
}
function screenPoint(p,c){const xy=projection([p.lon,p.lat]);return xy?[xy[0]*c.k+c.tx,xy[1]*c.k+c.ty]:null}

function radiusFor(p,c){
  const pr=p.precision||'';
  let r=pr.includes('city')?30:pr.includes('site')?24:pr.includes('country')?72:pr.includes('region')||pr.includes('reconstruction')?86:58;
  return clamp(r*Math.sqrt(c.k),22,155);
}

function drawHeat(points,alpha,c,maxWeight){
  if(alpha<=.001)return;
  ctx.save();ctx.globalCompositeOperation='source-over';
  for(const p of points){
    if(hidden.has(p[colorMode]))continue;
    const xy=screenPoint(p,c);if(!xy)continue;
    const def=(colorMode==='tradition'?config.traditions:config.languages)[p[colorMode]]||{color:'#777'};
    const [r,g,b]=hexToRgb(def.color);
    const strength=Math.pow((+p.weight||0)/maxWeight,.52);
    const opacity=clamp(.12+.55*strength,0,.68)*alpha*(p.confidence==='low'?.72:1);
    const rad=radiusFor(p,c)*(0.78+0.38*strength);
    const gr=ctx.createRadialGradient(xy[0],xy[1],0,xy[0],xy[1],rad);
    gr.addColorStop(0,`rgba(${r},${g},${b},${opacity})`);
    gr.addColorStop(.28,`rgba(${r},${g},${b},${opacity*.72})`);
    gr.addColorStop(.62,`rgba(${r},${g},${b},${opacity*.28})`);
    gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.fillStyle=gr;ctx.fillRect(xy[0]-rad,xy[1]-rad,rad*2,rad*2);
  }
  ctx.restore();
}

function drawLabels(s,c){
  labelsSvg.selectAll('*').remove();
  const candidates=[...s.points].sort((a,b)=>b.weight-a.weight);
  const chosen=[];
  for(const p of candidates){
    if(hidden.has(p[colorMode]))continue;
    const xy=screenPoint(p,c);if(!xy||xy[0]<25||xy[0]>baseW-25||xy[1]<25||xy[1]>baseH-25)continue;
    const tooClose=chosen.some(q=>Math.hypot(q.xy[0]-xy[0],q.xy[1]-xy[1])<66);
    if(!tooClose){chosen.push({p,xy});if(chosen.length>=9)break}
  }
  const g=labelsSvg.append('g').attr('class','labels-layer');
  for(const {p,xy} of chosen){
    const def=(colorMode==='tradition'?config.traditions:config.languages)[p[colorMode]]||{color:'#777'};
    const item=g.append('g').attr('class','place-label').attr('transform',`translate(${xy[0]},${xy[1]})`);
    item.append('circle').attr('r',3.2).attr('fill',def.color).attr('stroke','#fff').attr('stroke-width',1.3);
    item.append('text').attr('x',7).attr('y',3).text(p.name);
    item.append('title').text(`${p.name}${p.population?` — ${fmt(p.population)}`:''}`);
  }
}

function currentCategories(a,b){
  const defs=colorMode==='tradition'?config.traditions:config.languages,ids=new Set([...a.points,...b.points].map(p=>p[colorMode]));
  legend.innerHTML=[...ids].filter(id=>defs[id]).map(id=>`<button data-id="${id}" class="${hidden.has(id)?'off':''}"><i style="background:${defs[id].color}"></i>${defs[id].label}</button>`).join('');
  legend.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;hidden.has(id)?hidden.delete(id):hidden.add(id);render(+slider.value)});
}

function nearestEvent(pos){
  const arr=EVENTS.map(e=>({...e,pos:positionForYear(e.year)})).sort((x,y)=>Math.abs(x.pos-pos)-Math.abs(y.pos-pos));
  const e=arr[0];return Math.abs(e.pos-pos)<145?e:null;
}

function render(pos){
  if(!snapshots.length||!projection)return;
  const {a,b,t}=segment(pos),q=t*t*(3-2*t),y=yearAt(pos),c=cameraAt(a,b,q);
  const mapLayer=worldSvg.select('#mapLayer');mapLayer.attr('transform',`translate(${c.tx},${c.ty}) scale(${c.k})`);
  ctx.clearRect(0,0,baseW,baseH);
  const maxA=Math.max(...a.points.map(p=>+p.weight||0),1),maxB=Math.max(...b.points.map(p=>+p.weight||0),1);
  drawHeat(a.points,1-q,c,maxA);drawHeat(b.points,q,c,maxB);
  const dominant=q<.5?a:b;
  drawLabels(dominant,c);
  yearEl.textContent=formatYear(y);counter.textContent=formatYear(y);
  totalEl.textContent=dominant.total_label;
  qualityEl.textContent=dominant.quality;
  interpEl.textContent=(q<.04||q>.96)?'source snapshot':`visual interpolation · ${a.label} → ${b.label}`;
  const ev=nearestEvent(pos);
  story.classList.toggle('event',!!ev);
  storyKicker.textContent=ev?'Historical event':dominant.label;
  storyTitle.textContent=ev?ev.title:dominant.headline;
  storyText.textContent=ev?ev.text:dominant.caveat;
  const src=config.sources[dominant.source_key];sourceLink.href=src?.url||'#';sourceLink.textContent=src?`${src.author} ↗`:'Source ↗';
  updateTopCenters(dominant);
  currentCategories(a,b);
}

function updateTopCenters(s){
  const top=[...s.points].filter(p=>!hidden.has(p[colorMode])).sort((a,b)=>b.weight-a.weight).slice(0,5);
  topCenters.innerHTML=top.map(p=>{
    const def=(colorMode==='tradition'?config.traditions:config.languages)[p[colorMode]]||{color:'#777'};
    const value=p.population?fmt(p.population):p.precision?.includes('regional')?'regional reconstruction':'relative weight';
    return `<div><i style="background:${def.color}"></i><span>${p.name}</span><b>${value}</b></div>`;
  }).join('');
}

function setColorMode(m){colorMode=m;hidden.clear();$('#traditionBtn').classList.toggle('active',m==='tradition');$('#languageBtn').classList.toggle('active',m==='language');render(+slider.value)}
$('#traditionBtn').onclick=()=>setColorMode('tradition');$('#languageBtn').onclick=()=>setColorMode('language');
$('#focusBtn').onclick=()=>{autoFocus=!autoFocus;$('#focusBtn').classList.toggle('active',autoFocus);render(+slider.value)};
slider.addEventListener('input',()=>render(+slider.value));
window.addEventListener('resize',()=>{clearTimeout(window.__rt);window.__rt=setTimeout(resize,100)});

function playLoop(ts){
  if(!playing)return;
  if(!lastTs)lastTs=ts;const dt=ts-lastTs;lastTs=ts;
  let v=+slider.value+dt*.18;if(v>+slider.max)v=0;slider.value=v;render(v);raf=requestAnimationFrame(playLoop);
}
playBtn.onclick=()=>{playing=!playing;playBtn.textContent=playing?'❚❚':'▶';lastTs=0;if(playing)raf=requestAnimationFrame(playLoop);else cancelAnimationFrame(raf)};

load().catch(err=>{console.error(err);$('#loading').innerHTML=`<div>Could not load atlas data.<small>${err.message}</small></div>`});
