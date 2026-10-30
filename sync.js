/* ===== Помощник 47 — синхронизация через Supabase =====
   Локально всё работает без сети (localStorage). Изменения уходят в базу и приходят из неё
   по записям: collection/id. Побеждает последняя запись. Доступ только по паролю (два аккаунта). */
const SYNC = {
  url: 'https://tlltfehgkjzhdblwzspt.supabase.co',
  key: 'sb_publishable_YfEn2QHSb44ajNConx_52Q_YjMatHsH',   // публичный ключ: данные закрыты правилами базы
  authKey: 'p47.auth', state: 'off', busy: false, timer: null, pending: false, last: 0
};
SYNC.on = !!(SYNC.url && SYNC.key);
const SYNC_EMAIL = w => `u${w}@pomoshnik47.app`;

/* ---------- сессия ---------- */
const syncSession = () => { try{ return JSON.parse(localStorage.getItem(SYNC.authKey)); }catch(e){ return null; } };
const syncSetSession = s => { try{ s ? localStorage.setItem(SYNC.authKey, JSON.stringify(s)) : localStorage.removeItem(SYNC.authKey); }catch(e){} };
function syncHasSession(){ const s = syncSession(); return !!(s && s.refresh_token); }
async function authFetch(path, body){
  const r = await fetch(SYNC.url + path, {method:'POST', headers:{'Content-Type':'application/json', apikey:SYNC.key}, body:JSON.stringify(body)});
  const j = await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(new Error(j.error_description || j.msg || j.message || 'auth'), {status:r.status});
  return j;
}
const keepSession = (j, who) => syncSetSession({access_token:j.access_token, refresh_token:j.refresh_token, expires_at:Date.now()+(j.expires_in||3600)*1000, who});
async function syncSignIn(who, password){
  const j = await authFetch('/auth/v1/token?grant_type=password', {email:SYNC_EMAIL(who), password});
  keepSession(j, who);
}
function syncSignOut(){ syncSetSession(null); setSyncState('off'); }
async function syncToken(){
  let s = syncSession(); if(!s) throw Object.assign(new Error('no session'), {status:401});
  if(s.expires_at - Date.now() < 60000){
    let j; try{ j = await authFetch('/auth/v1/token?grant_type=refresh_token', {refresh_token:s.refresh_token}); }
    catch(e){ if(e.status===400 || e.status===401 || e.status===403) e.status = 401; throw e; }
    keepSession(j, s.who); s = syncSession();
  }
  return s.access_token;
}
async function rest(path, opts={}){
  const token = await syncToken();
  const r = await fetch(SYNC.url + '/rest/v1/' + path, {...opts, headers:{apikey:SYNC.key, Authorization:'Bearer '+token, 'Content-Type':'application/json', ...(opts.headers||{})}});
  if(!r.ok){ const t = await r.text().catch(()=>''); throw Object.assign(new Error(t||r.statusText), {status:r.status}); }
  return r.status===204 ? null : r.json();
}

/* ---------- карта данных: что синхронизируется ---------- */
function ensureShape(){
  S.food = S.food || {stores:{}, items:[], spend:[], tab:'buy'};
  S.money = S.money || {budget:'', fixed:[], incomes:[], log:[], savings:[], warned:{}};
  S.money.savings = S.money.savings || []; S.money.warned = S.money.warned || {};
  S._sync = S._sync || {cursor:'', meta:{}};
}
const ARR = {
  tasks:   {get:()=>S.tasks, set:a=>{S.tasks=a;}},
  fooditem:{get:()=>S.food.items, set:a=>{S.food.items=a;}},
  spend:   {get:()=>S.food.spend, set:a=>{S.food.spend=a;}},
  mlog:    {get:()=>S.money.log, set:a=>{S.money.log=a;}},
  income:  {get:()=>S.money.incomes, set:a=>{S.money.incomes=a;}},
  saving:  {get:()=>S.money.savings, set:a=>{S.money.savings=a;}},
  fixed:   {get:()=>S.money.fixed, set:a=>{S.money.fixed=a;}},
  note:    {get:()=>S.notes, set:a=>{S.notes=a;}, local:['read']}
};
const OBJ = {
  store:  {get:()=>S.food.stores},
  person: {get:()=>S.people}
};
const SINGLE = {
  moneycfg: {get:()=>({budget:S.money.budget, budgetV:S.money.budgetV, budgetCur:S.money.budgetCur}),
             set:d=>{ Object.assign(S.money, {budget:d.budget, budgetV:d.budgetV, budgetCur:d.budgetCur}); }},
  shared:   {get:()=>({rates:S.settings.rates, limits:S.settings.money.limits, woltCard:S.settings.money.woltCard, warnPct:S.settings.food.warnPct}),
             set:d=>{ if(d.rates) S.settings.rates=d.rates; if(d.limits) S.settings.money.limits=d.limits; if(d.woltCard) S.settings.money.woltCard=d.woltCard; if(d.warnPct) S.settings.food.warnPct=d.warnPct; }}
};
const strip = (o, drop) => { if(!drop) return o; const c = {...o}; drop.forEach(k=>delete c[k]); return c; };
function canon(v){
  if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
  if(v && typeof v==='object') return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined?null:v);
}
function snapshot(){
  const m = new Map();
  for(const [c,d] of Object.entries(ARR)) for(const it of d.get()){ if(!it.id) it.id = uid(); m.set(c+'/'+it.id, strip(it, d.local)); }
  for(const [c,d] of Object.entries(OBJ)) for(const [k,v] of Object.entries(d.get())) m.set(c+'/'+k, v);
  for(const [c,d] of Object.entries(SINGLE)) m.set(c+'/main', d.get());
  return m;
}
function applyOne(c, id, data, deleted){
  if(ARR[c]){
    const a = ARR[c].get(), i = a.findIndex(x=>x.id===id);
    if(deleted){ if(i>=0) a.splice(i,1); return; }
    const merged = {...data}; (ARR[c].local||[]).forEach(k=>{ merged[k] = i>=0 ? a[i][k] : false; });
    if(i>=0) a[i]=merged; else a.push(merged);
  } else if(OBJ[c]){
    const o = OBJ[c].get(); if(deleted) delete o[id]; else o[id] = data;
  } else if(SINGLE[c] && !deleted){ SINGLE[c].set(data); }
}

