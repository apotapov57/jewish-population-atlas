// v0.6 spatial patch: distribute regional populations across real settlement networks.
let settlementNetworks={};
let settlementNetworksReady=false;
const baseLandPoint=landPoint;
const baseBuildLabels=buildLabels;
const baseRender=render;

function weightedSite(sites,u){
  const total=sites.reduce((s,x)=>s+(x.w||1),0);
  let acc=0;
  for(const site of sites){acc+=(site.w||1)/total;if(u<=acc)return site}
  return sites[sites.length-1];
}

function settlementNetworkId(lineage,center,year){
  const n=(center.name||'').toLowerCase();
  if(n.includes('congress poland')||n==='poland'||n.includes('warsaw/poland'))return 'poland_lithuania';
  if(n.includes('lithuania')||n.includes('belarus'))return 'pale_north';
  if(n.includes('galicia'))return 'galicia';
  if(n.includes('volhynia')||n.includes('podolia')||n==='ukraine'||n.includes('bessarabia'))return 'pale_south';
  if(n.includes('russia cities')||n.includes('moscow/leningrad')||n.includes('ussr cities'))return 'soviet_west_1930';
  if(n==='ussr'||n.includes('ussr east'))return year>=1945?'soviet_postwar':'soviet_west_1930';
  if((n==='israel'||n==='palestine')&&year>=1948)return 'israel_urban';
  return null;
}

function networkScatter(id){
  if(id==='israel_urban')return .11;
  if(id==='galicia')return .25;
  if(id==='poland_lithuania'||id==='pale_north'||id==='pale_south')return .34;
  if(id==='soviet_west_1930')return .42;
  if(id==='soviet_postwar')return .5;
  return .2;
}

landPoint=function(lineage,kf,index){
  if(!settlementNetworksReady)return baseLandPoint(lineage,kf,index);
  const key=`v06:${lineage.id}:${kf.year}:${index}`;
  if(positionCache.has(key))return positionCache.get(key);
  const seed=hash32(key),u=rnd(seed),pick=chooseCenter(kf.centers,u),center=pick.center;
  const networkId=settlementNetworkId(lineage,center,kf.year);
  const sites=networkId&&settlementNetworks[networkId];
  if(!sites||!sites.length){const p=baseLandPoint(lineage,kf,index);positionCache.set(key,p);return p}
  const site=weightedSite(sites,rnd(hash32(`${key}:site`)));
  let chosen=[site.lon,site.lat];
  const scatter=networkScatter(networkId);
  // A locality is a seed for a settlement belt, not a claim that everyone lived at its center.
  for(let a=0;a<22;a++){
    const ang=rnd(hash32(`${key}:ang:${a}`))*Math.PI*2;
    const rr=Math.sqrt(rnd(hash32(`${key}:rr:${a}`)))*scatter;
    const lat=site.lat+Math.sin(ang)*rr;
    const lon=site.lon+Math.cos(ang)*rr/Math.max(.35,Math.cos(site.lat*Math.PI/180));
    if(d3.geoContains(worldFeature,[lon,lat])){chosen=[lon,lat];break}
  }
  positionCache.set(key,chosen);return chosen;
};

// Labels use real settlement seeds wherever a regional network exists.
buildLabels=function(year,camera){
  if(!settlementNetworksReady)return baseBuildLabels(year,camera);
  labelsSvg.selectAll('*').remove();
  const entries=[];
  const scale=populationScale(year);
  for(const l of lineages){
    if(hidden.has(l.id))continue;
    const st=lineageState(l,year),pop=st.population*scale;if(pop<18000)continue;
    const k=st.t<.5?st.a:st.b;
    for(const c of k.centers){
      const netId=settlementNetworkId(l,c,k.year),sites=netId&&settlementNetworks[netId];
      if(sites?.length){
        const totalW=sites.reduce((s,x)=>s+(x.w||1),0);
        for(const site of sites){entries.push({name:site.name,score:pop*c.share*(site.w||1)/totalW,color:l.color,lon:site.lon,lat:site.lat})}
      }else entries.push({name:c.name,score:pop*c.share,color:l.color,lon:c.lon,lat:c.lat});
    }
  }
  entries.sort((a,b)=>b.score-a.score);
  const chosen=[];
  for(const e of entries){
    const q=projection([e.lon,e.lat]);if(!q)continue;
    const xy=[q[0]*camera.k+camera.tx,q[1]*camera.k+camera.ty];
    if(xy[0]<20||xy[0]>baseW-20||xy[1]<20||xy[1]>baseH-20)continue;
    if(chosen.some(z=>Math.hypot(z.xy[0]-xy[0],z.xy[1]-xy[1])<50))continue;
    chosen.push({...e,xy});if(chosen.length>=14)break;
  }
  const g=labelsSvg.append('g');
  for(const e of chosen){const it=g.append('g').attr('class','place-label').attr('transform',`translate(${e.xy[0]},${e.xy[1]})`);it.append('circle').attr('r',2.8).attr('fill',e.color).attr('stroke','#fff').attr('stroke-width',1.1);it.append('text').attr('x',6).attr('y',3).text(e.name)}
};

// Overall playback 1.5x faster than v0.5.
playLoop=function(ts){
  if(!playing)return;
  if(ts<pauseUntil){raf=requestAnimationFrame(playLoop);return}
  if(!lastTs)lastTs=ts;
  const dt=ts-lastTs;lastTs=ts;
  let v=+slider.value+dt*.1125;
  if(v>+slider.max){v=0;lastEventKey=''}
  slider.value=v;render(v);raf=requestAnimationFrame(playLoop);
};

// Reduce long event holds proportionally while preserving readable pauses.
render=function(pos){
  const before=pauseUntil;
  baseRender(pos);
  if(playing&&pauseUntil>before&&pauseUntil>performance.now()+1050){pauseUntil=performance.now()+1000}
  const y=yearForPos(pos);
  if(y>=1750&&y<1917)coverageEl.textContent='Regional mass distributed through a real-town settlement scaffold; town-level counts are the next data layer.';
  else if(y>=1917&&y<1991)coverageEl.textContent='Post-1917 distribution expands beyond the former Pale through a Soviet urban settlement network.';
};

fetch('data/settlement_networks.json')
  .then(r=>r.json())
  .then(data=>{
    settlementNetworks=data;settlementNetworksReady=true;positionCache.clear();render(+slider.value);
  })
  .catch(err=>console.warn('Settlement network layer unavailable',err));