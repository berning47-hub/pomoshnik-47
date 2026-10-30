/* ===== Помощник 47 — раздел «Места» =====
   Самостоятельный модуль: подключается после sync.js и сам встраивается в меню, render/bind, модалки и настройки.
   Карта: Leaflet + плитки Esri World Street Map (бесплатно, без ключа; OSM блокирует запуск с file://, CARTO просит ключ), поиск адреса: Nominatim. */
const PL_CATS = [['coffee','Кофе','☕'],['food','Еда','🍽️'],['park','Парк','🌳'],['view','Вид','🏞️'],['culture','Культура','🏛️'],['other','Другое','📍']];
const PL_CAT = Object.fromEntries(PL_CATS.map(c=>[c[0],c]));
const PL_STAY = {coffee:30, food:60, park:40, view:30, culture:60, other:20};   // минут на месте по умолчанию
const PL_TBS = [41.62, 44.65, 41.84, 44.98];                                    // рамка Тбилиси: lat/lng min, max
const PL_CENTER = [41.7095, 44.7600];
/* подложки: все от Esri (без ключа, работают и с диска, и с сайта) */
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
const PL_BASES = [['map','Схема',ESRI+'World_Street_Map/MapServer/tile/{z}/{y}/{x}'],['sat','Спутник',ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}'],['hybrid','Спутник + подписи',ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}'],['topo','Рельеф',ESRI+'World_Topo_Map/MapServer/tile/{z}/{y}/{x}']];
const plBase = () => { try{ const b=localStorage.getItem('p47.plbase'); return PL_BASES.some(x=>x[0]===b) ? b : 'map'; }catch(e){ return 'map'; } };
const plYa = (lat, lng) => `https://yandex.com/maps/?pt=${lng},${lat}&z=17&l=map`;
const plYaRoute = (a, b) => `https://yandex.com/maps/?rtext=${a.lat},${a.lng}~${b.lat},${b.lng}&rtt=pd`;
function plSetBase(k){
  try{ localStorage.setItem('p47.plbase', k); }catch(e){}
  if(!PL.map) return;
  const url = PL_BASES.find(b=>b[0]===k)[2];
  PL.tiles.setUrl(url);
  if(k==='hybrid'){if(!PL.labels)PL.labels=L.tileLayer(ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});PL.labels.addTo(PL.map);}
  else if(PL.labels)PL.map.removeLayer(PL.labels); PL.el.classList.toggle('sat', ['sat','hybrid'].includes(k));
}

/* стартовые места: настоящие известные заведения и парки Ваке и соседней Веры.
   Адреса из путеводителей (wander-lush.org, 2026), координаты примерные: при первом открытии карты
   47 сам уточняет их по адресу через OpenStreetMap. Метка «проверить» снимается, когда вы там побывали или поправили место. */
const PL_SEED = [
  ['lui','Lui Coffee','coffee','пр. Ильи Чавчавадзе, 23','23 Ilia Chavchavadze Avenue, Tbilisi',41.7102,44.7612,'Работает круглосуточно, завтраки и торты, зерно Coffee LAB.'],
  ['puri-guliani','Puri Guliani (Ваке)','coffee','ул. Ираклия Абашидзе, 37','37 Irakli Abashidze Street, Tbilisi',41.7085,44.7545,'Пекарня и кофе: хачапури, выпечка.'],
  ['coffeelab-pal','Coffee LAB (Палиашвили)','coffee','ул. Захария Палиашвили, 24','24 Zakaria Paliashvili Street, Tbilisi',41.7098,44.7668,'Обжарщики спешелти, уютные диваны, завтраки и десерты.'],
  ['shavi','Shavi Coffee Roasters (Вера)','coffee','ул. Зандукели, 40','40 Zandukeli Street, Tbilisi',41.7083,44.7760,'Светлый лофт, своя обжарка, торты и сэндвичи.'],
  ['okro','OKRO Coffee Roastery','coffee','ул. Николадзе, 14','14 Niko Nikoladze Street, Tbilisi',41.7058,44.7812,'Обжарочная в индустриальном стиле, шоколадный торт без муки.'],
  ['pulp','Pulp','coffee','ул. Симона Джанашиа, 22','22 Simon Janashia Street, Tbilisi',41.7076,44.7722,'Спешелти и авторская выпечка, завтрак недели.'],
  ['bnkr','BNKR Specialty Roasters (Вера)','coffee','ул. Симона Джанашиа, 19','19 Simon Janashia Street, Tbilisi',41.7072,44.7716,'Большой зал, можно с ноутбуком.'],
  ['slow','Slow Tbilisi (Вера)','coffee','ул. Мцхета, 17','17 Mtskheta Street, Tbilisi',41.7052,44.7826,'Кофе днём, вино вечером, завтраки.'],
  ['vake-park','Парк Ваке','park','конец пр. Чавчавадзе','Vake Park, Tbilisi',41.7083,44.7440,'Большой парк с аллеями и каскадом фонтанов. Отсюда канатка к Черепашьему озеру.'],
  ['turtle','Черепашье озеро','view','над парком Ваке, канатка','Turtle Lake, Tbilisi',41.7006,44.7531,'Озеро на горе: круг вокруг воды, кафе, вид на город. Канатная дорога от парка Ваке.'],
  ['ethno','Музей этнографии под открытым небом','culture','дорога к Черепашьему озеру','Open Air Museum of Ethnography, Tbilisi',41.7038,44.7568,'Старые грузинские дома на склоне, рядом с Черепашьим озером.'],
  ['mziuri','Парк Мзиури','park','у реки Вере','Mziuri Park, Tbilisi',41.7150,44.7650,'Тихий парк вдоль реки Вере, удобно для вечерней прогулки.']
];

function ensurePlaces(){
  if(!Array.isArray(S.places)) S.places = [];
  if(!Array.isArray(S.walks)) S.walks = [];
  S.placecfg = Object.assign({home:null, speed:4.5, stay:{...PL_STAY}, seeded:[]}, S.placecfg||{});
  S.placecfg.stay = Object.assign({...PL_STAY}, S.placecfg.stay||{});
  if(!S.placecfg.home && typeof PRIV_HOME!=='undefined') S.placecfg.home = {...PRIV_HOME};
  if(!S.placecfg.homeAddr && typeof PRIV_HOME_ADDR!=='undefined') S.placecfg.homeAddr = PRIV_HOME_ADDR;   // адрес только в private-data.js, в GitHub не попадает
  PL_SEED.forEach(([k,name,cat,addr,q,lat,lng,note])=>{
    if(S.placecfg.seeded.includes(k)) return; S.placecfg.seeded.push(k);
    if(!S.places.some(p=>p.id==='pl-'+k)) S.places.push({id:'pl-'+k, name, cat, addr, q, lat, lng, note, link:'', seed:true, geo:'approx', by:'both', at:Date.now(), been:{}, want:{}, rate:{}});
  });
  S.places.forEach(p=>{ p.been=p.been||{}; p.want=p.want||{}; p.rate=p.rate||{}; });
  UI.pltab = UI.pltab || 'list'; UI.plcat = UI.plcat || 'all'; UI.plst = UI.plst || 'all';
}
ensurePlaces();

