/* ===== Помощник 47 — раздел «Продукты» ===== */
const FOOD_CATS = [['veg','Овощи и фрукты'],['meat','Мясо и рыба'],['dairy','Молочное и яйца'],['dry','Бакалея и сладкое'],['home','Дом и аптека']];
function seedFood(){
  const H = 'https://wolt.com/en/me/order-history/';
  const stores = {
    agro:{name:'Agro',last:'',link:''},
    gurulebi:{name:'Agro Market Gurulebi',last:'',link:''},
    europroduct:{name:'Europroduct Zhvania',last:'',link:''},
    carrefour:{name:'Carrefour Vake',last:'',link:''},
    goodwill:{name:'Goodwill Vake',last:'',link:''},
    gastronome:{name:'Gastronome Abashidze',last:'',link:''},
    spar:{name:'Vake by SPAR',last:'',link:''},
    gpc:{name:'GPC (аптека)',last:'',link:''},
  };
  const I = (name,store,price,unit,cat,count=1) => ({id:uid(),name,store,price,unit,cat,count,status:'ok',qty:'',qtyFull:'',bought:'',expiry:'',warned:false});
  const items = typeof PRIV_FOOD!=='undefined' ? PRIV_FOOD.itemsFn(I) : [];
  // история заказов Wolt (дата, магазин, сумма, тип: food/out/care)
  const raw = typeof PRIV_FOOD!=='undefined' ? PRIV_FOOD.spendRaw : '';
  if(typeof PRIV_FOOD!=='undefined') Object.entries(PRIV_FOOD.last).forEach(([k,v])=>{ if(stores[k]) stores[k].last=H+v; });
  const T = {f:'food',o:'out',c:'care'};
  const spend = raw ? raw.split(';').map(r=>{ const p=r.split(' '); return {date:p[0], store:p.slice(1,-2).join(' '), sum:+p[p.length-2], cat:T[p[p.length-1]]}; }) : [];
  return {stores, items, spend, tab:'buy'};
}
if(!S.food){ S.food = seedFood(); save(); }
patchOrders();

const SPEND_CATS = {food:['Продукты','var(--c7)'], out:['Готовая еда','#B08A5E'], care:['Аптека и уход','var(--c4)']};
const storeName = k => S.food.stores[k]?.name || k;

function foodWarn(it){
  const w = [];
  if(it.qty!=='' && it.qtyFull && +it.qty <= +it.qtyFull*(S.settings.food.warnPct/100)) w.push('мало осталось');
  if(it.expiry){
    const end = new Date(it.expiry).getTime(), now = Date.now();
    const start = it.bought ? new Date(it.bought).getTime() : null;
    if(end < now) w.push('срок истёк');
    else if(start && end>start && (end-now) <= (end-start)*(S.settings.food.warnPct/100)) w.push('скоро истечёт срок');
    else if(!start && end-now < 2*864e5) w.push('скоро истечёт срок');
  }
  return w;
}
function checkFoodWarnings(){
  let changed = false;
  S.food.items.forEach(it=>{
    const w = foodWarn(it);
    if(w.length && !it.warned && it.status==='ok'){ notify(`${it.name}: ${w.join(', ')}`, 'shared'); it.warned = true; changed = true; }
    if(!w.length && it.warned){ it.warned = false; changed = true; }
  });
  if(changed) save();
}
const foodOutCount = () => S.food.items.filter(i=>i.status==='out').length;

