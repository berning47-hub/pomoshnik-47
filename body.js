/* ===== Помощник 47 — раздел «Тело» =====
   Самостоятельный модуль: подключается после sync.js и сам встраивается в меню, render/bind, модалки и настройки. */
const BD_CATS = [['yoga','Йога','🧘'],['train','Тренировка','🏋️'],['breath','Дыхание','🌬️'],['med','Медитация','🪷']];
const BD_CAT = Object.fromEntries(BD_CATS.map(c=>[c[0],c]));
const BD_TAGS = {
  yoga:['Всё тело','Растяжка','Спина','Бёдра и таз','Баланс','Утро','Вечер'],
  train:['Всё тело','Ноги','Ягодицы','Пресс и кор','Спина','Грудь','Плечи','Руки','Кардио'],
  breath:['Успокоиться','Энергия','Перед сном','Концентрация'],
  med:['Расслабление','Сон','Фокус','Тревога','Благодарность']
};
const BD_DIFF = ['','Очень легко','Легко','Средне','Тяжело','Очень тяжело'];

function ensureBody(){
  if(!Array.isArray(S.bvideos)) S.bvideos = [];
  if(!S.bodyp) S.bodyp = {};
  ['7','4'].forEach(w=>{ S.bodyp[w] = Object.assign({h:'',w:'',chest:'',waist:'',hips:'',log:[]}, S.bodyp[w]||{}); });
  if(!S.bodycfg) S.bodycfg = {week:{'7':3,'4':3}};
  S.bvideos.forEach(v=>{ v.diff=v.diff||{}; v.done=v.done||{}; ['7','4'].forEach(w=>{ v.done[w]=v.done[w]||[]; }); v.tags=v.tags||[]; });
  UI.bdtab = UI.bdtab || 'list'; UI.bdcat = UI.bdcat || 'all';
}
ensureBody();

if(typeof ARR!=='undefined'){
  ARR.bvideo = {get:()=>S.bvideos, set:a=>{S.bvideos=a;}};
  OBJ.bodyp = {get:()=>S.bodyp};
  SINGLE.bodycfg = {get:()=>S.bodycfg, set:d=>{ S.bodycfg = d; }};
}

