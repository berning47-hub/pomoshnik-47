/* ===== Помощник 47 — валюты, темы, цвета, окно настроек ===== */
const CURS = {GEL:['₾','Лари'], USD:['$','Доллары'], RUB:['₽','Рубли']};
const PCOLS = [
  ['Коричневый','#7A4A2A','#B07848'], ['Тёмно-синий','#1E3557','#5B7FB8'], ['Зелёный','#3F6B4A','#6FA67C'], ['Бордовый','#7E2F3F','#C0687A'],
  ['Фиолетовый','#5B3F7A','#9C7CC4'], ['Бирюзовый','#1F6B73','#4FA3AC'], ['Оранжевый','#B5651D','#D98A45'], ['Графит','#3E3A38','#A39C96']
];
/* пресеты цветов интерфейса (фон, карточки, текст): по 5 на светлую и тёмную тему */
const UI_PRESETS = {
  light:{
    latte:['Латте','#F6EFE6','#EFE4D6','#FFFDF9','#E4D6C4','#F3E7D8','#E7D7C3','#FBE9D7','#3B2A1E','#8C7765','#B9A592','#5C4A3E'],
    mint:['Мята и крем','#EEF3EC','#E1EADF','#FBFDFA','#D0DDCD','#E3EEE1','#D3E2D0','#F6EBD3','#263328','#6B7F6C','#A3B5A2','#4A5E4B'],
    lavender:['Лаванда','#F1EEF6','#E6E1EF','#FDFCFF','#D8D1E6','#E8E2F2','#DAD2E8','#F4E6EC','#2E2840','#756E8C','#AFA8C4','#54496E'],
    peach:['Персик и роза','#FBEFEA','#F5E1D9','#FFFCFA','#EBD3C8','#F8E5DD','#EDD3C8','#FBE6C8','#43292A','#94706B','#C7A8A2','#6B4547'],
    sky:['Небо','#EDF2F7','#E0E8F0','#FBFDFF','#CFDBE7','#E1EBF5','#D2DFEC','#F5ECD6','#1F2B3A','#6A7C90','#A5B4C4','#475A70']
  },
  dark:{
    espresso:['Эспрессо','#1C1612','#2A211B','#251D18','#3A2E26','#30251D','#3A2E26','#4A3320','#F0E6DA','#A8957F','#7A6A5A','#A8957F'],
    midnight:['Полночь','#12161F','#1B212D','#181D28','#2B3445','#1F2634','#2B3445','#3B3220','#E6EAF2','#8E9AB0','#5E6A82','#8E9AB0'],
    forest:['Лес','#131A15','#1B251E','#171F19','#2A3A2E','#1F2C23','#2A3A2E','#3A3420','#E4EDE6','#8FA595','#5F7566','#8FA595'],
    plum:['Слива','#1A141D','#261C2B','#201826','#38293F','#2B2032','#38293F','#3F2E2A','#EEE6F2','#A793B0','#75627F','#A793B0'],
    graphite:['Графит','#171717','#232323','#1E1E1E','#333333','#282828','#333333','#3A3220','#ECECEC','#9A9A9A','#6A6A6A','#9A9A9A']
  }
};
const PRESET_VARS = ['bg','bg2','card','line','grad','hover','waitbg','text','muted','soft','both'];
const presetOf = th => { const k = S.settings.preset?.[th]; return UI_PRESETS[th][k] || Object.values(UI_PRESETS[th])[0]; };
const LIMIT_KEYS = ['food','out','fun','subs','study','home','clothes','health','transport','other'];
const LIMIT_DEFAULT = {food:35,out:8,fun:10,subs:5,study:5,home:8,clothes:5,health:7,transport:5,other:12};
const localISO = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function defaultSettings(){
  return {
    notify:{'7':true,'4':true,shared:true},
    currency:'GEL', theme:'light', preset:{light:'latte', dark:'espresso'},
    rates:{usdGel:2.6, usdRub:82, hist:[{date:localISO(), usdGel:2.6, usdRub:82}]},
    pcolor:{light:{'7':0,'4':1}, dark:{'7':0,'4':1}},
    tasks:{defCol:'today', doneDays:0},
    food:{warnPct:20},
    money:{woltCard:'tbc', limits:{...LIMIT_DEFAULT}}
  };
}
function mergeDeep(d, s){
  if(!s || typeof s!=='object') return d;
  for(const k of Object.keys(d)){
    if(s[k]===undefined) continue;
    if(d[k] && typeof d[k]==='object' && !Array.isArray(d[k])) d[k] = mergeDeep(d[k], s[k]);
    else d[k] = s[k];
  }
  return d;
}
function ensureSettings(){ S.settings = mergeDeep(defaultSettings(), S.settings); }
ensureSettings();