function foodView(){
  checkFoodWarnings();
  const tab = S.food.tab || 'buy';
  const n = foodOutCount();
  const tabs = [['buy',`Докупить${n?' · '+n:''}`],['stock','Запасы'],['spend','Траты']];
  return `<div class="filters"><div class="seg">${tabs.map(([k,t])=>`<button data-ftab="${k}" class="${tab===k?'on':''}">${t}</button>`).join('')}</div>
    <div class="sp" style="flex:1"></div><button class="btn ghost" data-fnew>+ Продукт</button></div>
    ${tab==='buy' ? buyView() : tab==='stock' ? stockView() : spendView()}`;
}
function buyView(){
  const out = S.food.items.filter(i=>i.status==='out');
  const quick = `<div class="fquick"><input class="inp" id="fq" placeholder="Что закончилось? Начните вводить…" list="fq-list" autocomplete="off">
    <datalist id="fq-list">${S.food.items.filter(i=>i.status!=='out').map(i=>`<option value="${esc(i.name)}">`).join('')}</datalist>
    <button class="btn" id="fq-add">Закончилось</button></div>`;
  if(!out.length) return quick + `<div class="empty" style="margin-top:12px">Всё есть. Когда что-то закончится, нажмите «Закончилось» здесь или в «Запасах», и продукт попадёт в список нужного магазина.</div>`;
  const by = {};
  out.forEach(i=>(by[i.store] = by[i.store]||[]).push(i));
  const groups = Object.entries(by).sort((a,b)=>b[1].length-a[1].length);
  const total = out.reduce((a,i)=>a+(+i.price||0),0);
  return quick + `<p class="fhint">${out.length} ${plural(out.length,'продукт','продукта','продуктов')} в ${groups.length} ${plural(groups.length,'магазине','магазинах','магазинах')}, примерно ${money(total)}. Откройте магазин в Wolt, соберите корзину и отметьте купленное.</p>
  <div class="fgroups">${groups.map(([k,list])=>{
    const st = S.food.stores[k]||{name:k};
    const sum = list.reduce((a,i)=>a+(+i.price||0),0);
    return `<section class="fstore"><div class="fsh"><b>${esc(st.name)}</b><span class="n">${list.length} · ≈ ${money(sum)}</span></div>
      ${list.map(i=>`<div class="frow"><button class="check" data-fbought="${i.id}" title="Куплено"></button><div class="fname" data-fedit="${i.id}">${esc(i.name)}<small>${esc(i.unit||'')}</small></div><span class="fprice">${i.price?money(+i.price):''}</span></div>`).join('')}
      <div class="flinks">
        ${st.link?`<a class="btn blue" href="${esc(st.link)}" target="_blank" rel="noopener">Магазин в Wolt ↗</a>`:''}
        ${st.last?`<a class="btn ${st.link?'ghost':'blue'}" href="${esc(st.last)}" target="_blank" rel="noopener">Прошлый заказ ↗</a>`:''}
        <button class="btn ghost" data-fstore="${k}">${st.link?'Ссылка':'+ ссылка на магазин'}</button>
        <button class="btn ghost" data-forder="${k}">Записать заказ</button>
      </div></section>`;}).join('')}</div>`;
}
function stockView(){
  const q = (UI.fsearch||'').toLowerCase();
  const items = S.food.items.filter(i=>!q || i.name.toLowerCase().includes(q));
  return `<input class="inp" id="fsearch" placeholder="Поиск" value="${esc(UI.fsearch||'')}" style="margin-bottom:12px;max-width:360px">
  <div class="fcats">${FOOD_CATS.map(([c,t])=>{
    const list = items.filter(i=>i.cat===c).sort((a,b)=>(b.count||0)-(a.count||0));
    if(!list.length) return '';
    return `<section class="fstore"><div class="fsh"><b>${t}</b><span class="n">${list.length}</span></div>
      ${list.map(i=>{ const w=foodWarn(i); const pct = i.qtyFull? Math.max(0,Math.min(100,Math.round(+i.qty/+i.qtyFull*100))) : null;
        return `<div class="frow ${i.status==='out'?'out':''}">
        <div class="fname" data-fedit="${i.id}">${esc(i.name)}${i.count>1?' <span class="fav" title="Частый продукт">★</span>':''}
          <small>${esc(storeName(i.store))}${i.unit?' · '+esc(i.unit):''}${i.price?' · '+money(+i.price):''}${i.expiry?' · до '+new Date(i.expiry).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):''}</small>
          ${pct!==null?`<div class="prog"><i style="width:${pct}%;${pct<=20?'background:var(--warn)':''}"></i></div>`:''}
          ${w.length?`<span class="chip wait">${w.join(', ')}</span>`:''}</div>
        ${i.status==='out' ? `<button class="fbtn back" data-fback="${i.id}">Есть</button>` : `<button class="fbtn" data-fout="${i.id}">Закончилось</button>`}
      </div>`;}).join('')}</section>`;}).join('')}</div>`;
}
function spendView(){
  const sp = S.food.spend;
  if(!sp.length) return `<div class="empty">Трат на продукты пока нет. Нажмите «Записать заказ» у магазина в списке «Докупить» или «Записать трату» ниже.</div><div style="margin-top:12px"><button class="btn ghost" data-forder="">+ Записать трату</button></div>`;
  const months = [...new Set(sp.map(s=>s.date.slice(0,7)))].sort().reverse();
  const mName = m => new Date(m+'-01').toLocaleDateString('ru-RU',{month:'long'});
  const byM = months.map(m=>{ const r={m,food:0,out:0,care:0}; sp.filter(s=>s.date.startsWith(m)).forEach(s=>r[s.cat]+=s.sum); return r; });
  const max = Math.max(...byM.map(r=>r.food+r.out+r.care),1);
  const now = new Date(); const weekAgo = new Date(now-7*864e5).toISOString().slice(0,10);
  const week = sp.filter(s=>s.date>weekAgo && s.cat==='food').reduce((a,s)=>a+s.sum,0);
  const st = {}; sp.filter(s=>s.cat==='food').forEach(s=>{ const r=st[s.store]=st[s.store]||{n:0,sum:0}; r.n++; r.sum+=s.sum; });
  const top = Object.entries(st).sort((a,b)=>b[1].n-a[1].n).slice(0,6);
  const full = byM.filter(r=>r.m!==months[months.length-1]); // первый месяц неполный
  const avgFood = full.length ? full.reduce((a,r)=>a+r.food,0)/full.length : 0;
  return `<div class="fstats">
    <div class="stat"><small>Продукты за 7 дней</small><b>${money(week)}</b></div>
    <div class="stat"><small>Продукты в среднем за месяц</small><b>${money(avgFood)}</b></div>
    <div class="stat"><small>Заказов продуктов за месяц</small><b>${sp.filter(s=>s.cat==='food'&&s.date.startsWith(months[0])).length}</b></div>
  </div>
  <section class="fstore"><div class="fsh"><b>По месяцам</b><span class="n">${Object.values(SPEND_CATS).map(([t,c])=>`<i class="lg" style="background:${c}"></i>${t}`).join(' ')}</span></div>
    ${byM.map(r=>{ const tot=r.food+r.out+r.care; return `<div class="mrow"><span class="ml">${mName(r.m)}</span><div class="mbar">${['food','out','care'].map(k=>r[k]?`<i style="width:${r[k]/max*100}%;background:${SPEND_CATS[k][1]}" title="${SPEND_CATS[k][0]}: ${money(r[k])}"></i>`:'').join('')}</div><span class="mv">${money(tot)}</span></div>
      <div class="msub">продукты ${money(r.food)}${r.out?' · готовая еда '+money(r.out):''}${r.care?' · аптека и уход '+money(r.care):''}</div>`;}).join('')}
    <small style="color:var(--muted)">Август с 19-го. Данные из истории Wolt, новые заказы добавляйте кнопкой «Записать заказ».</small></section>
  <section class="fstore"><div class="fsh"><b>Где покупаем чаще</b></div>
    ${top.map(([k,r])=>`<div class="frow"><div class="fname">${esc(k)}<small>${r.n} ${plural(r.n,'заказ','заказа','заказов')}, в среднем ${money(r.sum/r.n)}</small></div><span class="fprice">${money(r.sum)}</span></div>`).join('')}</section>
  ${typeof PRIV_FOOD!=='undefined' ? `  <section class="fstore"><div class="fsh"><b>Где выгоднее</b></div>
    <div class="frow"><div class="fname">Песто<small>Gastronome (De Cecco) 8,95 ₾, Carrefour (Barilla) 19,95 ₾, Europroduct (Barilla) 22,50 ₾</small></div></div>
    <div class="frow"><div class="fname">Молоко<small>Mlekpol 4,99 ₾ и Santé 4,99 ₾ против Giglio 6,99 ₾</small></div></div>
    <div class="frow"><div class="fname">Ромашковый чай<small>Carrefour 4,99 ₾ за 25 пак., GPC 5,25 ₾ за 20</small></div></div>
  </section>` : ''}
  <div style="margin-top:12px"><button class="btn ghost" data-forder="">+ Записать трату</button></div>`;
}