/* ---------- YouTube: id, превью, длительность без ключа API ---------- */
function bdYtId(url){
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(url.trim()) ? url.trim() : '');
}
const bdThumb = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
let bdYtReady = null;
function bdLoadYt(){
  if(bdYtReady) return bdYtReady;
  bdYtReady = new Promise((ok, bad)=>{
    if(window.YT?.Player) return ok();
    window.onYouTubeIframeAPIReady = () => ok();
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = ()=>{ bdYtReady = null; bad(); };
    document.head.appendChild(s);
  });
  return bdYtReady;
}
/* скрытый плеер отдаёт название и длительность ролика */
function bdYtMeta(id){
  return Promise.race([
    bdLoadYt().then(()=>new Promise(ok=>{
      const box = document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;width:200px;height:120px';
      const el = document.createElement('div'); box.appendChild(el); document.body.appendChild(box);
      const done = r => { try{ p.destroy(); }catch(_){} box.remove(); ok(r); };
      const p = new YT.Player(el, {videoId:id, playerVars:{autoplay:0,mute:1}, events:{
        onReady:e=>{ let n=0; const t=setInterval(()=>{ const d=e.target.getDuration(); if(d>0 || ++n>25){ clearInterval(t); done({dur:Math.round(d)||0, title:e.target.getVideoData?.().title||''}); } }, 200); },
        onError:()=>done({dur:0,title:''}) }});
    })),
    new Promise(ok=>setTimeout(()=>ok({dur:0,title:''}), 9000))
  ]).catch(()=>({dur:0,title:''}));
}
const bdMin = s => s ? Math.max(1, Math.round(s/60)) : 0;
const bdDur = s => { if(!s) return ''; const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}` : `${m}:${String(x).padStart(2,'0')}`; };

/* ---------- статистика ---------- */
function bdWeekDays(){ const d=new Date(), wd=(d.getDay()+6)%7; return Array.from({length:7},(_,i)=>{ const x=new Date(d); x.setDate(d.getDate()-wd+i); return localISO(x); }); }
function bdDoneOn(w, day){ return S.bvideos.filter(v=>v.done[w].includes(day)); }
function bdWeek(w){
  const days = bdWeekDays(); let n=0, sec=0;
  S.bvideos.forEach(v=>v.done[w].forEach(d=>{ if(days.includes(d)){ n++; sec+=v.dur||0; } }));
  return {days, n, min:Math.round(sec/60)};
}
function bdStreak(w){
  const all = new Set(S.bvideos.flatMap(v=>v.done[w]));
  let n=0, d=new Date(); if(!all.has(localISO(d))) d.setDate(d.getDate()-1);
  while(all.has(localISO(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}

/* ---------- экран ---------- */
function bodyView(){
  ensureBody();
  const tabs = [['list','Тренировки'],['me','Тело']];
  return `<div class="filters"><div class="seg">${tabs.map(([k,t])=>`<button data-bdtab="${k}" class="${UI.bdtab===k?'on':''}">${t}</button>`).join('')}</div>
    <div class="sp" style="flex:1"></div>${UI.bdtab==='list'?'<button class="btn" data-bdnew>+ Видео</button>':''}</div>
    ${UI.bdtab==='list' ? bdList() : bdBodyView()}`;
}
function bdWeekStrip(){
  const today = localISO(), names=['пн','вт','ср','чт','пт','сб','вс'];
  return `<div class="bd-week">${['7','4'].map(w=>{ const s=bdWeek(w), g=+S.bodycfg.week[w]||0, st=bdStreak(w);
    return `<div class="bd-wk"><div class="bd-wkh">${badgeEl(w)}<b>${esc(pname(w))}</b><small>${s.n}${g?' из '+g:''} за неделю · ${s.min} мин${st>1?` · 🔥 ${st} ${plural(st,'день','дня','дней')}`:''}</small></div>
      <div class="bd-dots">${s.days.map((d,i)=>{ const n=bdDoneOn(w,d).length; return `<span class="${n?'on':''} ${d===today?'today':''}" style="${n?`background:${colorOf(w)}`:''}" title="${n} ${plural(n,'тренировка','тренировки','тренировок')}"><i>${names[i]}</i></span>`; }).join('')}</div></div>`; }).join('')}</div>`;
}
function bdList(){
  const cats = [['all','Все'], ...BD_CATS.map(([k,n,i])=>[k,`${i} ${n}`])];
  const list = S.bvideos.filter(v=>UI.bdcat==='all' || v.cat===UI.bdcat)
    .sort((a,b)=>(b.fav?1:0)-(a.fav?1:0) || (b.done['7'].length+b.done['4'].length)-(a.done['7'].length+a.done['4'].length) || b.at-a.at);
  return `${bdWeekStrip()}
    <div class="filters bd-cats"><div class="seg">${cats.map(([k,t])=>`<button data-bdcat="${k}" class="${UI.bdcat===k?'on':''}">${t}</button>`).join('')}</div>
      ${S.bvideos.length?`<button class="btn ghost bd-rnd" data-bdrnd>🎲 Есть время…</button>`:''}</div>
    ${list.length ? `<div class="bd-grid">${list.map(bdCard).join('')}</div>`
      : `<div class="empty">${S.bvideos.length?'В этой категории пока пусто.':'Вставьте ссылку на ролик YouTube: 47 сам подтянет превью, название и длительность.'}</div>`}`;
}
function bdCard(v){
  const c = BD_CAT[v.cat]||BD_CATS[0];
  return `<article class="bd-card">
    <a class="bd-thumb" ${v.yt?`href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener"`:''}>
      ${v.yt?`<img src="${bdThumb(v.yt)}" alt="" loading="lazy" onerror="this.remove()">`:`<div class="bd-noimg">${c[2]}</div>`}
      ${v.dur?`<span class="bd-dur">${bdDur(v.dur)}</span>`:''}${v.yt?'<span class="bd-play">▶</span>':''}</a>
    <div class="bd-body">
      <div class="bd-title" data-bdedit="${v.id}"><b>${v.fav?'★ ':''}${esc(v.title||'Без названия')}</b><small>${c[2]} ${c[1]}${v.dur?` · ${bdMin(v.dur)} мин`:''}</small></div>
      ${v.tags.length?`<div class="bd-tags">${v.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`:''}
      ${v.review?`<p class="bd-rev">${esc(v.review)}</p>`:''}
      <div class="bd-foot">
        <div class="bd-diffs">${['7','4'].map(w=>{ const d=+v.diff[w]||0, me=w===S.me;
          return `<div class="bd-diff" title="${d?BD_DIFF[d]:'Ещё не оценил'+(fem(w)?'а':'')}"><span class="badge b${w}">${w}</span>${[1,2,3,4,5].map(i=>`<button ${me?`data-bddiff="${v.id}:${i}"`:'tabindex="-1" disabled'} class="${i<=d?'on':''}" style="${i<=d?`background:${colorOf(w)}`:''}"></button>`).join('')}</div>`; }).join('')}</div>
        <div class="bd-cnt">${['7','4'].map(w=>v.done[w].length?`<span>${badgeEl(w)}×${v.done[w].length}</span>`:'').join('')}</div>
        <button class="fbtn ${v.done[S.me].includes(localISO())?'back':''}" data-bddone="${v.id}">${v.done[S.me].includes(localISO())?'✓ Сегодня':'Сделал'+(fem(S.me)?'а':'')}</button>
      </div>
    </div></article>`;
}

/* ---------- тело: ползунки и силуэт ---------- */
const BD_P = [['h','Рост','см',140,210,170],['w','Вес','кг',40,140,70],['chest','Грудь','см',70,140,95],['waist','Талия','см',55,140,80],['hips','Бёдра','см',70,150,98]];
function bdVal(p, k){ const d = BD_P.find(x=>x[0]===k); return +p[k] || d[5]; }
function bdCurve(pts){                                               // плавная кривая через точки (Catmull-Rom)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    d += ` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
  return d;
}
function bdFigure(p, w){
  const h=bdVal(p,'h'), ch=bdVal(p,'chest'), wa=bdVal(p,'waist'), hi=bdVal(p,'hips'), kg=bdVal(p,'w');
  const H = 232*h/210, top = 246-H, k = H/h, cx = 70;               // k: пикселей на сантиметр
  const f = Math.sqrt((kg/((h/100)**2))/22);                         // полнота рук и ног относительно ИМТ 22
  const y = t => top + H*t, X = cm => cm*k;
  const sh = X(ch*.215), c = X(ch*.165), wv = X(wa*.17), hv = X(hi*.18);
  const thigh = hv*.52, knee = X(5.2*f), calf = X(5.6*f), ank = X(3.2);
  const R = [[X(5.5),y(.125)],[sh*.8,y(.165)],[sh,y(.2)],[c*1.02,y(.26)],[c,y(.31)],[wv,y(.4)],[hv,y(.5)],[hv*.96,y(.56)],
    [hv*.5+thigh*.95*.5+X(2),y(.66)],[X(3)+knee*2,y(.74)],[X(3)+calf*1.9,y(.82)],[X(3)+ank*1.6,y(.95)],[X(3)+ank*2.4,y(.985)],[X(1.5),y(.985)],[X(2.2),y(.95)],[X(1.6),y(.74)],[0,y(.535)]];
  const pts = [...R.map(([x,yy])=>[cx+x,yy]), ...R.slice(0,-1).reverse().map(([x,yy])=>[cx-x,yy])];
  const armW = X(4.6*f), arm = d => bdCurve([[cx+d*(sh-armW*.35),y(.2)],[cx+d*(sh+armW*.55),y(.32)],[cx+d*(Math.max(hv,c)+armW*.8),y(.43)],[cx+d*(hv+armW*1.1),y(.52)]]);
  const col = colorOf(w);
  return `<svg viewBox="0 0 140 250" class="bd-fig" aria-label="Силуэт">
    <line x1="8" y1="${top}" x2="8" y2="246" stroke="var(--line)" stroke-dasharray="2 3"/><text x="11" y="${top+7}" class="bd-figt">${h} см</text>
    <ellipse cx="${cx}" cy="${y(.068)}" rx="${X(8.2)}" ry="${X(10.8)}" fill="${col}"/>
    <path d="${arm(-1)}" stroke="${col}" stroke-width="${armW*2}" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="${arm(1)}" stroke="${col}" stroke-width="${armW*2}" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="${bdCurve(pts)} Z" fill="${col}"/>
  </svg>`;
}
function bdStats(p){
  const h = +p.h, kg = +p.w, wa = +p.waist, hi = +p.hips;
  const out = [];
  if(h && kg){ const bmi = kg/((h/100)**2); out.push(['ИМТ', bmi.toFixed(1).replace('.',','), bmi<18.5?'ниже нормы':bmi<25?'норма':bmi<30?'выше нормы':'заметно выше нормы']); }
  if(wa && h){ const r = wa/h; out.push(['Талия / рост', r.toFixed(2).replace('.',','), r<.5?'хорошо':'стоит следить']); }
  if(wa && hi) out.push(['Талия / бёдра', (wa/hi).toFixed(2).replace('.',','), '']);
  return out;
}
function bdSpark(log){
  if(log.length<2) return '';
  const L = log.slice(-20), vs = L.map(r=>r.w), mn = Math.min(...vs), mx = Math.max(...vs), r = mx-mn||1;
  const pts = L.map((x,i)=>`${(i/(L.length-1)*200).toFixed(1)},${(38-(x.w-mn)/r*32).toFixed(1)}`).join(' ');
  const d = L[L.length-1].w - L[0].w;
  return `<div class="bd-spark"><svg viewBox="0 0 200 42" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--c7)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
    <small>${L.length} ${plural(L.length,'замер','замера','замеров')} с ${new Date(L[0].d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}: ${d>0?'+':''}${String(Math.round(d*10)/10).replace('.',',')} кг</small></div>`;
}
function bdBodyView(){
  const who = UI.bdwho || S.me, p = S.bodyp[who], me = who===S.me;
  return `<div class="filters"><div class="seg">${['7','4'].map(w=>`<button data-bdwho="${w}" class="${who===w?'on':''}">${esc(pname(w))}</button>`).join('')}</div></div>
  <div class="bd-me">
    <div class="bd-figbox" id="bd-fig">${bdFigure(p, who)}</div>
    <div class="bd-params">
      ${BD_P.map(([k,n,u,mn,mx])=>`<div class="bd-sl"><label>${n}<b id="bdv-${k}">${p[k]||'—'}</b> ${u}</label>
        <input type="range" min="${mn}" max="${mx}" step="${k==='w'?.5:1}" value="${bdVal(p,k)}" data-bdp="${k}" ${me?'':'disabled'}></div>`).join('')}
      <div class="bd-stats" id="bd-stats">${bdStatsHtml(p)}</div>
      ${me?`<button class="btn ghost" id="bd-logw">Записать вес сегодня</button>`:`<p class="fhint">Это параметры: ${esc(pname(who))}. Менять их может только ${fem(who)?'она':'он'}.</p>`}
      ${bdSpark(p.log||[])}
    </div>
  </div>
  <p class="fhint">Силуэт примерный: он строится по росту и обхватам и нужен, чтобы видеть изменения, а не для диагнозов.</p>`;
}
const bdStatsHtml = p => bdStats(p).map(([n,v,t])=>`<div class="stat"><small>${n}</small><b>${v}</b>${t?`<small>${t}</small>`:''}</div>`).join('') || '<p class="fhint">Подвиньте ползунки: появятся ИМТ и пропорции.</p>';