/* ---------- один цикл: забрать, затем отправить ---------- */
async function syncCycle(){
  if(!SYNC.on || !syncHasSession() || SYNC.busy) return;
  if(!navigator.onLine){ setSyncState('offline'); return; }
  SYNC.busy = true; SYNC.last = Date.now();
  try{
    ensureShape();
    const meta = S._sync.meta, first = !S._sync.cursor;
    setSyncState('sync');
    // 1) забрать чужие изменения
    let cursor = S._sync.cursor, changed = false, got = [];
    for(;;){
      const q = `records?select=*&order=updated_at.asc&limit=1000` + (cursor ? `&updated_at=gt.${encodeURIComponent(cursor)}` : '');
      const rows = await rest(q);
      got.push(...rows);
      if(rows.length) cursor = rows[rows.length-1].updated_at;
      if(rows.length<1000) break;
    }
    if(first && got.length){            // новое устройство: берём то, что в базе, а свои заготовки отбрасываем
      Object.keys(ARR).forEach(c=>ARR[c].set([]));
      S.food.stores = {}; S.people = {};
      Object.keys(meta).forEach(k=>delete meta[k]);
    }
    const snap = snapshot();
    for(const r of got){
      const key = r.collection+'/'+r.id, local = snap.get(key);
      const mine = meta[key], localChanged = local && (!mine || mine.h !== canon(local));
      if(localChanged && !first) continue;                       // своя несохранённая правка сильнее
      const same = !r.deleted && local && canon(local)===canon(r.data);
      if(!same){ applyOne(r.collection, r.id, r.data, r.deleted); changed = true; }
      meta[key] = r.deleted ? {deleted:true} : {h:canon(r.data)};
    }
    if(first && got.length){
      if(Object.keys(S.people||{}).length) S.setupDone = true;
      if(!S.me && syncSession()?.who) S.me = syncSession().who;
    }
    // 2) отправить свои
    const now = snapshot(), out = [];
    for(const [key, data] of now){
      const h = canon(data);
      if(!meta[key] || meta[key].h !== h){ const [c, ...rest_] = key.split('/'); out.push({collection:c, id:rest_.join('/'), data, deleted:false, updated_by:S.me||null}); }
    }
    for(const key of Object.keys(meta)){
      if(!now.has(key) && !meta[key].deleted){ const [c, ...rest_] = key.split('/'); out.push({collection:c, id:rest_.join('/'), data:null, deleted:true, updated_by:S.me||null}); }
    }
    for(let i=0;i<out.length;i+=400){
      const part = out.slice(i,i+400);
      const res = await rest('records?on_conflict=collection,id', {method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=representation'}, body:JSON.stringify(part)});
      part.forEach(p=>{ const key=p.collection+'/'+p.id; meta[key] = p.deleted ? {deleted:true} : {h:canon(p.data)}; });
      res.forEach(r=>{ if(r.updated_at > cursor) cursor = r.updated_at; });
    }
    S._sync.cursor = cursor;
    saveLocal();
    setSyncState('ok');
    if(changed) rerenderSoon();
  }catch(e){
    console.warn('sync', e);
    if(e.status===401){ setSyncState('auth'); }
    else setSyncState(navigator.onLine ? 'error' : 'offline');
  }finally{ SYNC.busy = false; if(SYNC.pending){ SYNC.pending = false; syncSoon(); } }
}
function syncSoon(){
  if(!SYNC.on || !syncHasSession()) return;
  if(SYNC.busy){ SYNC.pending = true; return; }
  clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncCycle, 1200);
}
function rerenderSoon(){
  if(UI.modal || document.activeElement?.matches?.('input,textarea,select')){ SYNC.dirty = true; return; }
  SYNC.dirty = false; render();
}
const SYNC_LABEL = {ok:['●','Синхронизировано'], sync:['↻','Синхронизация…'], offline:['○','Нет сети'], error:['!','Ошибка синхронизации'], auth:['!','Войдите заново'], off:['','']};
function setSyncState(s){
  SYNC.state = s; paintSync();
  if(s==='auth' && S.me){ S.me = null; render(); toast('Сессия закончилась, войдите снова'); }
}
function paintSync(){
  const s = SYNC.state, el = document.getElementById('syncpill');
  if(el){ el.className = 'syncpill '+s; el.textContent = SYNC_LABEL[s][0]; el.title = SYNC_LABEL[s][1]; el.style.display = SYNC.on && s!=='off' ? '' : 'none'; }
}
/* периодический обмен и реакции на возвращение в приложение */
if(SYNC.on){
  setInterval(()=>{ if(document.visibilityState==='visible') { if(SYNC.dirty && !UI.modal) rerenderSoon(); if(Date.now()-SYNC.last>12000) syncCycle(); } }, 4000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') syncCycle(); });
  addEventListener('online', ()=>syncCycle());
  addEventListener('offline', ()=>setSyncState('offline'));
  setTimeout(syncCycle, 600);
}