/* ---- модалки продуктов ---- */
function foodItemModal(m){
  const d = m.draft;
  const storeOpts = Object.entries(S.food.stores).map(([k,s])=>`<option value="${k}" ${d.store===k?'selected':''}>${esc(s.name)}</option>`).join('');
  return `<div class="scrim" data-close><div class="sheet"><h2>${m.isNew?'Новый продукт':esc(d.name)}</h2>
    <div class="field"><label>Название</label><input class="inp" id="fi-name" value="${esc(d.name)}"></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:2"><label>Магазин</label><select class="inp" id="fi-store">${storeOpts}<option value="__new">+ другой магазин…</option></select></div>
      <div style="flex:1"><label>Цена</label>${amtField('fi-price',{gel:d.price})}</div></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Фасовка</label><input class="inp" id="fi-unit" value="${esc(d.unit)}" placeholder="500 г"></div>
      <div style="flex:1"><label>Раздел</label><select class="inp" id="fi-cat">${FOOD_CATS.map(([c,t])=>`<option value="${c}" ${d.cat===c?'selected':''}>${t}</option>`).join('')}</select></div></div>
    <p class="fhint">Дальше по желанию. Если заполнить, 47 предупредит, когда останется ${S.settings.food.warnPct}%.</p>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Осталось</label><input class="inp" id="fi-qty" type="number" min="0" value="${d.qty}" placeholder="например 2"></div>
      <div style="flex:1"><label>Из (полный запас)</label><input class="inp" id="fi-full" type="number" min="0" value="${d.qtyFull}" placeholder="10"></div></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Куплено</label><input class="inp" id="fi-bought" type="date" value="${d.bought}"></div>
      <div style="flex:1"><label>Годен до</label><input class="inp" id="fi-exp" type="date" value="${d.expiry}"></div></div>
    <div class="actions">${m.isNew?'':'<button class="del" id="fi-del">Удалить</button>'}<button class="btn ghost" data-close>Отмена</button><button class="btn" id="fi-save">Сохранить</button></div>
  </div></div>`;
}
function storeModal(m){
  const st = S.food.stores[m.key];
  return `<div class="scrim" data-close><div class="sheet"><h2>${esc(st.name)}</h2>
    <p class="fhint">Откройте магазин в приложении или на сайте Wolt, нажмите «Поделиться» и вставьте ссылку сюда. Тогда кнопка будет вести прямо в магазин.</p>
    <div class="field"><label>Ссылка на магазин в Wolt</label><input class="inp" id="st-link" value="${esc(st.link)}" placeholder="https://wolt.com/…"></div>
    <div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn" id="st-save">Сохранить</button></div></div></div>`;
}
function orderModal(m){
  const name = m.key ? storeName(m.key) : '';
  return `<div class="scrim" data-close><div class="sheet"><h2>Записать трату</h2>
    <div class="field"><label>Где</label><input class="inp" id="or-store" value="${esc(name)}" placeholder="Agro"></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Сумма</label>${amtField('or-sum',null)}</div>
      <div style="flex:1"><label>Дата</label><input class="inp" id="or-date" type="date" value="${todayISO()}"></div></div>
    <div class="field"><label>Что это</label><div class="pick" id="or-cat">${Object.entries(SPEND_CATS).map(([k,[t]],i)=>`<button data-v="${k}" class="${i===0?'on':''}">${t}</button>`).join('')}</div></div>
    ${m.key?`<label class="fhint" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="or-mark" checked> Отметить всё из этого магазина купленным</label>`:''}
    <div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn" id="or-save">Сохранить</button></div></div></div>`;
}