/* ---------- модалки ---------- */
function bdEditModal(m){
  const d = m.draft, tags = BD_TAGS[d.cat]||[];
  return `<div class="scrim" data-close><div class="sheet" role="dialog"><h2>${m.isNew?'Новое видео':'Видео'}</h2>
    <div class="field"><label>Ссылка на YouTube</label><div class="fquick"><input class="inp" id="bv-url" value="${esc(d.url)}" placeholder="https://youtu.be/…" inputmode="url"><button class="btn ghost" id="bv-fetch">${m.loading?'…':'Подтянуть'}</button></div></div>
    ${d.yt?`<div class="bv-prev"><img src="${bdThumb(d.yt)}" alt=""><div><b>${esc(d.title||'')}</b><small>${d.dur?'Длительность '+bdDur(d.dur):m.loading?'Узнаю длительность…':'Длительность не определилась, впишите минуты ниже'}</small></div></div>`:''}
    <div class="field"><label>Название</label><input class="inp" id="bv-title" value="${esc(d.title)}" placeholder="Йога для спины, 20 минут"></div>
    <div class="field"><label>Что это</label><div class="pick" id="bv-cat">${BD_CATS.map(([k,n,i])=>`<button data-v="${k}" class="${d.cat===k?'on':''}">${i} ${n}</button>`).join('')}</div></div>
    <div class="field"><label>На что работает</label><div class="pick bv-tags" id="bv-tags">${tags.map(t=>`<button data-v="${esc(t)}" class="${d.tags.includes(t)?'on':''}">${esc(t)}</button>`).join('')}</div></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Минут</label><input class="inp" id="bv-min" type="number" min="1" value="${d.dur?bdMin(d.dur):''}" placeholder="из видео"></div>
      <div style="flex:2"><label>Моя сложность</label><div class="bd-diff big" id="bv-diff">${[1,2,3,4,5].map(i=>`<button data-v="${i}" class="${i<=(+d.diff[S.me]||0)?'on':''}" style="${i<=(+d.diff[S.me]||0)?`background:${colorOf(S.me)}`:''}"></button>`).join('')}<small>${BD_DIFF[+d.diff[S.me]||0]||''}</small></div></div></div>
    <div class="field"><label>Коротко о видео</label><textarea class="inp" id="bv-rev" rows="2" placeholder="Мягкая, хороша утром; много планки">${esc(d.review)}</textarea></div>
    <label class="fhint" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="bv-fav" ${d.fav?'checked':''}> Любимое, показывать первым</label>
    ${!m.isNew&&(d.done['7'].length||d.done['4'].length)?`<p class="fhint">Сделано: ${['7','4'].map(w=>`${esc(pname(w))} ${d.done[w].length}`).join(', ')}. Последний раз ${new Date([...d.done['7'],...d.done['4']].sort().pop()).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}.</p>`:''}
    <div class="actions">${m.isNew?'':'<button class="del" id="bv-del">Удалить</button>'}<button class="btn ghost" data-close>Отмена</button><button class="btn" id="bv-save">Сохранить</button></div>
  </div></div>`;
}
function bdRndModal(m){
  const v = m.id && S.bvideos.find(x=>x.id===m.id);
  return `<div class="scrim" data-close><div class="sheet bk-pick"><small>Сколько есть времени?</small>
    <div class="pick" style="justify-content:center;margin:12px 0">${[[10,'до 10 мин'],[20,'до 20'],[40,'до 40'],[0,'неважно']].map(([k,t])=>`<button data-bdrmin="${k}" class="${m.min===k?'on':''}">${t}</button>`).join('')}</div>
    ${v?`<a class="bd-thumb" ${v.yt?`href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener"`:''} style="max-width:320px;margin:0 auto">${v.yt?`<img src="${bdThumb(v.yt)}" alt="">`:`<div class="bd-noimg">${BD_CAT[v.cat][2]}</div>`}${v.dur?`<span class="bd-dur">${bdDur(v.dur)}</span>`:''}</a>
      <h2 style="margin-top:10px">${esc(v.title)}</h2><p class="fhint">${BD_CAT[v.cat][1]}${v.tags.length?' · '+v.tags.map(esc).join(', '):''}</p>`
      : m.min!==undefined ? '<p class="fhint">Под это время ничего нет. Попробуйте подольше.</p>' : ''}
    <div class="actions">${v?`<button class="btn ghost" data-bdrmin="${m.min}">Другое</button>${v.yt?`<a class="btn" href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener" style="text-decoration:none">Открыть ▶</a>`:''}`:'<button class="btn ghost" data-close>Закрыть</button>'}</div></div></div>`;
}

