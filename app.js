const LINEAGE_FILES=[
  'data/lineages/judean.json','data/lineages/babylonian_iraqi.json','data/lineages/romaniote_hellenistic.json',
  'data/lineages/ashkenazi.json','data/lineages/sephardi.json','data/lineages/maghrebi_mizrahi.json',
  'data/lineages/persian_central_asian.json','data/lineages/yemenite.json','data/lineages/beta_israel.json'
];
const DOT_VALUE=1000;
const TIMELINE_YEARS=[-800,-722,-586,-450,-300,50,70,500,900,1170,1490,1492,1500,1600,1648,1750,1772,1791,1795,1850,1881,1897,1903,1914,1917,1930,1939,1942,1945,1948,1951,1960,1970,1984,1989,1991,2000,2024];

const $=s=>document.querySelector(s);
const stage=$('#stage'),worldSvg=d3.select('#world'),labelsSvg=d3.select('#labels'),canvas=$('#dots'),ctx=canvas.getContext('2d');
const slider=$('#slider'),playBtn=$('#play'),yearEl=$('#year'),totalNumber=$('#totalNumber'),totalBar=$('#totalBar'),totalMeta=$('#totalMeta'),qualityEl=$('#quality'),story=$('#story'),storyKicker=$('#storyKicker'),storyTitle=$('#storyTitle'),storyText=$('#storyText'),topCenters=$('#topCenters'),coverageEl=$('#coverage'),sourceLink=$('#source'),legend=$('#legend'),counter=$('#counter'),eventDots=$('#eventDots'),anchorLabels=$('#anchorLabels'),interpEl=$('#interp'),spark=$('#popSpark');
let meta,lineages=[],worldFeature,projection,path,baseW=0,baseH=0,dpr=1,autoFocus=true,playing=false,raf=null,lastTs=0,pauseUntil=0,lastEventKey='',hidden=new Set(),positionCache=new Map();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Math.round(n));
const formatYear=y=>y<0?`${Math.abs(Math.round(y))} BCE`:`${Math.round(y)} CE`;

function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rnd(seed){let x=seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}
function chooseCenter(centers,u){let acc=0;for(let i=0;i<centers.length;i++){acc+=centers[i].share||0;if(u<=acc||i===centers.length-1)return {center:centers[i],index:i}}return {center:centers[0],index:0}}

async function load(){
  const [metaData,...rest]=await Promise.all([
    fetch('data/lineages/meta.json').then(r=>r.json()),
    ...LINEAGE_FILES.map(f=>fetch(f).then(r=>r.json())),
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json())
  ]);
  const atlas=rest.pop();meta=metaData;lineages=rest;worldFeature=topojson.feature(atlas,atlas.objects.countries);
  for(const l of lineages)l.maxDots=Math.ceil(Math.max(...l.keyframes.map(k=>k.population||0))/DOT_VALUE);
  slider.min=0;slider.max=(TIMELINE_YEARS.length-1)*1000;slider.value=0;
  buildTimeline();buildLegend();drawSpark();resize();render(0);$('#loading').classList.add('done');
}

function yearForPos(pos){const raw=clamp(+pos/1000,0,TIMELINE_YEARS.length-1),i=Math.min(Math.floor(raw),TIMELINE_YEARS.length-2),t=raw-i;return mix(TIMELINE_YEARS[i],TIMELINE_YEARS[i+1],t)}
function posForYear(year){if(year<=TIMELINE_YEARS[0])return 0;if(year>=TIMELINE_YEARS.at(-1))return +slider.max;for(let i=0;i<TIMELINE_YEARS.length-1;i++){const a=TIMELINE_YEARS[i],b=TIMELINE_YEARS[i+1];if(year>=a&&year<=b)return i*1000+(year-a)/(b-a)*1000}return 0}
function worldPopulationAt(year){const a=meta.world_totals;if(year<=a[0].year)return a[0].population;if(year>=a.at(-1).year)return a.at(-1).population;for(let i=0;i<a.length-1;i++){if(year>=a[i].year&&year<=a[i+1].year){const t=(year-a[i].year)/(a[i+1].year-a[i].year);return mix(a[i].population,a[i+1].population,t)}}return a.at(-1).population}