function setFoodStatus(id, status){
  const it = S.food.items.find(i=>i.id===id); if(!it) return;
  it.status = status;
  if(status==='ok'){ it.bought = todayISO(); if(it.qtyFull) it.qty = it.qtyFull; it.count=(it.count||0)+1; it.warned=false; }
  save(); render();
  toast(status==='out' ? `${it.name} → докупить в ${storeName(it.store)}` : `${it.name}: куплено`);
}
function bindFood(){
  const q = s=>$root.querySelector(s), all = (s,fn)=>$root.querySelectorAll(s).forEach(fn);
  all('[data-ftab]', b=>b.onclick=()=>{ S.food.tab=b.dataset.ftab; save(); render(); });
  all('[data-fout]', b=>b.onclick=()=>setFoodStatus(b.dataset.fout,'out'));
  all('[data-fback]', b=>b.onclick=()=>setFoodStatus(b.dataset.fback,'ok'));
  all('[data-fbought]', b=>b.onclick=()=>setFoodStatus(b.dataset.fbought,'ok'));
  all('[data-fedit]', el=>el.onclick=()=>{ const it=S.food.items.find(i=>i.id===el.dataset.fedit); if(it.by && it.by!==S.me){ toast(`Продукт добавил${it.by==='4'||it.by===4?'а':''} ${pname(it.by)}. Менять его может только автор`); return; } UI.modal={type:'fitem',draft:{...it}}; render(); });
  all('[data-fnew]', b=>b.onclick=()=>{ UI.modal={type:'fitem',isNew:true,draft:{id:uid(),name:'',store:'agro',price:'',unit:'',cat:'veg',count:0,status:'ok',qty:'',qtyFull:'',bought:'',expiry:'',warned:false}}; render(); setTimeout(()=>q('#fi-name')?.focus(),30); });
  all('[data-fstore]', b=>b.onclick=()=>{ UI.modal={type:'fstore',key:b.dataset.fstore}; render(); });
  all('[data-forder]', b=>b.onclick=()=>{ UI.modal={type:'forder',key:b.dataset.forder}; render(); setTimeout(()=>q('#or-sum')?.focus(),30); });
  const fs = q('#fsearch'); if(fs){ fs.oninput=e=>{ UI.fsearch=e.target.value; const pos=e.target.selectionStart; render(); const n=q('#fsearch'); n.focus(); n.setSelectionRange(pos,pos); }; }
  const fq = q('#fq');
  if(fq){
    const go=()=>{ const v=fq.value.trim(); if(!v) return;
      let it=S.food.items.find(i=>i.name.toLowerCase()===v.toLowerCase());
      if(!it){ it={by:S.me,id:uid(),name:v,store:'agro',price:'',unit:'',cat:'veg',count:0,status:'ok',qty:'',qtyFull:'',bought:'',expiry:'',warned:false}; S.food.items.push(it); }
      setFoodStatus(it.id,'out'); setTimeout(()=>$root.querySelector('#fq')?.focus(),30); };
    q('#fq-add').onclick=go; fq.onkeydown=e=>{ if(e.key==='Enter') go(); };
  }
  if(!UI.modal) return;
  const m = UI.modal;
  if(m.type==='fitem'){
    q('#fi-store').onchange=e=>{ if(e.target.value==='__new'){ const n=prompt('Название магазина'); if(n){ const k='s'+uid(); S.food.stores[k]={name:n,last:'',link:''}; m.draft.store=k; } readFi(); render(); } };
    const readFi=()=>{ const d=m.draft; d.name=q('#fi-name').value.trim(); if(q('#fi-store').value!=='__new') d.store=q('#fi-store').value; { const pr=readAmt('fi-price'); d.price = pr ? pr.gel : ''; } d.unit=q('#fi-unit').value; d.cat=q('#fi-cat').value; d.qty=q('#fi-qty').value; d.qtyFull=q('#fi-full').value; d.bought=q('#fi-bought').value; d.expiry=q('#fi-exp').value; };
    q('#fi-save').onclick=()=>{ readFi(); const d=m.draft; if(!d.name){ q('#fi-name').focus(); return; } d.warned=false; d.by=d.by||S.me;
      const i=S.food.items.findIndex(x=>x.id===d.id); if(i>=0) S.food.items[i]=d; else S.food.items.push(d);
      UI.modal=null; save(); render(); toast('Сохранено'); };
    q('#fi-del') && (q('#fi-del').onclick=()=>{ S.food.items=S.food.items.filter(x=>x.id!==m.draft.id); UI.modal=null; save(); render(); });
  }
  if(m.type==='fstore'){
    q('#st-save').onclick=()=>{ const v=q('#st-link').value.trim(); if(v && !/^https:\/\/(www\.)?wolt\.com\//.test(v)){ toast('Нужна ссылка wolt.com'); return; } S.food.stores[m.key].link=v; UI.modal=null; save(); render(); };
  }
  if(m.type==='forder'){
    let cat='food';
    all('#or-cat button', b=>b.onclick=()=>{ cat=b.dataset.v; all('#or-cat button', x=>x.classList.toggle('on', x===b)); });
    q('#or-save').onclick=()=>{ const amt=readAmt('or-sum'); if(!amt||!amt.gel){ q('#or-sum').focus(); return; } const sum=amt.gel;
      S.food.spend.unshift({date:q('#or-date').value||todayISO(), store:q('#or-store').value.trim()||'—', sum, cat, v:amt.v, cur:amt.cur, by:S.me});
      if(m.key && q('#or-mark')?.checked) S.food.items.filter(i=>i.store===m.key && i.status==='out').forEach(i=>{ i.status='ok'; i.bought=todayISO(); if(i.qtyFull) i.qty=i.qtyFull; i.count=(i.count||0)+1; i.warned=false; });
      UI.modal=null; save(); render(); toast(`Записано: ${money(sum)}`); };
  }
}

function patchOrders(){
  if(typeof ORDERS==='undefined') return;
  let ch = false;
  (S.food?.spend||[]).forEach(s=>{
    if(s.items) return;
    const o = ORDERS[`${s.date}|${(+s.sum).toFixed(2)}`];
    if(o){ s.items = o.items; if(o.skipped) s.skipped = o.skipped; ch = true; }
  });
  if(ch) save();
}
