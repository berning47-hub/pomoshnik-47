/* Прогулки → личная активность. BRouter/OSM без ключа и биллинга.
   Дорожный путь и высоты живут только в текущем диалоге. */
S.activities = Array.isArray(S.activities) ? S.activities : [];
if(typeof ARR!=='undefined') ARR.activity={get:()=>S.activities,set:a=>{S.activities=a;}};
function waNumbers(d){
  const km=+d.km||0, min=+d.minutes||0, up=+d.up||0, stride=+d.stride||0, kg=+d.kg||0;
  const speed=min>0?km/min*60:0;
  // MET для ровной поверхности по Compendium 2024, отдельная грубая поправка на подъём.
  const met=speed<3.2?2.3:speed<4?2.8:speed<4.5?3:speed<5.6?3.8:speed<6.4?4.8:5.5;
  const active=kg>0&&min>0?Math.round(Math.max(0,met-1)*kg*min/60+kg*9.81*up/(4184*.25)):null;
  return {steps:stride>0?Math.round(km*1000/stride):null,active};
}
function waOpen(id){
  const w=S.walks.find(x=>x.id===id); if(!w) return;
  const c=plWalkCalc(w), p=S.bodyp?.[S.me]||{}, date=localISO();
  const old=S.activities.find(a=>a.walkId===id&&a.by===S.me&&a.date===date);
  UI.modal={type:'walkactivity',walkId:id,who:S.me,route:WA_ROUTES.get(waWalkKey(w))?.route,draft:old?{...old}:{date,km:+c.km.toFixed(2),minutes:c.walkMin,up:c.up??'',down:c.down??'',stride:+p.h?+(+p.h*.00413).toFixed(2):.70,kg:+p.w||'',source:c.road?'brouter-plan':'estimate'},stay:c.stayMin};
  render();
}
function waField(id,label,value,extra=''){
  return `<div class="field"><label for="wa-${id}">${label}</label><input class="inp" id="wa-${id}" value="${esc(value)}" ${extra}></div>`;
}
function waSummary(d){
  const n=waNumbers(d);
  return `<b>≈ ${n.steps===null?'—':n.steps.toLocaleString('ru-RU')} шагов · ${n.active===null?'укажите вес':`≈ ${n.active} активных ккал`}</b><small>Оценка по длине шага и весу. Не данные шагомера. Калории только за движение, без остановок.</small>`;
}
function waModal(m){
  const w=S.walks.find(x=>x.id===m.walkId), d=m.draft;
  if(!w) return '<div class="scrim" data-close><div class="sheet"><h2>Прогулка удалена</h2></div></div>';
  return `<div class="scrim" data-close><div class="sheet wide"><h2>${esc(w.title)}</h2>
    <p class="fhint">Прогноз и моя активность · ${esc(pname(m.who))}. Время остановок: ${fmtMin(m.stay)||'0 мин'} отдельно.</p>
    <div class="wa-tools"><button class="btn ghost" id="wa-route">${m.busy?'Рассчитываем…':'Пеший маршрут и высоты'}</button></div>
    <p class="fhint">По кнопке координаты точек, включая дом при его выборе, отправляются открытому сервису BRouter. Без регистрации, ключа и оплаты; нужна сеть.</p>
    ${m.error?`<p class="fhint" role="alert">${esc(m.error)}</p>`:''}
    ${m.route?`<div id="wa-map" class="wa-map"></div><p class="fhint">BRouter / OpenStreetMap: ${plKmStr(m.route.km)}. Прогноз с подъёмом: ${fmtMin(m.route.adjusted)} + остановки ${fmtMin(m.stay)||'0 мин'}. ${m.route.up===null?'Высоты недоступны.':'↑ '+m.route.up+' м · ↓ '+m.route.down+' м'}</p><div class="wa-profile">${waProfile(m.route.samples)}</div>${m.route.warnings.map(t=>`<p class="fhint">${esc(t)}</p>`).join('')}`:''}
    <p class="fhint">${d.source==='estimate'?'Пока без дорожного маршрута: прямая × 1,3, рельеф неизвестен.':d.source==='manual'?'Значения скорректированы вручную.':d.source==='google-plan'?'Сохранённая прежняя оценка Google.':'План по BRouter / OpenStreetMap, фактический путь может отличаться.'} После прогулки уточните расстояние и время движения.</p>
    <div class="wa-fields">${waField('date','Дата',d.date,'type="date" required')}${waField('km','Пешком, км',d.km,'type="number" min="0.01" max="200" step="0.01" inputmode="decimal"')}${waField('minutes','В движении, мин',d.minutes,'type="number" min="1" max="2880" step="1" inputmode="numeric"')}${waField('up','Подъём, м (если известен)',d.up,'type="number" min="0" max="10000" step="1" inputmode="numeric"')}${waField('down','Спуск, м (если известен)',d.down,'type="number" min="0" max="10000" step="1" inputmode="numeric"')}${waField('stride','Длина шага, м',d.stride,'type="number" min="0.2" max="1.5" step="0.01" inputmode="decimal"')}${waField('kg','Мой вес, кг',d.kg,'type="number" min="20" max="350" step="0.1" inputmode="decimal"')}</div>
    <div class="pw-sum" id="wa-summary">${waSummary(d)}</div>
    <details class="fhint"><summary>Как считаем</summary><p>Начальная длина шага ≈ рост × 0,413; без роста — условные 70 см. Уточните её под себя. Время: расстояние / скорость из настроек + 1 мин на 10 м подъёма. Расчёт учитывает выбранную скорость и набор высоты; крутые спуски, покрытие, погода и усталость отдельно не моделируются.</p><p>Калории: (MET − 1) × вес × часы движения + грубая поправка на подъём (энергия подъёма при условном КПД 25%). Это приближённая модель, особенно на лестницах и крутых склонах. Не измерение расхода организма.</p><a href="https://pacompendium.com/walking/" target="_blank" rel="noopener">MET ходьбы: Compendium 2024</a></details>
    <div class="actions"><button class="btn ghost" data-close>Закрыть</button><button class="btn" id="wa-save">${d.id?'Обновить мою активность':'Я прошёл'+(fem(m.who)?'а':'')+' — в активность'}</button></div>
  </div></div>`;
}
function waProfile(samples){
  if(!samples?.length) return '';
  const low=Math.min(...samples), high=Math.max(...samples), range=high-low||1;
  // CSS-полосы высоты, каждая соответствует равному отрезку пути.
  return `<div class="wa-bars" aria-label="Профиль высот: от ${Math.round(low)} до ${Math.round(high)} метров">${samples.map(h=>`<i style="height:${10+(h-low)/range*90}%" title="${Math.round(h)} м"></i>`).join('')}</div><small>Высоты по пути: ${Math.round(low)}–${Math.round(high)} м</small>`;
}
// Чистый разбор GeoJSON отделён от сети для проверок отказов и отсутствующих высот.
function waParseRoute(data){
  const f=data?.features?.find(f=>f.geometry?.type==='LineString');
  const coords=f?.geometry?.coordinates;
  if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)) throw Error('Нет подходящего пешего маршрута. Измените точки.');
  const path=coords.map(p=>({lat:p[1],lng:p[0]})), distances=[0];
  for(let i=1;i<path.length;i++)distances.push(distances[i-1]+plKm(path[i-1],path[i]));
  const km=distances[distances.length-1];if(!(km>0))throw Error('Некорректная длина маршрута');
  const hasHeights=coords.every(p=>Number.isFinite(p[2])&&p[2]>-1000);
  let up=null,down=null,samples=[];
  if(hasHeights){
    let anchor=coords[0][2], climb=0,fall=0;
    for(const p of coords.slice(1)){const delta=p[2]-anchor;if(Math.abs(delta)>=3){if(delta>0)climb+=delta;else fall-=delta;anchor=p[2];}}
    up=Math.round(climb);down=Math.round(fall);
    // Равномерно по расстоянию, чтобы ширина столбиков отражала длину пути.
    let j=1;const count=Math.min(128,Math.max(2,Math.ceil(km*1000/30)));
    for(let i=0;i<count;i++){const d=km*i/(count-1);while(j<distances.length-1&&distances[j]<d)j++;
      const span=distances[j]-distances[j-1],t=span?(d-distances[j-1])/span:0;samples.push(coords[j-1][2]+(coords[j][2]-coords[j-1][2])*t);}
  }
  const minutes=Math.ceil(km/(+S.placecfg.speed||4.5)*60);
  return {path,km,minutes,adjusted:Math.ceil(minutes+(up||0)/10),up,down,samples,warnings:[...(hasHeights?[]:['У маршрута нет высот: подъёмы в прогнозе не учтены.']),'Оценка по открытой карте: доступность троп, лестницы и закрытые проходы проверяйте на месте. Крутые спуски отдельно не моделируются.']};
}
const WA_ROUTES=new Map();
function waWalkKey(w){const c=waOriginalCalc(w);return JSON.stringify([c.pts.map(p=>[p.lat,p.lng]),+S.placecfg.speed||4.5]);}
async function waFetchRoute(w,signal){
  const c=waOriginalCalc(w),params=new URLSearchParams({lonlats:c.pts.map(p=>p.lng+','+p.lat).join('|'),profile:'hiking-mountain',alternativeidx:'0',format:'geojson'});
  const response=await fetch('https://brouter.de/brouter?'+params,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Сервис временно недоступен');return waParseRoute(await response.json());
}
function waRouteLine(target,path){
  const points=path.map(p=>[p.lat,p.lng]);
  const options={dashArray:'10 8',lineCap:'round',lineJoin:'round',opacity:1,interactive:false};
  L.polyline(points,{...options,color:getComputedStyle(document.documentElement).getPropertyValue('--route-outline').trim(),weight:7}).addTo(target);
  return L.polyline(points,{...options,color:getComputedStyle(document.documentElement).getPropertyValue('--route-color').trim(),weight:4}).addTo(target);
}
const waOriginalCalc=plWalkCalc;
plWalkCalc=w=>{
  const c=waOriginalCalc(w),r=WA_ROUTES.get(waWalkKey(w))?.route;
  return r?{...c,km:r.km,walkMin:r.adjusted,total:r.adjusted+c.stayMin,up:r.up,down:r.down,road:true}:c;
};
function waRouteStatus(){
  const w=UI.pltab==='walks'&&S.walks.find(w=>w.id===UI.plwalk);if(!w)return '';
  if(waOriginalCalc(w).pts.length<2)return '<p class="fhint">Добавьте вторую точку или дом, чтобы построить путь.</p>';
  const entry=WA_ROUTES.get(waWalkKey(w));
  if(entry?.route)return `<p class="fhint" role="status">Пешком по улицам и тропам · ${plKmStr(entry.route.km)} · ≈ ${fmtMin(entry.route.adjusted)} в движении. Данные BRouter / OpenStreetMap.</p>`;
  if(entry?.error)return '<p class="fhint" role="status">Маршрут не загрузился. <button class="fbtn" data-wa-retry>Повторить</button> Расстояние в карточке пока предварительное.</p>';
  return '<p class="fhint" role="status">Строим пеший путь по улицам и тропам… Координаты точек передаются BRouter.</p>';
}
function waDrawWalk(w,c){
  const key=waWalkKey(w),entry=WA_ROUTES.get(key);
  if(entry?.route){
    const line=waRouteLine(PL.layer,entry.route.path);
    if(UI.plfit!==key){UI.plfit=key;PL.map.fitBounds(line.getBounds(),{padding:[24,24]});}return;
  }
  // Прямую между точками не рисуем даже при ошибке сети.
  if(entry)return;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  const pending={};WA_ROUTES.set(key,pending);
  waFetchRoute(w,controller.signal).then(route=>{WA_ROUTES.set(key,{route});}).catch(()=>{WA_ROUTES.set(key,{error:true});}).finally(()=>{
    clearTimeout(timer);if(UI.section==='places'&&UI.plwalk===w.id&&!UI.modal)render();
  });
}
async function waRoute(m){
  if(m.busy)return;
  const w=S.walks.find(x=>x.id===m.walkId),c=w&&plWalkCalc(w);
  if(!c||c.pts.length<2){m.error='Нужны хотя бы две точки пути: добавьте ещё место или дом.';render();return;}
  m.busy=true;m.error='';render();
  const controller=new AbortController();m.controller=controller;
  const timer=setTimeout(()=>controller.abort(),25000);
  try{
    const result=await waFetchRoute(w,controller.signal);
    WA_ROUTES.set(waWalkKey(w),{route:result});
    if(UI.modal!==m||S.me!==m.who)return;
    m.route=result;Object.assign(m.draft,{km:+result.km.toFixed(2),minutes:result.adjusted,up:result.up??'',down:result.down??'',source:'brouter-plan'});
  }catch(e){if(UI.modal===m)m.error=e.name==='AbortError'?'Сервис не ответил за 25 секунд. Попробуйте позже или заполните данные вручную.':'Не удалось построить пеший маршрут. Проверьте сеть или измените точки. Данные можно заполнить вручную.';}
  finally{clearTimeout(timer);if(UI.modal===m){m.busy=false;delete m.controller;render();}}
}
function waMount(m){
  const el=$root.querySelector('#wa-map');if(!el||!m.route)return;
  if(!window.L){plLoadLeaflet(()=>{if(UI.modal===m)waMount(m);});return;}
  const map=L.map(el).setView(m.route.path[0],14);
  const bases={};
  for(const [key,title,url] of PL_BASES){
    const tiles=L.tileLayer(url,{maxZoom:19,attribution:'Tiles &copy; Esri, HERE, Garmin; &copy; OpenStreetMap contributors'});
    bases[title]=key==='hybrid'?L.layerGroup([tiles,L.tileLayer(ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19})]):tiles;
    if(key===plBase())bases[title].addTo(map);
  }
  L.control.layers(bases).addTo(map);
  const line=waRouteLine(map,m.route.path);
  map.attributionControl.addAttribution('<a href="https://brouter.de/" target="_blank" rel="noopener">BRouter</a> / &copy; OpenStreetMap contributors');
  map.fitBounds(line.getBounds(),{padding:[20,20]});
  // Освобождаем обработчики карты при закрытии и перерисовке диалога.
  m.map=map;
}
function waActivityView(){
  const who=UI.wawho||S.me, rows=S.activities.filter(a=>a.by===who).sort((a,b)=>b.date.localeCompare(a.date));
  const today=rows.filter(a=>a.date===localISO()),steps=today.reduce((s,a)=>s+(a.steps||0),0),cal=today.reduce((s,a)=>s+(a.active||0),0);
  return `<div class="filters"><div class="seg">${['7','4'].map(w=>`<button data-wa-who="${w}" class="${who===w?'on':''}">${esc(pname(w))}</button>`).join('')}</div></div><div class="pw-sum"><b>Сегодня: ≈ ${steps.toLocaleString('ru-RU')} шагов · ≈ ${cal} активных ккал</b><small>Только записанные прогулки. У записей без веса калории не рассчитаны.</small></div><p class="fhint">Добавляйте завершённую прогулку в «Места → Прогулки → Маршрут и активность». Каждый сохраняет свою запись.</p>${rows.length?rows.map(a=>`<article class="fstore"><b>${esc(a.title)}</b><p class="fhint">${esc(a.date)} · ${plKmStr(a.km)} · ${fmtMin(a.minutes)} в движении<br>≈ ${a.steps.toLocaleString('ru-RU')} шагов · ${a.active===null?'калории не рассчитаны':'≈ '+a.active+' активных ккал'}<br>↑ ${a.up===null?'неизвестно':a.up+' м'} · ↓ ${a.down===null?'неизвестно':a.down+' м'} · ${a.source==='estimate'?'оценка по прямой':a.source==='manual'?'ручные данные':a.source==='google-plan'?'прежняя оценка Google':'оценка BRouter / OSM'}</p>${who===S.me?`<button class="fbtn" data-wa-delete="${esc(a.id)}">Удалить мою запись</button>`:'<small>Только просмотр</small>'}</article>`).join(''):'<div class="empty">Здесь появятся завершённые прогулки.</div>'}`;
}
(function(){
  const walks=plWalks, modal=modalView, binding=bind;
  plWalks=()=>walks().replace(/(<button class="fbtn" data-plwedit="([^"]+)">[^<]*<\/button>)/g,'$1<button class="fbtn" data-wa-open="$2">Маршрут и активность</button>');
  modalView=()=>UI.modal?.type==='walkactivity'?waModal(UI.modal):modal();
  let previous=null;
  bind=()=>{
    if(previous?.map){previous.map.remove();delete previous.map;}
    if(previous && UI.modal!==previous){previous.controller?.abort();}
    previous=UI.modal;
    binding();const q=s=>$root.querySelector(s),all=(s,f)=>$root.querySelectorAll(s).forEach(f);
    all('[data-wa-retry]',b=>b.onclick=()=>{const w=S.walks.find(w=>w.id===UI.plwalk);if(w)WA_ROUTES.delete(waWalkKey(w));render();});
    all('[data-wa-open]',b=>b.onclick=()=>waOpen(b.dataset.waOpen));
    all('[data-wa-who]',b=>b.onclick=()=>{UI.wawho=b.dataset.waWho;render();});
    all('[data-wa-delete]',b=>b.onclick=()=>{const a=S.activities.find(x=>x.id===b.dataset.waDelete);if(!a||a.by!==S.me)return;S.activities=S.activities.filter(x=>x.id!==a.id);save();render();});
    const m=UI.modal;if(m?.type!=='walkactivity')return;
    const read=()=>{for(const k of ['date','km','minutes','up','down','stride','kg'])m.draft[k]=q('#wa-'+k).value;};
    all('.wa-fields input',i=>i.oninput=()=>{read();if(['wa-km','wa-minutes','wa-up','wa-down'].includes(i.id))m.draft.source='manual';q('#wa-summary').innerHTML=waSummary(m.draft);});
    q('#wa-route').disabled=!!m.busy;
    q('#wa-route').onclick=()=>{read();waRoute(m);};
    q('#wa-save').disabled=!!m.busy;
    q('#wa-save').onclick=()=>{
      if(S.me!==m.who)return;read();
      const fields=Array.from($root.querySelectorAll('.wa-fields input'));
      const invalid=fields.find(i=>!i.checkValidity());if(invalid){invalid.reportValidity();return;}
      const d=m.draft,w=S.walks.find(x=>x.id===m.walkId);
      if(!w||!(+d.km>0)||!(+d.minutes>0)||!(+d.stride>=.2)){toast('Укажите расстояние, время движения и длину шага');return;}
      const n=waNumbers(d),existing=S.activities.find(a=>a.walkId===m.walkId&&a.by===S.me&&a.date===d.date);
      const record={id:existing?.id||uid(),walkId:w.id,title:w.title,by:S.me,date:d.date,km:+d.km,minutes:+d.minutes,up:d.up===''?null:+d.up,down:d.down===''?null:+d.down,stride:+d.stride,kg:+d.kg||null,steps:n.steps,active:n.active,source:d.source,at:Date.now()};
      const i=S.activities.findIndex(a=>a.id===record.id);if(i>=0)S.activities[i]=record;else S.activities.push(record);
      UI.modal=null;UI.section='body';UI.bdtab='activity';UI.wawho=S.me;save();render();toast('Ваша прогулка в активности');
    };
    if(m.route)waMount(m);
  };
})();
document.head.insertAdjacentHTML('beforeend',`<style>
:root{--route-color:#1675D1;--route-outline:#FFFFFF}.wa-tools{display:flex;gap:8px;flex-wrap:wrap}.wa-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.wa-map{height:320px;border-radius:14px;overflow:hidden;margin-top:12px}.wa-profile small,.pw-sum small{display:block;color:var(--muted)}.wa-bars{height:90px;display:flex;align-items:flex-end;gap:1px;border-bottom:1px solid var(--line)}.wa-bars i{flex:1;background:var(--c7);min-width:0}.wa-tools button{min-height:44px}
@media(max-width:820px){.wa-map{height:280px}.filters>.seg [data-bdtab]{font-size:13px;padding:8px 4px;overflow-wrap:normal}.pl-bases{flex-wrap:wrap}.pl-bases button{min-height:44px}.pl-tools{flex-wrap:wrap}.pl-wact{flex-wrap:wrap}.pl-cats>.seg{flex-wrap:wrap}.pw-stop{flex-wrap:wrap}.pw-stop span{flex-basis:calc(100% - 34px)}.pw-stop button{width:44px;height:44px}}
</style>`);