/* ---------- обработчики ---------- */
function bindBody(){
  const q = s=>$root.querySelector(s), all = (s,fn)=>$root.querySelectorAll(s).forEach(fn);
  const find = id => S.bvideos.find(v=>v.id===id);
  all('[data-bdtab]', b=>b.onclick=()=>{ UI.bdtab=b.dataset.bdtab; render(); });
  all('[data-bdcat]', b=>b.onclick=()=>{ UI.bdcat=b.dataset.bdcat; render(); });
  all('[data-bdwho]', b=>b.onclick=()=>{ UI.bdwho=b.dataset.bdwho; render(); });
  all('[data-bdnew]', b=>b.onclick=()=>{ UI.modal={type:'bvideo', isNew:true, draft:{id:'bv-'+uid(), url:'', yt:'', title:'', dur:0, cat:UI.bdcat==='all'?'yoga':UI.bdcat, tags:[], review:'', fav:false, diff:{}, done:{'7':[],'4':[]}, by:S.me, at:Date.now()}}; render(); setTimeout(()=>q('#bv-url')?.focus(),30); });
  all('[data-bdedit]', el=>el.onclick=()=>{ UI.modal={type:'bvideo', draft:JSON.parse(JSON.stringify(find(el.dataset.bdedit)))}; render(); });
  all('[data-bddiff]', b=>b.onclick=()=>{ const [id,n]=b.dataset.bddiff.split(':'), v=find(id); v.diff[S.me] = +v.diff[S.me]===+n ? 0 : +n; save(); render(); });
  all('[data-bddone]', b=>b.onclick=()=>{ const v=find(b.dataset.bddone), t=localISO(), a=v.done[S.me];
    if(a.includes(t)){ a.splice(a.lastIndexOf(t),1); save(); render(); toast('Отметка снята'); return; }
    a.push(t); save(); render();
    const s=bdWeek(S.me), g=+S.bodycfg.week[S.me]||0;
    toast(g && s.n===g ? `Цель недели выполнена: ${s.n} из ${g} 💪` : `Засчитано. ${v.title} — ${a.length}-й раз`); });
  all('[data-bdrnd]', b=>b.onclick=()=>{ UI.modal={type:'bdrnd'}; render(); });
  all('[data-bdrmin]', b=>b.onclick=()=>{ const min=+b.dataset.bdrmin, cur=UI.modal?.id;
    const pool = S.bvideos.filter(v=>(UI.bdcat==='all'||v.cat===UI.bdcat) && (!min || (v.dur && v.dur<=min*60)));
    let v = pool[Math.floor(Math.random()*pool.length)]; if(v && v.id===cur && pool.length>1) v = pool.find(x=>x.id!==cur);
    UI.modal={type:'bdrnd', min, id:v?.id}; render(); });

  /* ползунки: живой силуэт без полной перерисовки */
  all('[data-bdp]', r=>{
    r.oninput=()=>{ const p=S.bodyp[S.me]; p[r.dataset.bdp]=r.value; q('#bdv-'+r.dataset.bdp).textContent=r.value; q('#bd-fig').innerHTML=bdFigure(p,S.me); q('#bd-stats').innerHTML=bdStatsHtml(p); };
    r.onchange=()=>save();
  });
  q('#bd-logw') && (q('#bd-logw').onclick=()=>{ const p=S.bodyp[S.me]; if(!+p.w){ toast('Сначала укажите вес ползунком'); return; }
    const t=localISO(); p.log=(p.log||[]).filter(x=>x.d!==t); p.log.push({d:t, w:+p.w}); save(); render(); toast(`Вес ${String(p.w).replace('.',',')} кг записан`); });

  const m = UI.modal; if(!m || m.type!=='bvideo') return;
  const d = m.draft;
  const read = () => { d.url=q('#bv-url').value.trim(); d.title=q('#bv-title').value; d.review=q('#bv-rev').value; d.fav=q('#bv-fav').checked;
    const mn=+q('#bv-min').value; if(mn && mn!==bdMin(d.dur)) d.dur=mn*60; };
  const fetchMeta = async () => { read(); const id=bdYtId(d.url); if(!id){ toast('Не похоже на ссылку YouTube'); return; }
    d.yt=id; m.loading=true; render();
    const r = await bdYtMeta(id);
    if(UI.modal!==m) return;
    m.loading=false; if(r.dur) d.dur=r.dur; if(r.title && !d.title.trim()) d.title=r.title; render(); };
  q('#bv-fetch').onclick=fetchMeta;
  q('#bv-url').onpaste=()=>setTimeout(fetchMeta, 50);
  q('#bv-url').onkeydown=e=>{ if(e.key==='Enter') fetchMeta(); };
  all('#bv-cat button', b=>b.onclick=()=>{ read(); d.cat=b.dataset.v; d.tags=d.tags.filter(t=>(BD_TAGS[d.cat]||[]).includes(t)); render(); });
  all('#bv-tags button', b=>b.onclick=()=>{ read(); const t=b.dataset.v; d.tags = d.tags.includes(t) ? d.tags.filter(x=>x!==t) : [...d.tags, t]; render(); });
  all('#bv-diff button', b=>b.onclick=()=>{ read(); d.diff[S.me] = +d.diff[S.me]===+b.dataset.v ? 0 : +b.dataset.v; render(); });
  q('#bv-save').onclick=()=>{ read(); if(!d.yt && d.url) d.yt=bdYtId(d.url); d.title=d.title.trim(); if(!d.title && !d.yt){ q('#bv-url').focus(); return; }
    if(!d.title) d.title='Видео';
    const i=S.bvideos.findIndex(x=>x.id===d.id);
    if(i>=0){ const cur=S.bvideos[i]; d.done=cur.done; d.diff={...cur.diff, [S.me]:d.diff[S.me]}; S.bvideos[i]=d; }   // чужие отметки не трогаем
    else { S.bvideos.push(d); notify(`${pname(S.me)} добавил${fem(S.me)?'а':''} видео «${d.title}» в «Тело»`, other(S.me)); }
    UI.modal=null; save(); render(); toast(i>=0?'Сохранено':'Видео добавлено'); };
  q('#bv-del') && (q('#bv-del').onclick=()=>{ if(!confirm(`Удалить «${d.title}»?`)) return; S.bvideos=S.bvideos.filter(x=>x.id!==d.id); UI.modal=null; save(); render(); });
}