function lineageState(lineage,year){const ks=lineage.keyframes,lead=180;if(year<ks[0].year-lead)return {population:0,a:ks[0],b:ks[0],t:0,birth:0};if(year<ks[0].year){const t=(year-(ks[0].year-lead))/lead;return {population:ks[0].population*smooth(t),a:ks[0],b:ks[0],t:0,birth:smooth(t)}};if(year>=ks.at(-1).year)return {population:ks.at(-1).population,a:ks.at(-1),b:ks.at(-1),t:0,birth:1};for(let i=0;i<ks.length-1;i++){const a=ks[i],b=ks[i+1];if(year>=a.year&&year<=b.year){const t=(year-a.year)/(b.year-a.year),q=smooth(t);return {population:mix(a.population,b.population,q),a,b,t:q,birth:1,ia:i,ib:i+1}}}return {population:0,a:ks[0],b:ks[0],t:0,birth:0}}

function totalLineageRaw(year){return lineages.reduce((s,l)=>s+lineageState(l,year).population,0)}
function populationScale(year){const raw=totalLineageRaw(year),world=worldPopulationAt(year);return raw>0?world/raw:1}

function landPoint(lineage,kf,index){
  const key=`${lineage.id}:${kf.year}:${index}`;if(positionCache.has(key))return positionCache.get(key);
  const seed=hash32(key),u=rnd(seed),pick=chooseCenter(kf.centers,u),c=pick.center;
  let chosen=[c.lon,c.lat];
  for(let a=0;a<18;a++){
    const s1=hash32(`${key}:a:${a}`),s2=hash32(`${key}:b:${a}`);
    const ang=rnd(s1)*Math.PI*2,rr=Math.sqrt(rnd(s2))*c.spread;
    const lat=c.lat+Math.sin(ang)*rr;
    const lon=c.lon+Math.cos(ang)*rr/Math.max(.32,Math.cos(c.lat*Math.PI/180));
    const candidate=[lon,lat];
    if(d3.geoContains(worldFeature,candidate)){chosen=candidate;break}
  }
  positionCache.set(key,chosen);return chosen
}

function pointFor(lineage,state,index){
  const pa=landPoint(lineage,state.a,index),pb=landPoint(lineage,state.b,index);
  if(state.a.year===state.b.year)return {lon:pa[0],lat:pa[1],alpha:1};
  const d=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);
  if(d<6){const lon=mix(pa[0],pb[0],state.t),lat=mix(pa[1],pb[1],state.t);return d3.geoContains(worldFeature,[lon,lat])?{lon,lat,alpha:1}:{lon:state.t<.5?pa[0]:pb[0],lat:state.t<.5?pa[1]:pb[1],alpha:1}}
  if(state.t<.5)return {lon:pa[0],lat:pa[1],alpha:1-state.t*1.7};
  return {lon:pb[0],lat:pb[1],alpha:(state.t-.5)*1.7+.15}
}

function activeDots(lineage,state,scale){return Math.max(0,state.population*scale/DOT_VALUE)}

function cameraFor(year){
  if(!autoFocus)return {k:1,tx:0,ty:0};
  const pts=[];const scale=populationScale(year);
  for(const l of lineages){const st=lineageState(l,year),n=activeDots(l,st,scale);if(n<10)continue;const k=st.t<.5?st.a:st.b;for(const c of k.centers){if(c.share*n>=10){const p=projection([c.lon,c.lat]);if(p)pts.push(p)}}}
  if(!pts.length)return {k:1,tx:0,ty:0};
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),spanX=Math.max(90,Math.max(...xs)-Math.min(...xs)),spanY=Math.max(70,Math.max(...ys)-Math.min(...ys));
  const k=clamp(Math.min((baseW*.73)/spanX,(baseH*.70)/spanY),1,3.1),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  return {k,tx:baseW/2-k*cx,ty:baseH/2-k*cy}
}

function resize(){const r=stage.getBoundingClientRect();baseW=r.width;baseH=r.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(baseW*dpr);canvas.height=Math.round(baseH*dpr);canvas.style.width=baseW+'px';canvas.style.height=baseH+'px';ctx.setTransform(dpr,0,0,dpr,0,0);worldSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);labelsSvg.attr('viewBox',`0 0 ${baseW} ${baseH}`);projection=d3.geoNaturalEarth1().fitExtent([[15,12],[baseW-15,baseH-12]],worldFeature);path=d3.geoPath(projection);drawWorld();render(+slider.value)}
function drawWorld(){worldSvg.selectAll('*').remove();const g=worldSvg.append('g').attr('id','mapLayer');g.append('path').datum({type:'Sphere'}).attr('d',path).attr('class','ocean');g.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('class','graticule');g.append('path').datum(worldFeature).attr('d',path).attr('class','land')}

