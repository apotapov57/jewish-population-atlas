// v0.6 spatial patch: distribute regional populations across real settlement networks.
let settlementNetworks={};
let settlementNetworksReady=false;
const baseLandPoint=landPoint;
const baseRender=render;
const basePlayLoop=playLoop;

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
  // Tight local scatter around a real settlement, not around the regional capital.
  for(let a=0;a<16;a++){
    const ang=rnd(hash32(`${key}:ang:${a}`))*Math.PI*2;
    const rr=Math.sqrt(rnd(hash32(`${key}:rr:${a}`)))*0.16;
    const lat=site.lat+Math.sin(ang)*rr;
    const lon=site.lon+Math.cos(ang)*rr/Math.max(.35,Math.cos(site.lat*Math.PI/180));
    if(d3.geoContains(worldFeature,[lon,lat])){chosen=[lon,lat];break}
  }
  positionCache.set(key,chosen);return chosen;
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
};

fetch('data/settlement_networks.json')
  .then(r=>r.json())
  .then(data=>{
    settlementNetworks=data;settlementNetworksReady=true;positionCache.clear();render(+slider.value);
  })
  .catch(err=>console.warn('Settlement network layer unavailable',err));