/* ---------- настройки раздела ---------- */
function bdSettings(){
  const W = S.bodycfg.week;
  return `<h3>Цель на неделю</h3>
    ${['7','4'].map(w=>swRow(esc(pname(w)), segBtns('sbdw'+w, [[0,'Без цели'],[2,'2'],[3,'3'],[4,'4'],[5,'5'],[7,'7']], W[w]||0))).join('')}
    <p class="fhint">Сколько тренировок, практик или медитаций в неделю. Прогресс виден в полоске недели.</p>`;
}
function bindBodySettings(){
  ['7','4'].forEach(w=>$root.querySelectorAll(`[data-sbdw${w}]`).forEach(b=>b.onclick=()=>{ S.bodycfg.week[w]=+b.dataset['sbdw'+w]; save(); render(); }));
}

/* ---------- встраивание ---------- */
(function(){
  if(!SECTIONS.some(s=>s[0]==='body')){ const i = SECTIONS.findIndex(s=>s[0]==='books'); SECTIONS.splice(i<0?SECTIONS.length:i, 0, ['body','🧘','Тело']); }
  if(!SET_PAGES.some(s=>s[0]==='body')){ const i = SET_PAGES.findIndex(s=>s[0]==='books'); SET_PAGES.splice(i<0?SET_PAGES.length:i, 0, ['body','Тело']); }
  const _soon = soonView, _modal = modalView, _bind = bind, _render = render, _sp = settingsPage, _bs = bindSettings;
  soonView = k => k==='body' ? bodyView() : _soon(k);
  modalView = () => { const t = UI.modal?.type; return t==='bvideo' ? bdEditModal(UI.modal) : t==='bdrnd' ? bdRndModal(UI.modal) : _modal(); };
  bind = () => { _bind(); if(UI.section==='body' || ['bvideo','bdrnd'].includes(UI.modal?.type)) bindBody(); };
  settingsPage = p => p==='body' ? bdSettings() : _sp(p);
  bindSettings = () => { _bs(); if(UI.modal?.type==='settings' && UI.modal.page==='body') bindBodySettings(); };
  render = () => { _render(); $root.querySelector('.nav [data-sec="body"] small')?.remove(); };
})();