function drawDots(year,camera){
  ctx.clearRect(0,0,baseW,baseH);const scale=populationScale(year);let drawn=0;
  for(const l of lineages){if(hidden.has(l.id))continue;const st=lineageState(l,year),count=activeDots(l,st,scale);if(count<=0)continue;const full=Math.floor(count),frac=count-full;ctx.fillStyle=l.color;
    for(let i=0;i<Math.min(full,l.maxDots);i++){const p=pointFor(l,st,i),xy=projection([p.lon,p.lat]);if(!xy)continue;const x=xy[0]*camera.k+camera.tx,y=xy[1]*camera.k+camera.ty;if(x<-5||y<-5||x>baseW+5||y>baseH+5)continue;ctx.globalAlpha=.74*p.alpha;ctx.beginPath();ctx.arc(x,y,Math.max(1.15,1.35*Math.sqrt(camera.k)),0,Math.PI*2);ctx.fill();drawn++}
    if(frac>.08&&full<l.maxDots){const p=pointFor(l,st,full),xy=projection([p.lon,p.lat]);if(xy){ctx.globalAlpha=.74*frac*p.alpha;ctx.beginPath();ctx.arc(xy[0]*camera.k+camera.tx,xy[1]*camera.k+camera.ty,Math.max(1.15,1.35*Math.sqrt(camera.k)),0,Math.PI*2);ctx.fill()}}
  }
  ctx.globalAlpha=1;return drawn
}

function buildLabels(year,camera){labelsSvg.selectAll('*').remove();const entries=[];for(const l of lineages){if(hidden.has(l.id))continue;const st=lineageState(l,year),pop=st.population*populationScale(year);if(pop<18000)continue;const k=st.t<.5?st.a:st.b;for(const c of k.centers)entries.push({name:c.name,score:pop*c.share,color:l.color,lon:c.lon,lat:c.lat})}
  entries.sort((a,b)=>b.score-a.score);const chosen=[];for(const e of entries){const q=projection([e.lon,e.lat]);if(!q)continue;const xy=[q[0]*camera.k+camera.tx,q[1]*camera.k+camera.ty];if(xy[0]<20||xy[0]>baseW-20||xy[1]<20||xy[1]>baseH-20)continue;if(chosen.some(z=>Math.hypot(z.xy[0]-xy[0],z.xy[1]-xy[1])<62))continue;chosen.push({...e,xy});if(chosen.length>=10)break}
  const g=labelsSvg.append('g');for(const e of chosen){const it=g.append('g').attr('class','place-label').attr('transform',`translate(${e.xy[0]},${e.xy[1]})`);it.append('circle').attr('r',3).attr('fill',e.color).attr('stroke','#fff').attr('stroke-width',1.2);it.append('text').attr('x',7).attr('y',3).text(e.name)}
}

function buildLegend(){legend.innerHTML=lineages.map(l=>`<button data-id="${l.id}"><i style="background:${l.color}"></i>${l.label}</button>`).join('');legend.querySelectorAll('button').forEach(b=>b.onclick=()=>{const id=b.dataset.id;hidden.has(id)?hidden.delete(id):hidden.add(id);b.classList.toggle('off',hidden.has(id));render(+slider.value)})}

function nearestEvent(pos){const arr=meta.events.map(e=>({...e,d:Math.abs(posForYear(e.year)-pos)})).sort((a,b)=>a.d-b.d);return arr[0]&&arr[0].d<185?arr[0]:null}
function topLineages(year){const scale=populationScale(year);return lineages.map(l=>({l,p:lineageState(l,year).population*scale})).filter(x=>x.p>5000&&!hidden.has(x.l.id)).sort((a,b)=>b.p-a.p).slice(0,6)}