if(typeof ARR!=='undefined'){
  ARR.place = {get:()=>S.places, set:a=>{S.places=a;}};
  ARR.walk = {get:()=>S.walks, set:a=>{S.walks=a;}};
  SINGLE.placecfg = {get:()=>S.placecfg, set:d=>{ S.placecfg=d; ensurePlaces(); }};
}

/* ---------- расчёты ---------- */
const plFind = id => S.places.find(p=>p.id===id);
const plCanEdit = p => p.by==='both' || p.by===S.me;
function plKm(a, b){
  const R=6371, r=x=>x*Math.PI/180, dLa=r(b.lat-a.lat), dLo=r(b.lng-a.lng);
  const h=Math.sin(dLa/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const plWalkKm = (a, b) => plKm(a,b)*1.3;   // по улицам примерно на треть длиннее, чем по прямой
const plKmStr = km => km<1 ? Math.round(km*1000/50)*50+' м' : km.toFixed(1).replace('.',',')+' км';
function plStatus(p){
  const b7=!!p.been['7'], b4=!!p.been['4'];
  if(b7&&b4) return 'been'; if(b7||b4) return 'half'; if(p.want['7']||p.want['4']) return 'want'; return '';
}
/* прогулка: точки по порядку (дом в начале и в конце, если отмечено) → км и минуты */
function plWalkCalc(w){
  const stops = w.stops.map(plFind).filter(Boolean), H = S.placecfg.home;
  const pts = (w.home && H ? [H] : []).concat(stops).concat(w.home && H && stops.length ? [H] : []);
  let km=0; for(let i=1;i<pts.length;i++) km+=plWalkKm(pts[i-1], pts[i]);
  const walkMin = Math.round(km/(+S.placecfg.speed||4.5)*60);
  const stayMin = stops.reduce((a,p)=>a+(+(w.stay?.[p.id] ?? S.placecfg.stay[p.cat] ?? 20)),0);
  return {stops, pts, km, walkMin, stayMin, total: Math.round((walkMin+stayMin)/5)*5};
}
/* порядок «ближайшая следующая» от дома (или от первой точки) */
function plOrder(ids, home){
  const left = ids.map(plFind).filter(Boolean), out=[];
  let cur = home && S.placecfg.home ? S.placecfg.home : left.shift(); if(!home && cur) out.push(cur);
  while(left.length){ left.sort((a,b)=>plKm(cur,a)-plKm(cur,b)); cur=left.shift(); out.push(cur); }
  return out.map(p=>p.id);
}

/* ---------- Leaflet: грузим один раз, карта живёт между перерисовками ---------- */
const PL = {map:null, el:null, layer:null, route:null, loading:false, pick:null, homeM:null};
function plLoadLeaflet(cb){
  if(window.L) return cb();
  if(PL.loading){ PL.wait = cb; return; } PL.loading = true; PL.wait = cb;
  const css = document.createElement('link'); css.rel='stylesheet'; css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
  const s = document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  s.onload = ()=>{ PL.loading=false; PL.wait && PL.wait(); };
  s.onerror = ()=>{ PL.loading=false; PL.failed=true; const sl=$root.querySelector('#pl-slot'); if(sl) sl.innerHTML='<div class="empty" style="margin:0">Карта не загрузилась: нет интернета. Список мест работает.</div>'; };
  document.head.appendChild(s);
}
function plMountMap(){
  const slot = $root.querySelector('#pl-slot'); if(!slot) return;
  if(PL.failed) return;
  if(!window.L){ plLoadLeaflet(plMountMap); return; }
  if(!PL.el){
    PL.el = document.createElement('div'); PL.el.className='pl-map';
    slot.replaceWith(PL.el);
    const dark = typeof effTheme==='function' && effTheme()==='dark';
    PL.map = L.map(PL.el, {zoomControl:true, attributionControl:true}).setView(S.placecfg.home ? [S.placecfg.home.lat, S.placecfg.home.lng] : PL_CENTER, S.placecfg.home ? 16 : 15);
    PL.tiles = L.tileLayer(PL_BASES.find(b=>b[0]===plBase())[2], {maxZoom:19,
      attribution:'Tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors'}).addTo(PL.map);
    PL.el.classList.toggle('sat', ['sat','hybrid'].includes(plBase()));
    PL.dark = dark; PL.el.classList.toggle('dark', dark);
    PL.layer = L.layerGroup().addTo(PL.map);
    plSetBase(plBase());
    PL.map.on('click', e=>plMapClick(e.latlng));
    PL.el.addEventListener('click', e=>{ const b=e.target.closest('[data-plpop]'); if(!b) return; const [act,id]=b.dataset.plpop.split(':'); plPopAct(act, id); });
    setTimeout(plAutoHome, 800); setTimeout(plGeocodeSeeds, 2500);
  } else {
    slot.replaceWith(PL.el);
    const dark = typeof effTheme==='function' && effTheme()==='dark';
    PL.dark = dark; PL.el.classList.toggle('dark', dark);
    setTimeout(()=>PL.map.invalidateSize(), 0);
  }
  PL.el.classList.toggle('picking', !!PL.pick);
  plDrawMarkers();
}
function plVisible(){
  return S.places.filter(p=>(UI.plcat==='all' || p.cat===UI.plcat) && (UI.plst==='all' || (UI.plst==='want' ? (p.want[S.me]||p.want[other(S.me)]) && !(p.been['7']&&p.been['4']) : UI.plst==='been' ? (p.been['7']||p.been['4']) : !(p.been['7']||p.been['4']))));
}
function plDrawMarkers(){
  if(!PL.map) return;
  PL.layer.clearLayers();
  const walk = UI.pltab==='walks' && UI.plwalk ? S.walks.find(w=>w.id===UI.plwalk) : null;
  const calc = walk ? plWalkCalc(walk) : null, order = calc ? calc.stops.map(p=>p.id) : [];
  const list = walk ? calc.stops : plVisible();
  list.forEach(p=>{
    const n = order.indexOf(p.id), st = plStatus(p);
    const html = `<div class="pl-pin ${st} ${UI.plsel===p.id?'sel':''}">${n>=0?`<b>${n+1}</b>`:`<i>${PL_CAT[p.cat]?.[2]||'📍'}</i>`}</div>`;
    const m = L.marker([p.lat,p.lng], {icon:L.divIcon({html, className:'pl-ic', iconSize:[34,34], iconAnchor:[17,30]}), title:p.name}).addTo(PL.layer);
    m.bindPopup(()=>plPopup(p), {closeButton:false, offset:[0,-24]});
    m.on('click', ()=>{ UI.plsel=p.id; plHighlight(); });
    if(UI.plsel===p.id && UI.plopen){ setTimeout(()=>m.openPopup(), 50); UI.plopen=false; }
  });
  const H = S.placecfg.home;
  if(H) L.marker([H.lat,H.lng], {icon:L.divIcon({html:'<div class="pl-pin home"><i>🏠</i></div>', className:'pl-ic', iconSize:[34,34], iconAnchor:[17,30]}), title:'Дом', zIndexOffset:-100})
    .addTo(PL.layer).bindPopup(`<b>Дом</b><br><button class="pl-pbtn" data-plpop="home:">Перенести</button>`, {closeButton:false, offset:[0,-24]});
  if(calc && calc.pts.length>1 && typeof waDrawWalk==='function') waDrawWalk(walk,calc);

}
function plPopup(p){
  const c = PL_CAT[p.cat]||PL_CATS[5], d = S.placecfg.home ? plWalkKm(S.placecfg.home, p) : 0;
  const mine = p.been[S.me];
  return `<div class="pl-pop"><b>${esc(p.name)}</b><small>${c[2]} ${c[1]}${p.addr?' · '+esc(p.addr):''}${d?` · ${plKmStr(d)} от дома, ~${Math.max(1,Math.round(d/(+S.placecfg.speed||4.5)*60))} мин`:''}</small>
    ${p.note?`<p>${esc(p.note)}</p>`:''}
    <div class="pl-pacts"><button class="pl-pbtn ${mine?'on':''}" data-plpop="been:${p.id}">${mine?'✓ Был'+(fem(S.me)?'а':''):'Был'+(fem(S.me)?'а':'')}</button>
      <button class="pl-pbtn ${p.want[S.me]?'on':''}" data-plpop="want:${p.id}">${p.want[S.me]?'★ Хочу':'☆ Хочу'}</button>
      <button class="pl-pbtn" data-plpop="edit:${p.id}">Подробнее</button></div>
      <a class="pl-ya" href="${plYa(p.lat,p.lng)}" target="_blank" rel="noopener">Открыть в Яндекс Картах ↗</a></div>`;
}
function plPopAct(act, id){
  if(act==='home'){ PL.pick={home:true}; PL.map.closePopup(); PL.el.classList.add('picking'); toast('Нажмите на карте, где ваш дом'); return; }
  const p = plFind(id); if(!p) return;
  if(act==='edit'){ PL.map.closePopup(); plOpen(p.id); return; }
  if(act==='been') plMark(p, 'been'); else if(act==='want') plMark(p, 'want');
  render(); UI.plsel=p.id; UI.plopen=true; plDrawMarkers();
}
function plMark(p, k){
  if(k==='been'){ p.been[S.me] = p.been[S.me] ? '' : localISO(); if(p.been[S.me]){ p.want[S.me]=false; if(p.seed) p.seed=false; toast(`«${p.name}»: отмечено, что ${fem(S.me)?'были':'были'} ✓`); } }
  else p.want[S.me] = !p.want[S.me];
  if(p.been['7']&&p.been['4']&&k==='been'&&p.been[S.me]) notify(`Вы оба побывали в «${p.name}»`, 'shared');
  save();
}
function plHighlight(){ $root.querySelectorAll('[data-plcard]').forEach(c=>c.classList.toggle('sel', c.dataset.plcard===UI.plsel)); }
function plFly(p){ if(!PL.map) return; UI.plsel=p.id; UI.plopen=true; PL.map.flyTo([p.lat,p.lng], Math.max(PL.map.getZoom(),16), {duration:.6}); plDrawMarkers(); plHighlight();
  PL.el.scrollIntoView({behavior:'smooth', block:'nearest'}); }
function plMapClick(ll){
  if(ll.lat<PL_TBS[0]||ll.lat>PL_TBS[2]||ll.lng<PL_TBS[1]||ll.lng>PL_TBS[3]){ if(PL.pick){ toast('Это уже за Тбилиси'); } return; }
  if(PL.pick){
    const pk = PL.pick; PL.pick=null; PL.el.classList.remove('picking');
    if(pk.home){ S.placecfg.home={lat:+ll.lat.toFixed(6), lng:+ll.lng.toFixed(6)}; save(); render(); toast('Дом отмечен 🏠'); return; }
    UI.modal = pk.modal; UI.modal.draft.lat=+ll.lat.toFixed(6); UI.modal.draft.lng=+ll.lng.toFixed(6); UI.modal.draft.geo='manual'; render(); return;
  }
  L.popup({closeButton:false}).setLatLng(ll).setContent(`<div class="pl-pop"><div class="pl-pacts"><button class="pl-pbtn on" data-plpop="addhere:${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}">+ Место здесь</button>${S.placecfg.home?'':`<button class="pl-pbtn" data-plpop="homehere:${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}">🏠 Тут наш дом</button>`}</div></div>`).openOn(PL.map);
}
/* действия из всплывашки по пустому месту карты */
const _plPop = plPopAct;
plPopAct = (act, id) => {
  if(act==='addhere'||act==='homehere'){ const [lat,lng]=id.split(',').map(Number); PL.map.closePopup();
    if(act==='homehere'){ S.placecfg.home={lat,lng}; save(); render(); toast('Дом отмечен 🏠'); return; }
    plNew({lat, lng, geo:'manual'}); return; }
  _plPop(act, id);
};

/* базовый адрес: ищем на карте и ставим дом; сработает один раз, если адрес известен, а точки ещё нет */
async function plSetHome(q, quiet){
  const r = await plGeocode(q);
  if(!r.length){ if(!quiet) toast('Адрес не нашёлся. Нажмите на карте, где дом'); return false; }
  S.placecfg.home = {lat:r[0].lat, lng:r[0].lng}; S.placecfg.homeAddr = q; save();
  if(PL.map) PL.map.setView([r[0].lat, r[0].lng], 16);
  if(UI.section==='places' && !UI.modal) render();
  if(!quiet) toast('Дом поставлен: '+r[0].label); return true;
}
let plHomeTried = false;
function plAutoHome(){
  if(plHomeTried || S.placecfg.home || !S.placecfg.homeAddr || !navigator.onLine) return;
  plHomeTried = true; plSetHome(S.placecfg.homeAddr+', Tbilisi', true);
}

/* уточняем примерные координаты стартовых мест по адресу (OpenStreetMap, не чаще раза в секунду) */
let plGeoBusy = false; const plGeoTried = new Set();
async function plGeocodeSeeds(){
  if(plGeoBusy || !navigator.onLine) return;
  const p = S.places.find(x=>x.geo==='approx' && x.q && !plGeoTried.has(x.id)); if(!p) return;
  plGeoBusy = true; plGeoTried.add(p.id);
  const r = await plGeocode(p.q);
  plGeoBusy = false;
  const hit = r.find(x=>plKm(p, x) < 2);               // берём только совпадение рядом с ожидаемым местом
  if(hit){ p.lat=hit.lat; p.lng=hit.lng; p.geo='osm'; save(); if(UI.section==='places' && !UI.modal) plDrawMarkers(); }
  setTimeout(plGeocodeSeeds, 1200);
}
async function plGeocode(q){
  try{
    const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ru&bounded=1&viewbox='+[PL_TBS[1],PL_TBS[2],PL_TBS[3],PL_TBS[0]].join(',')+'&q='+encodeURIComponent(q);
    const res = await fetch(u, {headers:{'Accept':'application/json'}}); if(!res.ok) return [];
    return (await res.json()).map(x=>({lat:+(+x.lat).toFixed(6), lng:+(+x.lon).toFixed(6), name:x.name||'', label:x.display_name.split(',').slice(0,3).join(',')}));
  }catch(e){ return []; }
}

/* ---------- вид ---------- */
function placesView(){
  ensurePlaces();
  setTimeout(plMountMap, 0);
  const tabs = [['list','Места'],['walks','Прогулки']];
  const coffee = S.places.filter(p=>p.cat==='coffee'), cBoth = coffee.filter(p=>p.been['7']&&p.been['4']).length;
  return `<div class="filters"><div class="seg">${tabs.map(([k,t])=>`<button data-pltab="${k}" class="${UI.pltab===k?'on':''}">${t}</button>`).join('')}</div>
    <span class="pl-stat">☕ ${cBoth} из ${coffee.length} кофеен вдвоём</span>
    <div class="seg pl-bases">${PL_BASES.map(([k,n])=>`<button data-plbase="${k}" class="${plBase()===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="sp" style="flex:1"></div>
    ${UI.pltab==='list'?`<button class="btn ghost" data-plrnd>☕ Куда сегодня?</button><button class="btn" data-plnew>+ Место</button>`:`<button class="btn" data-plwnew>+ Прогулка</button>`}</div>
    <div class="pl-wrap">
      <div class="pl-mapcol"><div id="pl-slot" class="pl-map"></div>${typeof waRouteStatus==='function'?waRouteStatus():''}
        ${S.placecfg.home?'':'<p class="fhint">Нажмите на карте у вашего дома и выберите «🏠 Тут наш дом»: так 47 посчитает расстояния и время прогулок.</p>'}</div>
      <div class="pl-side">${UI.pltab==='list' ? plList() : plWalks()}</div>
    </div>`;
}
function plList(){
  const cats = [['all','Все'], ...PL_CATS.map(([k,n,i])=>[k,`${i} ${n}`])];
  const sts = [['all','Все'],['want','Хотим'],['new','Не были'],['been','Были']];
  const H = S.placecfg.home;
  const list = plVisible().sort((a,b)=> H ? plKm(H,a)-plKm(H,b) : a.name.localeCompare(b.name));
  return `<div class="filters pl-cats"><div class="seg">${cats.map(([k,t])=>`<button data-plcat="${k}" class="${UI.plcat===k?'on':''}">${t}</button>`).join('')}</div></div>
    <div class="filters"><div class="seg">${sts.map(([k,t])=>`<button data-plst="${k}" class="${UI.plst===k?'on':''}">${t}</button>`).join('')}</div></div>
    ${list.length ? `<div class="pl-list">${list.map(plCard).join('')}</div>` : `<div class="empty">Тут пусто. Нажмите на карту, чтобы добавить место.</div>`}`;
}
function plCard(p){
  const c = PL_CAT[p.cat]||PL_CATS[5], H = S.placecfg.home, d = H ? plWalkKm(H,p) : 0;
  return `<article class="pl-card ${UI.plsel===p.id?'sel':''}" data-plcard="${p.id}">
    <div class="pl-ci">${c[2]}</div>
    <div class="pl-cb"><b>${esc(p.name)}</b>
      <small>${p.addr?esc(p.addr):c[1]}${d?` · ${plKmStr(d)}`:''}${p.seed?' · <span class="pl-chk" title="Стартовое место: адрес из путеводителя, проверьте, что оно ещё работает">проверить</span>':''}</small>
      ${p.note?`<p>${esc(p.note)}</p>`:''}${typeof prCard==='function'?prCard(p):''}</div>
    <div class="pl-marks">${['7','4'].map(w=>{ const b=p.been[w], wa=p.want[w], me=w===S.me;
      return `<button class="pl-m ${b?'been':wa?'want':''}" ${me?`data-plmark="${p.id}"`:'disabled'} title="${esc(pname(w))}: ${b?'был'+(fem(w)?'а':'')+' '+new Date(b).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):wa?'хочет':'ещё не был'+(fem(w)?'а':'')}" style="${b?`background:${colorOf(w)};color:#fff`:''}">${b?'✓':wa?'★':w}</button>`; }).join('')}</div>
  </article>`;
}
function plWalks(){
  const H = S.placecfg.home;
  return `${S.walks.length ? `<div class="pl-list">${S.walks.map(w=>{ const c=plWalkCalc(w), t=w.taskId && S.tasks.find(x=>x.id===w.taskId);
    return `<article class="pl-card pl-walk ${UI.plwalk===w.id?'sel':''}" data-plwsel="${w.id}">
      <div class="pl-ci">🚶</div>
      <div class="pl-cb"><b>${esc(w.title)}</b>
        <small>${c.stops.length} ${plural(c.stops.length,'точка','точки','точек')} · ${plKmStr(c.km)} · ~${fmtMin(c.total)}${w.home&&H?' · от дома':''}${c.road?' · по улицам':' · предварительно'}</small>
        <p>${c.stops.map(p=>esc(p.name)).join(' → ')||'Нет точек'}</p>
        <div class="pl-wact">${t?`<span class="chip">${t.col==='done'?'✓ прошли':'на доске'}</span>`:`<button class="fbtn" data-pltask="${w.id}">На доску</button>`}
          <button class="fbtn" data-plwedit="${w.id}">${w.by===S.me||w.by==='both'?'Изменить':'Открыть'}</button></div></div>
    </article>`; }).join('')}</div>`
    : `<div class="empty">Соберите прогулку из мест: 47 посчитает расстояние и время, а одной кнопкой она станет общей задачей на доске.</div>`}
    ${H?'':'<p class="fhint">Отметьте дом на карте, чтобы прогулки начинались и заканчивались у дома.</p>'}`;
}

/* ---------- окна ---------- */
function plOpen(id){ const p=plFind(id); if(!p) return; UI.modal={type:'place', draft:JSON.parse(JSON.stringify(p))}; render(); }
function plNew(extra={}){
  const c = PL.map ? PL.map.getCenter() : {lat:PL_CENTER[0], lng:PL_CENTER[1]};
  UI.modal = {type:'place', isNew:true, draft:Object.assign({id:'pl-'+uid(), name:'', cat:UI.plcat==='all'?'coffee':UI.plcat, addr:'', lat:+c.lat.toFixed(6), lng:+c.lng.toFixed(6), geo:'', note:'', link:'', by:S.me, at:Date.now(), been:{}, want:{[S.me]:true}, rate:{}}, extra)};
  render(); setTimeout(()=>$root.querySelector('#pl-name')?.focus(), 30);
}
function plModal(m){
  const d = m.draft, ro = !m.isNew && !plCanEdit(d), has = d.geo==='manual'||d.geo==='osm'||d.geo==='approx'||!m.isNew;
  const gm = `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=walking`;
  return `<div class="scrim" data-close><div class="sheet" role="dialog"><h2>${m.isNew?'Новое место':esc(d.name)}</h2>
    ${ro?`<p class="fhint" style="margin-top:-6px">Место добавил${fem(d.by)?'а':''} ${esc(pname(d.by))}, менять его может только ${fem(d.by)?'она':'он'}. Свои отметки «был» и «хочу» ставьте на карточке.</p>`:''}
    ${d.seed?`<p class="fhint" style="margin-top:-6px">Стартовое место из путеводителя. Адрес и описание стоит проверить на месте${d.geo==='osm'?'; точка на карте уточнена по OpenStreetMap':d.geo==='approx'?'; точка на карте пока примерная':''}.</p>`:''}
    <div class="field"><label>Название</label><input class="inp" id="pl-name" value="${esc(d.name)}" placeholder="Кофейня на углу"></div>
    <div class="field"><label>Что это</label><div class="pick" id="pl-cat">${PL_CATS.map(([k,n,i])=>`<button data-v="${k}" class="${d.cat===k?'on':''}">${i} ${n}</button>`).join('')}</div></div>
    <div class="field"><label>Адрес</label><div class="fquick"><input class="inp" id="pl-addr" value="${esc(d.addr)}" placeholder="ул. Палиашвили, 24"><button class="btn ghost" id="pl-find">${m.finding?'…':'Найти'}</button></div>
      ${m.found?`<div class="pl-found">${m.found.length?m.found.map((r,i)=>`<button data-plf="${i}">📍 ${esc(r.label)}</button>`).join(''):'<small class="fhint">Не нашлось. Поставьте точку на карте.</small>'}</div>`:''}
      <p class="fhint" style="margin:6px 0 0">${has?`Точка: ${(+d.lat).toFixed(4)}, ${(+d.lng).toFixed(4)}${S.placecfg.home?` · ${plKmStr(plWalkKm(S.placecfg.home,d))} от дома`:''}. `:''}<button class="pl-lnk" id="pl-pick">${has?'Поправить на карте':'Поставить на карте'}</button></p></div>
    <div class="field"><label>Заметка</label><textarea class="inp" id="pl-note" rows="2" placeholder="Флэт уайт отличный, столики на улице">${esc(d.note)}</textarea></div>
    <div class="field"><label>Ссылка (Instagram, Google Maps, Wolt)</label><input class="inp" id="pl-link" value="${esc(d.link)}" placeholder="https://" inputmode="url"></div>
    <div class="pl-mlinks">${d.link?`<a href="${esc(d.link)}" target="_blank" rel="noopener">Ссылка ↗</a>`:''}${has?`<a href="${plYa(d.lat,d.lng)}" target="_blank" rel="noopener">Яндекс Карты ↗</a><a href="${gm}" target="_blank" rel="noopener">Google: маршрут пешком ↗</a>${S.placecfg.home?`<a href="${plYaRoute(S.placecfg.home,d)}" target="_blank" rel="noopener">Яндекс: маршрут от дома ↗</a>`:''}`:''}
      ${!m.isNew?['7','4'].map(w=>d.been[w]?`<span>${badgeEl(w)} был${fem(w)?'а':''} ${new Date(d.been[w]).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</span>`:'').join(''):''}</div>
    <div class="actions">${ro?'<button class="btn" data-close>Закрыть</button>':`${m.isNew?'':'<button class="del" id="pl-del">Удалить</button>'}<button class="btn ghost" data-close>Отмена</button><button class="btn" id="pl-save">Сохранить</button>`}</div>
  </div></div>`;
}
function plWalkModal(m){
  const w = m.draft, c = plWalkCalc(w), H = S.placecfg.home, ro = !m.isNew && w.by!=='both' && w.by!==S.me;
  const pool = S.places.filter(p=>!w.stops.includes(p.id)).sort((a,b)=>{ const last=c.stops[c.stops.length-1]||H; return last ? plKm(last,a)-plKm(last,b) : 0; });
  return `<div class="scrim" data-close><div class="sheet" role="dialog"><h2>${m.isNew?'Новая прогулка':esc(w.title)}</h2>
    <div class="field"><label>Название</label><input class="inp" id="pw-title" value="${esc(w.title)}" placeholder="Кофе и парк Ваке"></div>
    ${H?`<label class="fhint" style="display:flex;gap:8px;align-items:center;margin-top:0"><input type="checkbox" id="pw-home" ${w.home?'checked':''}> Из дома и обратно домой</label>`:''}
    <div class="field"><label>Маршрут по порядку</label>
      ${c.stops.length?`<div class="pw-stops">${c.stops.map((p,i)=>`<div class="pw-stop"><b>${i+1}</b><span>${PL_CAT[p.cat]?.[2]||'📍'} ${esc(p.name)}</span>
        <input class="inp" type="number" min="0" step="5" data-pwstay="${p.id}" value="${w.stay?.[p.id] ?? S.placecfg.stay[p.cat] ?? 20}" title="Минут на месте"><small>мин</small>
        <button data-pwup="${i}" ${i?'':'disabled'} title="Выше">↑</button><button data-pwrm="${i}" title="Убрать">✕</button></div>`).join('')}</div>
        ${c.stops.length>2?'<button class="pl-lnk" id="pw-opt">Выстроить по порядку: ближайшая следующая</button>':''}`:'<p class="fhint" style="margin:0">Добавьте точки ниже.</p>'}
    </div>
    <div class="field"><label>Добавить точку${c.stops.length?' (ближайшие сверху)':''}</label><div class="pick pw-pool">${pool.slice(0,14).map(p=>`<button data-pwadd="${p.id}">${PL_CAT[p.cat]?.[2]||'📍'} ${esc(p.name)}</button>`).join('')}</div></div>
    <div class="pw-sum"><b>~${fmtMin(c.total)||'0 мин'}</b><small>${plKmStr(c.km)} пешком (${fmtMin(c.walkMin)||'0 мин'}) + на местах ${fmtMin(c.stayMin)||'0 мин'}. Расстояние примерное: прямая × 1,3.</small></div>
    <div class="actions">${ro?'<button class="btn" data-close>Закрыть</button>':`${m.isNew?'':'<button class="del" id="pw-del">Удалить</button>'}<button class="btn ghost" id="pw-task">Сохранить и на доску</button><button class="btn" id="pw-save">Сохранить</button>`}</div>
  </div></div>`;
}
/* прогулка → общая задача на доске «На этой неделе» */
function plToTask(w){
  const c = plWalkCalc(w);
  if(!c.stops.length){ toast('В прогулке нет точек'); return; }
  const old = w.taskId && S.tasks.find(t=>t.id===w.taskId);
  if(old && old.col!=='done'){ toast('Эта прогулка уже на доске'); return; }
  const t = {id:uid(), title:'Прогулка: '+w.title, owner:'both', col:'week', minutes:c.total, date:'',
    note:`${plKmStr(c.km)} пешком, ~${fmtMin(c.total)} вместе с остановками.${w.home&&S.placecfg.home?' Из дома и обратно.':''}`,
    sub:c.stops.map(p=>({t:`${PL_CAT[p.cat]?.[2]||'📍'} ${p.name}`, d:false})), checks:{'7':false,'4':false}, createdAt:Date.now(), by:S.me, walk:w.id};
  S.tasks.push(t); w.taskId = t.id;
  notify(`${pname(S.me)} добавил${fem(S.me)?'а':''} прогулку «${w.title}» на доску`, other(S.me));
  save(); toast('Прогулка на доске, в «На этой неделе» 🚶');
}

/* ---------- обработчики ---------- */
function bindPlaces(){
  const q = s=>$root.querySelector(s), all = (s,fn)=>$root.querySelectorAll(s).forEach(fn);
  all('[data-plbase]', b=>b.onclick=()=>{ plSetBase(b.dataset.plbase); all('[data-plbase]', x=>x.classList.toggle('on', x===b)); });
  all('[data-pltab]', b=>b.onclick=()=>{ UI.pltab=b.dataset.pltab; UI.plfit=null; render(); });
  all('[data-plcat]', b=>b.onclick=()=>{ UI.plcat=b.dataset.plcat; render(); });
  all('[data-plst]', b=>b.onclick=()=>{ UI.plst=b.dataset.plst; render(); });
  all('[data-plnew]', b=>b.onclick=()=>plNew());
  all('[data-plcard]', el=>el.onclick=e=>{ if(e.target.closest('[data-plmark],[data-pr-open]')) return; const p=plFind(el.dataset.plcard);
    if(UI.plsel===p.id) plOpen(p.id); else plFly(p); });
  all('[data-plmark]', b=>b.onclick=()=>{ const p=plFind(b.dataset.plmark);
    // по кругу: ничего → хочу → был → ничего
    if(p.been[S.me]) plMark(p,'been'); else if(p.want[S.me]) plMark(p,'been'); else plMark(p,'want');
    render(); });
  all('[data-plrnd]', b=>b.onclick=()=>{
    const fresh = S.places.filter(p=>p.cat==='coffee' && !p.been['7'] && !p.been['4']);
    const pool = fresh.filter(p=>p.want['7']||p.want['4']).length ? fresh.filter(p=>p.want['7']||p.want['4']) : fresh.length ? fresh : S.places.filter(p=>p.cat==='coffee');
    if(!pool.length){ toast('Пока нет кофеен. Добавьте первую'); return; }
    const p = pool[Math.floor(Math.random()*pool.length)];
    UI.plcat='all'; UI.plst='all'; render(); plFly(p); toast(`Сегодня: ${p.name} ☕`); });
  all('[data-plwnew]', b=>b.onclick=()=>{ UI.modal={type:'pwalk', isNew:true, draft:{id:'pw-'+uid(), title:'', stops:[], home:!!S.placecfg.home, stay:{}, by:'both', at:Date.now()}}; render(); });
  all('[data-plwsel]', el=>el.onclick=e=>{ if(e.target.closest('button')) return; UI.plwalk = UI.plwalk===el.dataset.plwsel ? null : el.dataset.plwsel; UI.plfit=null; render(); });
  all('[data-plwedit]', b=>b.onclick=()=>{ UI.modal={type:'pwalk', draft:JSON.parse(JSON.stringify(S.walks.find(w=>w.id===b.dataset.plwedit)))}; render(); });
  all('[data-pltask]', b=>b.onclick=()=>{ plToTask(S.walks.find(w=>w.id===b.dataset.pltask)); render(); });

  const m = UI.modal; if(!m) return;
  if(m.type==='place') bindPlaceModal(m, q, all);
  if(m.type==='pwalk') bindWalkModal(m, q, all);
}
function bindPlaceModal(m, q, all){
  const d = m.draft;
  if(!m.isNew && !plCanEdit(d)){ all('.sheet input,.sheet textarea,.sheet .pick button,#pl-find,#pl-pick', e=>e.disabled=true); return; }
  const read = () => { d.name=q('#pl-name').value; d.addr=q('#pl-addr').value; d.note=q('#pl-note').value; d.link=q('#pl-link').value.trim(); };
  const find = async () => { read(); const s=(d.addr||d.name).trim(); if(!s){ q('#pl-addr').focus(); return; }
    m.finding=true; render();
    let r = await plGeocode(s+', Tbilisi'); if(!r.length && d.addr && d.name) r = await plGeocode(d.name+', Tbilisi');
    if(UI.modal!==m) return; m.finding=false; m.found=r; render(); };
  q('#pl-find').onclick=find;
  q('#pl-addr').onkeydown=e=>{ if(e.key==='Enter') find(); };
  all('[data-plf]', b=>b.onclick=()=>{ read(); const r=m.found[+b.dataset.plf]; d.lat=r.lat; d.lng=r.lng; d.geo='osm'; if(!d.name.trim() && r.name) d.name=r.name; m.found=null; render(); });
  all('#pl-cat button', b=>b.onclick=()=>{ read(); d.cat=b.dataset.v; render(); });
  q('#pl-pick').onclick=()=>{ read(); if(!PL.map){ toast('Карта ещё не загрузилась'); return; }
    PL.pick={modal:m}; UI.modal=null; render(); PL.map.setView([d.lat,d.lng], Math.max(PL.map.getZoom(),16)); toast('Нажмите на карте, где это место'); };
  q('#pl-save').onclick=()=>{ read(); d.name=d.name.trim(); if(!d.name){ q('#pl-name').focus(); return; }
    if(m.isNew && !d.geo){ toast('Найдите адрес или поставьте точку на карте'); return; }
    const i=S.places.findIndex(x=>x.id===d.id);
    if(i>=0){ const cur=S.places[i]; d.been=cur.been; d.want=cur.want; d.rate=cur.rate; if(d.lat!==cur.lat||d.lng!==cur.lng||d.addr!==cur.addr) d.seed=false; S.places[i]=d; }   // чужие отметки не трогаем
    else { S.places.push(d); notify(`${pname(S.me)} добавил${fem(S.me)?'а':''} место «${d.name}» на карту`, other(S.me)); }
    UI.modal=null; UI.plsel=d.id; save(); render(); toast(i>=0?'Сохранено':'Место на карте 📍'); };
  q('#pl-del') && (q('#pl-del').onclick=()=>{ if(!confirm(`Удалить «${d.name}»?`)) return;
    S.places=S.places.filter(x=>x.id!==d.id); S.walks.forEach(w=>{ w.stops=w.stops.filter(s=>s!==d.id); }); UI.modal=null; save(); render(); });
}
function bindWalkModal(m, q, all){
  const w = m.draft;
  if(!m.isNew && w.by!=='both' && w.by!==S.me){ all('.sheet input,.sheet .pick button,.pw-stop button', e=>e.disabled=true); return; }
  const read = () => { w.title=q('#pw-title').value; if(q('#pw-home')) w.home=q('#pw-home').checked;
    all('[data-pwstay]', i=>{ w.stay=w.stay||{}; const p=plFind(i.dataset.pwstay); if(i.value!=='' && +i.value!==S.placecfg.stay[p?.cat]) w.stay[i.dataset.pwstay]=+i.value; else delete w.stay[i.dataset.pwstay]; }); };
  q('#pw-home') && (q('#pw-home').onchange=()=>{ read(); render(); });
  all('[data-pwstay]', i=>i.onchange=()=>{ read(); render(); });
  all('[data-pwadd]', b=>b.onclick=()=>{ read(); w.stops.push(b.dataset.pwadd); render(); });
  all('[data-pwrm]', b=>b.onclick=()=>{ read(); w.stops.splice(+b.dataset.pwrm,1); render(); });
  all('[data-pwup]', b=>b.onclick=()=>{ read(); const i=+b.dataset.pwup; [w.stops[i-1],w.stops[i]]=[w.stops[i],w.stops[i-1]]; render(); });
  q('#pw-opt') && (q('#pw-opt').onclick=()=>{ read(); w.stops=plOrder(w.stops, w.home); render(); });
  const store = () => { read(); w.title=w.title.trim() || (plWalkCalc(w).stops.map(p=>p.name).slice(0,2).join(' и ') || 'Прогулка');
    if(!w.stops.length){ toast('Добавьте хотя бы одну точку'); return false; }
    const i=S.walks.findIndex(x=>x.id===w.id); if(i>=0) S.walks[i]=w; else S.walks.push(w);
    UI.modal=null; UI.pltab='walks'; UI.plwalk=w.id; UI.plfit=null; save(); return true; };
  q('#pw-save').onclick=()=>{ if(store()){ render(); toast('Прогулка сохранена'); } };
  q('#pw-task').onclick=()=>{ if(store()){ plToTask(S.walks.find(x=>x.id===w.id)); render(); } };
  q('#pw-del') && (q('#pw-del').onclick=()=>{ if(!confirm(`Удалить прогулку «${w.title}»?`)) return; S.walks=S.walks.filter(x=>x.id!==w.id); UI.modal=null; UI.plwalk=null; save(); render(); });
}

/* ---------- настройки раздела ---------- */
function plSettings(){
  const c = S.placecfg;
  return `<h3>Места</h3>
    ${swRow('Скорость шага', segBtns('spsp', [[3.5,'Не спеша'],[4.5,'Обычно'],[5.5,'Бодро']], c.speed))}
    <p class="fhint">От неё считается время пешком в прогулках и «мин от дома».</p>
    <h3>Сколько минут проводим на месте</h3>
    <div class="pl-stays">${PL_CATS.map(([k,n,i])=>`<label>${i} ${n}<input class="inp" type="number" min="0" step="5" data-spst="${k}" value="${c.stay[k]}"></label>`).join('')}</div>
    <p class="fhint">В каждой прогулке время на точке можно поменять отдельно.</p>
    <h3>Дом</h3>
    <div class="field"><label>Базовый адрес</label><div class="fquick"><input class="inp" id="sp-home-addr" value="${esc(c.homeAddr||'')}" placeholder="74b Giorgi Shatberashvili St"><button class="btn ghost" id="sp-home-find">Найти</button></div></div>
    <p class="fhint">${c.home?'Дом стоит на карте. Можно сменить адрес выше или нажать на 🏠 на карте и перенести его.':'Адрес пока не найден. Впишите его, или нажмите на карте у дома и выберите «🏠 Тут наш дом».'}</p>
    ${c.home?`<button class="btn ghost" id="sp-home-del">Убрать дом с карты</button>`:''}`;
}
function bindPlaceSettings(){
  const q = s=>$root.querySelector(s);
  $root.querySelectorAll('[data-spsp]').forEach(b=>b.onclick=()=>{ S.placecfg.speed=+b.dataset.spsp; save(); render(); });
  $root.querySelectorAll('[data-spst]').forEach(i=>i.onchange=()=>{ S.placecfg.stay[i.dataset.spst]=Math.max(0,+i.value||0); save(); });
  q('#sp-home-find') && (q('#sp-home-find').onclick=async ()=>{ const v=q('#sp-home-addr').value.trim(); if(!v) return;
    const b=q('#sp-home-find'); b.textContent='…'; const ok = await plSetHome(/tbilisi|тбилиси/i.test(v)?v:v+', Tbilisi'); if(!ok){ b.textContent='Найти'; return; } UI.modal.page='places'; render(); });
  q('#sp-home-del') && (q('#sp-home-del').onclick=()=>{ S.placecfg.home=null; save(); render(); });
}

/* ---------- встраивание ---------- */
(function(){
  if(!SECTIONS.some(s=>s[0]==='places')) SECTIONS.splice(1, 0, ['places','📍','Места']);
  if(!SET_PAGES.some(s=>s[0]==='places')) SET_PAGES.splice(2, 0, ['places','Места']);
  const _soon = soonView, _modal = modalView, _bind = bind, _render = render, _sp = settingsPage, _bs = bindSettings;
  soonView = k => k==='places' ? placesView() : _soon(k);
  modalView = () => { const t = UI.modal?.type; return t==='place' ? plModal(UI.modal) : t==='pwalk' ? plWalkModal(UI.modal) : _modal(); };
  bind = () => { _bind(); if(UI.section==='places' || ['place','pwalk'].includes(UI.modal?.type)) bindPlaces(); };
  settingsPage = p => p==='places' ? plSettings() : _sp(p);
  bindSettings = () => { _bs(); if(UI.modal?.type==='settings' && UI.modal.page==='places') bindPlaceSettings(); };
  render = () => { _render(); $root.querySelector('.nav [data-sec="places"] small')?.remove(); };
})();

document.head.insertAdjacentHTML('beforeend', `<style>
.pl-bases button{padding:5px 10px;font-size:13px}.pl-ya{display:block;margin-top:8px;font-size:12px;color:var(--c7)}
.pl-stat{font-size:13px;color:var(--muted);padding:0 4px}
.pl-wrap{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;align-items:start}
.pl-mapcol{position:sticky;top:12px}
.pl-map{height:calc(100vh - 190px);min-height:380px;border-radius:var(--r);box-shadow:var(--shadow);background:var(--bg2);overflow:hidden;z-index:0}
.pl-map.dark:not(.sat) .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.9) contrast(.9)}
.pl-map.picking{cursor:crosshair;outline:3px solid var(--c7);outline-offset:-3px}
.pl-map.picking .leaflet-grab{cursor:crosshair}
.pl-side{min-width:0}
.pl-cats .seg{overflow-x:auto;max-width:100%}.pl-cats .seg button,.pl-side .seg button{white-space:nowrap;padding:7px 10px}
.pl-list{display:flex;flex-direction:column;gap:8px}
.pl-card{display:flex;gap:10px;align-items:flex-start;background:var(--card);border-radius:14px;box-shadow:var(--shadow);padding:10px 12px;cursor:pointer;border:2px solid transparent}
.pl-card.sel{border-color:var(--c7)}
.pl-ci{font-size:22px;line-height:1;padding-top:2px}
.pl-cb{flex:1;min-width:0}.pl-cb b{display:block;line-height:1.3}.pl-cb small{color:var(--muted);font-size:12px}
.pl-cb p{margin:4px 0 0;font-size:13px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pl-chk{background:var(--waitbg);color:var(--warn);border-radius:6px;padding:0 5px}
.pl-marks{display:flex;flex-direction:column;gap:4px}
.pl-m{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);background:var(--bg);font-size:12px;font-weight:700;color:var(--soft)}
.pl-m.want{color:var(--warn);border-color:var(--warn)}.pl-m.been{border-color:transparent}
.pl-m:disabled{opacity:.75;cursor:default}
.pl-wact{display:flex;gap:6px;margin-top:8px;align-items:center}
.pl-ic{background:none;border:none}
.pl-pin{width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:var(--card);border:2.5px solid var(--soft);display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.pl-pin>*,.pl-pin{font-size:16px}.pl-pin{line-height:1}
.pl-pin{color:var(--text)}.pl-pin b{font-size:14px}
.pl-pin.want{border-color:var(--warn)}.pl-pin.half{border-color:var(--c4)}.pl-pin.been{border-color:var(--ok)}
.pl-pin.sel{border-color:var(--c7);border-width:3.5px;transform:rotate(-45deg) scale(1.15)}
.pl-pin.home{border-color:var(--c7);background:var(--c7soft)}
.pl-pin>*{transform:rotate(45deg);font-style:normal}
.leaflet-container{font:inherit}
.leaflet-popup-content-wrapper{border-radius:14px;background:var(--card);color:var(--text)}.leaflet-popup-tip{background:var(--card)}
.leaflet-popup-content{margin:10px 12px}
.pl-pop b{display:block;font-size:14px}.pl-pop small{color:var(--muted);font-size:12px}.pl-pop p{margin:6px 0 0;font-size:12px;color:var(--muted)}
.pl-pacts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.pl-pbtn{padding:6px 10px;border-radius:9px;background:var(--bg);border:1.5px solid var(--line);font-size:12px;color:var(--text);cursor:pointer}
.pl-pbtn.on{border-color:var(--c7);background:var(--c7soft)}
.pl-found{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.pl-found button{text-align:left;padding:8px 10px;border-radius:10px;background:var(--bg);border:1.5px solid var(--line);font-size:13px}
.pl-lnk{color:var(--c7);text-decoration:underline;font-size:13px;padding:0}
.pl-mlinks{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:13px}.pl-mlinks a{color:var(--c7)}.pl-mlinks span{display:inline-flex;gap:4px;align-items:center;color:var(--muted)}
.pw-stops{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}
.pw-stop{display:flex;align-items:center;gap:6px;background:var(--bg);border-radius:10px;padding:6px 8px}
.pw-stop>b{width:22px;height:22px;border-radius:50%;background:var(--c7);color:#fff;display:grid;place-items:center;font-size:12px;flex:none}
.pw-stop span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}
.pw-stop .inp{width:62px;padding:5px 6px;text-align:right}.pw-stop small{color:var(--muted);font-size:12px}
.pw-stop button{width:26px;height:26px;border-radius:8px;color:var(--muted)}.pw-stop button:disabled{opacity:.3}
.pw-pool button{font-size:13px;padding:6px 10px}
.pw-sum{background:var(--bg2);border-radius:12px;padding:10px 12px}.pw-sum b{display:block;font-size:18px}.pw-sum small{color:var(--muted);font-size:12px}
.pl-stays{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pl-stays label{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:4px}
@media (max-width:820px){
  .pl-wrap{grid-template-columns:1fr}
  .pl-mapcol{position:static}
  .pl-map{height:52vh;min-height:300px}
  .pl-stays{grid-template-columns:1fr 1fr}
}
</style>`);