document.head.insertAdjacentHTML('beforeend', `<style>
.bd-week{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.bd-wk{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:12px 14px}
.bd-wkh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.bd-wkh small{color:var(--muted);font-size:12px;margin-left:auto}
.bd-dots{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:10px}
.bd-dots span{height:26px;border-radius:8px;background:var(--bg2);display:grid;place-items:center;position:relative}
.bd-dots span.today{outline:2px solid var(--line);outline-offset:1px}
.bd-dots i{font-style:normal;font-size:10px;color:var(--soft)}.bd-dots span.on i{color:#fff}
.bd-cats .seg{overflow-x:auto;max-width:100%}.bd-cats .seg button{white-space:nowrap}.bd-rnd{margin-left:auto;padding:8px 12px}
.bd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.bd-card{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column}
.bd-thumb{display:block;position:relative;aspect-ratio:16/9;background:var(--bg2);overflow:hidden;border-radius:0}
.bk-pick .bd-thumb{border-radius:12px}
.bd-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.bd-noimg{width:100%;height:100%;display:grid;place-items:center;font-size:40px}
.bd-dur{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.75);color:#fff;font-size:12px;font-weight:600;padding:2px 6px;border-radius:6px}
.bd-play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:30px;opacity:0;background:rgba(0,0,0,.25);transition:.15s}
.bd-thumb:hover .bd-play{opacity:1}
.bd-body{padding:12px 14px;display:flex;flex-direction:column;gap:8px;flex:1}
.bd-title{cursor:pointer}.bd-title b{display:block;line-height:1.3}.bd-title small{color:var(--muted);font-size:12px}
.bd-tags{display:flex;gap:4px;flex-wrap:wrap}.bd-tags .chip{font-size:11px;background:var(--bg2)}
.bd-rev{margin:0;font-size:13px;color:var(--muted)}
.bd-foot{display:flex;align-items:center;gap:10px;margin-top:auto;flex-wrap:wrap}
.bd-diffs{display:flex;flex-direction:column;gap:4px}
.bd-diff{display:flex;align-items:center;gap:3px}.bd-diff .badge{width:18px;height:18px;font-size:9px;margin-right:3px;border-width:1px}
.bd-diff button{width:12px;height:12px;border-radius:3px;background:var(--bg2);border:0;padding:0}
.bd-diff button:not([disabled]):hover{outline:1.5px solid var(--soft)}
.bd-diff.big button{width:24px;height:24px;border-radius:7px}.bd-diff.big{gap:5px;height:44px}.bd-diff.big small{color:var(--muted);font-size:12px;margin-left:6px}
.bd-cnt{display:flex;gap:6px;font-size:12px;color:var(--muted);margin-left:auto}.bd-cnt span{display:flex;align-items:center;gap:2px}.bd-cnt .badge{width:18px;height:18px;font-size:9px;border-width:1px}
.bv-prev{display:flex;gap:10px;align-items:center;margin:-4px 0 14px;background:var(--bg);border-radius:12px;padding:8px}
.bv-prev img{width:120px;border-radius:8px}.bv-prev small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.bd-me{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:20px;background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:18px;align-items:start}
.bd-figbox{display:flex;justify-content:center;background:var(--bg);border-radius:14px;padding:10px}
.bd-fig{width:100%;max-width:240px;height:auto}.bd-figt{font-size:8px;fill:var(--soft)}
.bd-params{display:flex;flex-direction:column;gap:10px}
.bd-sl label{display:flex;gap:6px;font-size:13px;color:var(--muted);align-items:baseline}.bd-sl label b{margin-left:auto;color:var(--text);font-size:15px}
.bd-sl input{width:100%;accent-color:var(--c7)}
.bd-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bd-stats .stat{padding:10px;box-shadow:none;background:var(--bg)}.bd-stats .stat b{font-size:18px}
.bd-spark svg{width:100%;height:42px}.bd-spark small{color:var(--muted);font-size:12px}
@media (max-width:820px){
  .bd-week{grid-template-columns:1fr}.bd-grid{grid-template-columns:1fr}
  .bd-me{grid-template-columns:1fr}.bd-fig{max-width:170px}
  .bd-rnd{margin-left:0}
}
</style>`);