/* ---------- тема и цвета персонажей ---------- */
const effTheme = () => {
  const t = S.settings.theme;
  if(t==='system') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return t;
};
function mixHex(a, b, t){
  const p = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const x = p(a), y = p(b);
  return '#' + x.map((v,i)=>Math.round(v*t + y[i]*(1-t)).toString(16).padStart(2,'0')).join('');
}
function colorOf(w){
  const th = effTheme(), i = S.settings.pcolor[th]?.[w] ?? (w==='7'?0:1);
  return PCOLS[i][th==='dark'?2:1];
}
function softOf(w){ return mixHex(colorOf(w), presetOf(effTheme())[3], 0.16); }
function applyLook(){
  const th = effTheme(), r = document.documentElement;
  r.dataset.theme = th;
  ['7','4'].forEach(w=>{ r.style.setProperty('--c'+w, colorOf(w)); r.style.setProperty('--c'+w+'soft', softOf(w)); });
  const P = presetOf(th);
  PRESET_VARS.forEach((v,i)=>r.style.setProperty('--'+v, P[i+1]));
  const cm = P[3].match(/\w\w/g).map(h=>parseInt(h,16));
  r.style.setProperty('--navbg', `rgba(${cm[0]},${cm[1]},${cm[2]},.96)`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', P[1]);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', ()=>{ if(S.settings.theme==='system') render(); });

/* ---------- валюты ---------- */
const curDef = () => S.settings.currency;
function toGEL(v, c){
  const r = S.settings.rates;
  return c==='USD' ? v*r.usdGel : c==='RUB' ? v*r.usdGel/r.usdRub : v;
}
function fromGEL(g, c){
  const r = S.settings.rates;
  return c==='USD' ? g/r.usdGel : c==='RUB' ? g*r.usdRub/r.usdGel : g;
}
const r2 = v => Math.round(v*100)/100;
function fmtCur(v, c){
  const n = c==='RUB' ? Math.round(v) : r2(v);
  return n.toLocaleString('ru-RU',{minimumFractionDigits:0, maximumFractionDigits:2}) + ' ' + CURS[c][0];
}
const money = g => fmtCur(fromGEL(+g||0, curDef()), curDef());   // g в лари
const moneyIn = (v, c) => fmtCur(v, c);                           // v уже в валюте c

/* поле суммы с маленьким выпадающим списком валюты */
function amtField(id, rec, ph=''){
  rec = rec || {};
  let cur = curDef(), shown = '', gel = '';
  if(rec.v!=='' && rec.v!=null && rec.cur){ cur = rec.cur; shown = String(rec.v); gel = rec.gel ?? toGEL(+rec.v, rec.cur); }
  else if(rec.gel!=='' && rec.gel!=null){ shown = String(r2(fromGEL(+rec.gel, cur))); gel = rec.gel; }
  return `<div class="amt"><input class="inp" id="${id}" type="number" step="0.01" min="0" inputmode="decimal" value="${shown}" placeholder="${esc(ph)}" data-gel="${gel}" data-shown="${shown}" data-cur="${cur}">
    <select class="cur" id="${id}-c" aria-label="Валюта">${Object.entries(CURS).map(([k,[s]])=>`<option value="${k}" ${k===cur?'selected':''}>${s} ${k}</option>`).join('')}</select></div>`;
}
function readAmt(id){
  const el = document.getElementById(id), sel = document.getElementById(id+'-c');
  if(!el || el.value==='') return null;
  const v = +el.value, cur = sel.value;
  if(el.dataset.gel!=='' && el.value===el.dataset.shown && cur===el.dataset.cur) return {gel:+el.dataset.gel, v, cur};
  return {gel:r2(toGEL(v,cur)), v, cur};
}

/* ---------- окно настроек ---------- */
const SET_PAGES = [['global','Общие'],['tasks','Задачи'],['places','Места'],['food','Продукты'],['money','Деньги'],['meals','Еда'],['study','Учёба'],['books','Книги']];
function openSettings(page='global'){ UI.modal = {type:'settings', page}; UI.resetAsk = false; render(); }

function settingsModal(m){
  return `<div class="scrim" data-close><div class="sheet wide" role="dialog"><h2>Настройки</h2>
    <div class="sets"><nav class="setnav">${SET_PAGES.map(([k,n])=>`<button data-spage="${k}" class="${m.page===k?'on':''}">${n}</button>`).join('')}</nav>
    <div class="setbody">${settingsPage(m.page)}</div></div>
    <div class="actions"><button class="btn" data-close>Закрыть</button></div></div></div>`;
}
const swRow = (t, html) => `<div class="switchrow"><span>${t}</span>${html}</div>`;
const segBtns = (name, opts, cur) => `<div class="seg">${opts.map(([k,n])=>`<button data-${name}="${k}" class="${String(cur)===String(k)?'on':''}">${n}</button>`).join('')}</div>`;

function settingsPage(p){
  const s = S.settings;
  if(p==='global') return `
    <h3>Общие</h3>
    ${swRow('Валюта по умолчанию', segBtns('sc', Object.entries(CURS).map(([k,[sy,n]])=>[k,`${sy} ${n}`]), s.currency))}
    <p class="fhint">В неё пересчитываются суммы на экране. Любое поле суммы можно переключить на другую валюту отдельно.</p>
    ${swRow('Тема', segBtns('sth', [['light','Светлая'],['dark','Тёмная'],['system','Как в системе']], s.theme))}
    <h3>Цвета интерфейса</h3>
    ${['light','dark'].map(th=>`<div class="presets"><small>${th==='light'?'Светлая тема':'Тёмная тема'}${effTheme()===th?' (сейчас)':''}</small><div class="prow">${Object.entries(UI_PRESETS[th]).map(([k,P])=>`<button class="pre ${s.preset[th]===k?'on':''}" data-spre="${th}:${k}" title="${P[0]}"><span class="sw" style="background:${P[1]}"><i style="background:${P[3]}"></i><i style="background:${P[8]}"></i><i style="background:${P[9]}"></i></span><em>${P[0]}</em></button>`).join('')}</div></div>`).join('')}
    <p class="fhint">Цвета 7 и 4 хранятся отдельно для каждой темы. Менять цвет кружка: «Мой персонаж», кнопка слева внизу.</p>
    <h3>Уведомления внутри приложения</h3>
    ${[['7','Для 7'],['4','Для 4'],['shared','Общие']].map(([k,n])=>swRow(n, `<button class="tog ${s.notify[k]?'on':''}" data-stog="${k}" aria-label="${n}"></button>`)).join('')}
    <h3>Данные</h3>
    <div class="pick"><button id="g-export">Скачать копию</button><label class="btn ghost" style="padding:8px 12px;font-weight:400;margin:0;color:var(--text)">Загрузить копию<input type="file" id="g-import" accept=".json" hidden></label></div>
    <p class="fhint">Пока данные живут на этом устройстве. Синхронизация между телефоном и ПК будет следующим шагом.</p>
    <h3>Сброс</h3>
    ${UI.resetAsk ? `<p class="fhint">Все настройки вернутся к заводским. Задачи, продукты и траты останутся.</p><div class="pick"><button id="g-reset-yes" style="border-color:var(--bad);color:var(--bad)">Да, сбросить</button><button id="g-reset-no">Отмена</button></div>`
      : `<button class="btn ghost" id="g-reset">Сбросить настройки до заводских</button>`}`;
  if(p==='tasks') return `<h3>Задачи</h3>
    ${swRow('Новая задача по умолчанию', segBtns('std', [['today','Сегодня'],['week','На неделе']], s.tasks.defCol))}
    ${swRow('Скрывать готовые через', segBtns('sdd', [[0,'Не скрывать'],[3,'3 дня'],[7,'7 дней'],[30,'30 дней']], s.tasks.doneDays))}`;
  if(p==='food') return `<h3>Продукты</h3>
    ${swRow('Предупреждать, когда осталось', segBtns('swp', [[10,'10%'],[20,'20%'],[30,'30%']], s.food.warnPct))}
    <p class="fhint">Работает для продуктов, у которых указано количество или срок годности.</p>`;
  if(p==='money'){
    const r = s.rates, L = s.money.limits, tot = LIMIT_KEYS.reduce((a,k)=>a+(+L[k]||0),0);
    const free = typeof moneyCalc==='function' ? Math.max(0, moneyCalc().free) : 0;
    return `<h3>Курс валют</h3>
    <p class="fhint">Сейчас: 1 $ = ${String(r.usdGel).replace('.',',')} ₾ = ${String(r.usdRub).replace('.',',')} ₽. Новый курс начинает действовать с момента применения, уже записанные суммы не пересчитываются.</p>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>1 $ в лари</label><input class="inp" id="rt-gel" type="number" step="0.01" min="0" value="${r.usdGel}"></div>
      <div style="flex:1"><label>1 $ в рублях</label><input class="inp" id="rt-rub" type="number" step="0.01" min="0" value="${r.usdRub}"></div></div>
    <button class="btn" id="rt-apply">Применить курс</button>
    ${r.hist.length>1?`<div class="rhist">${[...r.hist].reverse().map(h=>`<small>с ${new Date(h.date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}: $ = ${String(h.usdGel).replace('.',',')} ₾ = ${String(h.usdRub).replace('.',',')} ₽</small>`).join('')}</div>`:''}
    <h3>Карта для заказов Wolt</h3>
    ${swRow('Чем платим обычно', segBtns('swc', [['tbc','TBC'],['bybit','Bybit Card'],['cash','Наличные']], s.money.woltCard))}
    <h3>Лимиты по категориям</h3>
    <p class="fhint">Доля свободного бюджета месяца (после обязательных платежей${free?`, сейчас ${money(free)}`:''}).</p>
    <div class="lims">${LIMIT_KEYS.map(k=>`<div class="lim"><span>${esc(MCATS_NAME(k))}</span><input class="inp" type="number" min="0" max="100" step="1" data-lim="${k}" value="${L[k]}"><b>%</b><small data-limamt="${k}">${money(free*(+L[k]||0)/100)}</small></div>`).join('')}</div>
    <div class="limtot ${tot===100?'':'bad'}" id="limtot">Всего ${tot}%${tot===100?'':tot<100?`: ещё ${100-tot}% не распределено`:`: на ${tot-100}% больше бюджета`}</div>
    <button class="btn ghost" id="lim-reset" style="margin-top:8px">Вернуть стандартные доли</button>`;
  }
  const names = {places:'Места',meals:'Еда',study:'Учёба',books:'Книги'};
  return `<h3>${names[p]}</h3><div class="empty">Раздел ещё в разработке. Его настройки появятся вместе с ним.</div>`;
}
const MCATS_NAME = k => (typeof MCATS!=='undefined' ? (MCATS.find(c=>c[0]===k)||[k,k])[1] : k);

function bindSettings(){
  const q = s=>$root.querySelector(s), all=(s,fn)=>$root.querySelectorAll(s).forEach(fn);
  all('[data-act="settings"]', b=>b.onclick=()=>openSettings());
  if(UI.modal?.type!=='settings') return;
  const m = UI.modal, s = S.settings;
  const again = () => { const sb=q('.setbody'); const y=sb?sb.scrollTop:0; render(); const nb=q('.setbody'); if(nb) nb.scrollTop=y; };
  all('[data-spage]', b=>b.onclick=()=>{ m.page=b.dataset.spage; UI.resetAsk=false; render(); });
  all('[data-sc]', b=>b.onclick=()=>{ s.currency=b.dataset.sc; save(); again(); });
  all('[data-spre]', b=>b.onclick=()=>{ const [th,k]=b.dataset.spre.split(':'); s.preset[th]=k; save(); again(); });
  all('[data-sth]', b=>b.onclick=()=>{ s.theme=b.dataset.sth; save(); again(); });
  all('[data-stog]', b=>b.onclick=()=>{ const k=b.dataset.stog; s.notify[k]=!s.notify[k]; save(); again(); });
  all('[data-std]', b=>b.onclick=()=>{ s.tasks.defCol=b.dataset.std; save(); again(); });
  all('[data-sdd]', b=>b.onclick=()=>{ s.tasks.doneDays=+b.dataset.sdd; save(); again(); });
  all('[data-swp]', b=>b.onclick=()=>{ s.food.warnPct=+b.dataset.swp; save(); again(); });
  all('[data-swc]', b=>b.onclick=()=>{ s.money.woltCard=b.dataset.swc; save(); again(); });
  q('#g-export')?.addEventListener('click', ()=>{ const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`pomoshnik47-${localISO()}.json`; a.click(); });
  q('#g-import')?.addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const d=JSON.parse(t); if(!d.tasks) throw 0; S=d; ensureSettings(); UI.modal=null; save(); render(); toast('Копия загружена'); }catch(_){ toast('Не тот файл'); } }); });
  q('#g-reset')?.addEventListener('click', ()=>{ UI.resetAsk=true; again(); });
  q('#g-reset-no')?.addEventListener('click', ()=>{ UI.resetAsk=false; again(); });
  q('#g-reset-yes')?.addEventListener('click', ()=>{ S.settings=defaultSettings(); UI.resetAsk=false; save(); again(); toast('Настройки сброшены'); });
  q('#rt-apply')?.addEventListener('click', ()=>{
    const g=+q('#rt-gel').value, ru=+q('#rt-rub').value;
    if(!(g>0) || !(ru>0)){ toast('Введите курс больше нуля'); return; }
    const r = s.rates;
    if(g===r.usdGel && ru===r.usdRub){ toast('Курс не изменился'); return; }
    r.usdGel=g; r.usdRub=ru; r.hist.push({date:localISO(), usdGel:g, usdRub:ru});
    save(); again(); toast('Курс применён. Прошлые записи не меняются');
  });
  all('[data-lim]', i=>i.oninput=()=>{
    s.money.limits[i.dataset.lim] = Math.max(0, +i.value||0); save();
    const free = Math.max(0, moneyCalc().free), L = s.money.limits;
    all('[data-limamt]', t=>t.textContent = money(free*(+L[t.dataset.limamt]||0)/100));
    const tot = LIMIT_KEYS.reduce((a,k)=>a+(+L[k]||0),0), el=q('#limtot');
    el.textContent = `Всего ${tot}%` + (tot===100?'':tot<100?`: ещё ${100-tot}% не распределено`:`: на ${tot-100}% больше бюджета`);
    el.classList.toggle('bad', tot!==100);
  });
  q('#lim-reset')?.addEventListener('click', ()=>{ s.money.limits={...LIMIT_DEFAULT}; save(); again(); });
}