function render(pos){if(!worldFeature||!projection)return;const year=yearForPos(pos),camera=cameraFor(year);worldSvg.select('#mapLayer').attr('transform',`translate(${camera.tx},${camera.ty}) scale(${camera.k})`);drawDots(year,camera);buildLabels(year,camera);
  const total=worldPopulationAt(year),peak=16500000;yearEl.textContent=formatYear(year);counter.textContent=formatYear(year);totalNumber.textContent=fmt(total);totalBar.style.width=`${clamp(total/peak*100,0,100)}%`;const delta=(total-peak)/peak*100;totalMeta.textContent=year>=1939&&year<=1951?`${delta.toFixed(0)}% vs. 1939 peak · visual reconstruction`:year<1490?'Ancient/medieval distribution is a visual reconstruction':'World total series with lineage reconstruction below';qualityEl.textContent=year<1490?'Hypothesis-driven locality model · locations constrained to land':'Community-lineage reconstruction · 1 dot = 1,000 people';interpEl.textContent='continuous lineage reconstruction';
  const ev=nearestEvent(pos);story.classList.toggle('event',!!ev);storyKicker.textContent=ev?'Historical event':'Community movement';storyTitle.textContent=ev?ev.title:'Jewish communities diverge, migrate and reconverge';storyText.textContent=ev?ev.text:'Colors persist across time so the same community traditions can be followed as their demographic centers move. Modern Israel is shown as a convergence of multiple lineages rather than a single replacement category.';
  topCenters.innerHTML=topLineages(year).map(({l,p})=>`<div><i style="background:${l.color}"></i><span>${l.label}</span><b>${fmt(p)}</b></div>`).join('');coverageEl.textContent='Synthetic lineage model · dots remain on land at each demographic state';sourceLink.href='https://github.com/apotapov57/jewish-population-atlas';sourceLink.textContent='Methodology ↗';
  const eventKey=ev?`${ev.year}:${ev.title}`:'';if(playing&&ev?.major&&eventKey&&eventKey!==lastEventKey){pauseUntil=performance.now()+1450;lastEventKey=eventKey}
}

function buildTimeline(){eventDots.innerHTML=meta.events.map(e=>`<i class="${e.major?'major':''}" style="left:${posForYear(e.year)/slider.max*100}%" title="${e.title}"></i>`).join('');const labels=[-800,-450,50,500,1170,1490,1750,1850,1897,1939,1945,1951,1989,2024];anchorLabels.innerHTML=labels.map(y=>`<span style="left:${posForYear(y)/slider.max*100}%">${formatYear(y).replace(' CE','').replace(' BCE',' BCE')}</span>`).join('')}
function drawSpark(){const totals=meta.world_totals,max=d3.max(totals,d=>d.population);const x=y=>posForYear(y)/slider.max*1000,y=p=>44-p/max*38;const line=d3.line().x(d=>x(d.year)).y(d=>y(d.population)).curve(d3.curveMonotoneX),area=d3.area().x(d=>x(d.year)).y0(46).y1(d=>y(d.population)).curve(d3.curveMonotoneX);spark.innerHTML=`<path class="area" d="${area(totals)}"></path><path class="line" d="${line(totals)}"></path><circle class="peak" cx="${x(1939)}" cy="${y(16500000)}" r="2.7"></circle>`}

function playLoop(ts){if(!playing)return;if(ts<pauseUntil){raf=requestAnimationFrame(playLoop);return}if(!lastTs)lastTs=ts;const dt=ts-lastTs;lastTs=ts;let v=+slider.value+dt*.075;if(v>+slider.max){v=0;lastEventKey=''}slider.value=v;render(v);raf=requestAnimationFrame(playLoop)}
playBtn.onclick=()=>{playing=!playing;playBtn.textContent=playing?'❚❚':'▶';lastTs=0;pauseUntil=0;if(playing)raf=requestAnimationFrame(playLoop);else cancelAnimationFrame(raf)};
slider.addEventListener('input',()=>{lastEventKey='';render(+slider.value)});$('#focusBtn').onclick=()=>{autoFocus=!autoFocus;$('#focusBtn').classList.toggle('active',autoFocus);render(+slider.value)};window.addEventListener('resize',()=>{clearTimeout(window.__rt);window.__rt=setTimeout(resize,90)});
load().catch(err=>{console.error(err);$('#loading').innerHTML=`<div>Could not load atlas data.<small>${err.message}</small></div>`});
