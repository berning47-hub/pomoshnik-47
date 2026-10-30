/* ===== Помощник 47 — раздел «Деньги» ===== */
const MCATS = [
  ['food','Продукты','#7A4A2A'], ['out','Готовая еда и доставка','#B08A5E'], ['fun','Прогулки и кофе','#6E9A68'],
  ['subs','Подписки','#7B5EA7'], ['study','Обучение','#3F7CAC'], ['home','Дом','#8C7765'],
  ['clothes','Одежда и обувь','#C2708A'], ['health','Здоровье и уход','#2F5F8F'], ['transport','Транспорт','#4F8F8A'], ['other','Другое','#B9A592']
];
const MCAT = Object.fromEntries(MCATS.map(c=>[c[0],c]));
const SRC = {tbc:'TBC', bybit:'Bybit Card', cash:'Наличные'};
const WOLT_MAP = {food:'food', out:'out', care:'health'};
const wkey = s => `w|${s.date}|${s.store}|${s.sum}`;

function ensureMoney(){
  if(!S.money){ S.money = {budget:'', fixed:[{id:uid(),name:'Аренда',amount:''}], incomes:[], log:[], savings:[], warned:{}}; save(); }
  const M = S.money;
  M.warned = M.warned || {}; M.savings = M.savings || [];
  if(M.log.some(r=>r.cat==='coffee')){ M.log.forEach(r=>{ if(r.cat==='coffee') r.cat='fun'; }); save(); }
}

function moneyCalc(){
  ensureMoney();
  const M = S.money, now = new Date(), ym = localISO(now).slice(0,7), today = localISO(now);
  const dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysLeft = dim - now.getDate() + 1;
  const inMonth = r => r.date.startsWith(ym);
  const card = S.settings.money.woltCard;
  const wolt = (S.food?.spend||[]).filter(inMonth).map(s=>({id:wkey(s), date:s.date, sum:s.sum, cat:WOLT_MAP[s.cat]||'other', note:s.store, src:card, auto:true, wolt:s, v:s.v, cur:s.cur}));
  const manual = M.log.filter(inMonth).map(r=>({...r, src:r.src||'tbc'}));
  const all = [...wolt, ...manual];
  const spent = all.reduce((a,r)=>a+r.sum,0);
  const spentToday = all.filter(r=>r.date===today).reduce((a,r)=>a+r.sum,0);
  const spentBefore = spent - spentToday;
  const incomes = M.incomes.filter(inMonth).reduce((a,r)=>a+r.sum,0);
  const fixed = M.fixed.reduce((a,f)=>a+(+f.amount||0),0);
  const pool = (+M.budget||0) + incomes;
  const free = pool - fixed;
  const left = free - spent;
  const daily = (free - spentBefore) / daysLeft;
  const byCat = {}, bySrc = {};
  all.forEach(r=>{ byCat[r.cat]=(byCat[r.cat]||0)+r.sum; bySrc[r.src]=(bySrc[r.src]||0)+r.sum; });
  return {M, ym, today, dim, daysLeft, all, spent, spentToday, incomes, fixed, pool, free, left, daily, todayLeft: daily - spentToday, set: !!(+M.budget), byCat, bySrc};
}

function moneyWarnings(c){
  if(!c.set) return;
  const W = c.M.warned, k = c.ym;
  const pct = c.free>0 ? c.spent/c.free : 1;
  if(pct>=0.8 && !W[k+'80']){ W[k+'80']=1; notify(`Потрачено ${Math.round(pct*100)}% бюджета месяца, осталось ${money(Math.max(0,c.left))}`, 'shared'); save(); }
  if(c.left<0 && !W[k+'100']){ W[k+'100']=1; notify(`Бюджет месяца превышен на ${money(-c.left)}`, 'shared'); save(); }
  LIMIT_KEYS.forEach(key=>{
    const lim = c.free*(+S.settings.money.limits[key]||0)/100;
    if(lim>0 && (c.byCat[key]||0)>lim && !W[k+'c'+key]){ W[k+'c'+key]=1; notify(`Лимит «${MCAT[key][1]}» превышен: ${money(c.byCat[key])} из ${money(lim)}`, 'shared'); save(); }
  });
}

function moneyView(){
  const c = moneyCalc();
  if(!c.set) return `<div class="soon"><h2>Сколько денег на этот месяц?</h2>
    <p>Укажите сумму, которой хватит до конца месяца. 47 вычтет обязательные платежи и покажет, сколько можно тратить в день.</p>
    <div class="fquick">${amtField('mb-first',null,'например 2000')}<button class="btn" id="mb-first-save">Дальше</button></div></div>`;
  moneyWarnings(c);
  const J = UI.mj = UI.mj || {cat:'all', by:'date', dir:-1};
  const ok = c.todayLeft >= 0;
  const mName = new Date().toLocaleDateString('ru-RU',{month:'long'});
  const pctSpent = c.pool>0 ? Math.min(100, c.spent/c.pool*100) : 0, pctFixed = c.pool>0 ? Math.min(100-pctSpent, c.fixed/c.pool*100) : 0;
  // журнал
  let rows = c.all.filter(r=>J.cat==='all' || r.cat===J.cat);
  rows.sort((a,b)=> J.by==='sum' ? (a.sum-b.sum)*J.dir : (a.date.localeCompare(b.date)||a.sum-b.sum)*J.dir);
  const arrow = by => J.by===by ? (J.dir<0?' ↓':' ↑') : '';
  const catsHere = MCATS.filter(([k])=>c.byCat[k]);
  // накопления
  const sv = c.M.savings, svTotal = sv.reduce((a,x)=>a+toGEL(+x.v||0,x.cur),0);
  const day = new Date().getDate(), burn = c.spent/day*30;
  const months = burn>0 ? svTotal/burn : 0;
  return `
  <div class="mhero ${ok?'':'over'}">
    <div><small>Сегодня можно потратить</small><b>${money(Math.max(0,c.todayLeft))}</b>
      <span>${c.free<=0?'Обязательные платежи съедают весь бюджет':ok?`из ${money(Math.max(0,c.daily))} на день, уже потрачено ${money(c.spentToday)}`:`на ${money(-c.todayLeft)} больше дневного лимита: завтра он станет меньше`}</span></div>
    <button class="btn ghost" data-mset>Бюджет</button>
  </div>
  <div class="fstats">
    <div class="stat"><small>Осталось на ${mName}</small><b style="${c.left<0?'color:var(--bad)':''}">${money(c.left)}</b></div>
    <div class="stat"><small>Дней до конца месяца</small><b>${c.daysLeft}</b></div>
    <div class="stat"><small>Потрачено</small><b>${money(c.spent)}</b></div>
  </div>
  <div class="mgrid">
   <div class="mcol">
    <section class="fstore"><div class="fsh"><b>Бюджет ${mName}</b><span class="n">${money(c.pool)}${c.incomes?` (с приходом ${money(c.incomes)})`:''}</span></div>
      <div class="mbar big"><i style="width:${pctFixed}%;background:var(--soft)" title="Обязательные"></i><i style="width:${pctSpent}%;background:var(--c7)" title="Потрачено"></i></div>
      <div class="msub" style="margin:6px 0 0">обязательные ${money(c.fixed)} · потрачено ${money(c.spent)} · свободно ${money(Math.max(0,c.pool-c.fixed-c.spent))}</div></section>
    <section class="fstore"><div class="fsh"><b>Записать трату</b></div>
      <div class="field">${amtField('mq-sum',null,'Сумма')}</div>
      <div class="field" style="display:flex;gap:8px">
        <select class="inp" id="mq-cat" aria-label="Категория">${MCATS.map(([k,n])=>`<option value="${k}" ${k==='fun'?'selected':''}>${n}</option>`).join('')}</select>
        <select class="inp" id="mq-src" style="width:auto" aria-label="Карта">${Object.entries(SRC).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></div>
      <div class="fquick"><input class="inp" id="mq-note" placeholder="Заметка (необязательно)"><button class="btn" id="mq-add">Записать</button></div></section>
    <section class="fstore"><div class="fsh"><b>Куда уходят деньги</b><button class="linkbtn" data-mlimits>Лимиты</button></div>
      ${MCATS.map(([k,n,col])=>{ const v=c.byCat[k]||0, lim=c.free*(+S.settings.money.limits[k]||0)/100, over=lim>0&&v>lim;
        return `<div class="lrow"><div class="lt"><span class="mdot" style="background:${col}"></span>${n}<span class="lv ${over?'bad':''}">${money(v)}${lim>0?` / ${money(lim)}`:''}</span></div>
          <div class="mbar"><i style="width:${lim>0?Math.min(100,v/lim*100):(v>0?100:0)}%;background:${over?'var(--bad)':col}"></i></div></div>`; }).join('')}</section>
    <section class="fstore"><div class="fsh"><b>Накопления</b><span class="n">${money(svTotal)}</span></div>
      ${sv.length?sv.map(x=>`<div class="frow"><div class="fname" data-msv="${x.id}">${esc(x.name)}<small>${moneyIn(+x.v,x.cur)}${x.cur!==curDef()?` · ≈ ${money(toGEL(+x.v,x.cur))}`:''}</small></div></div>`).join(''):'<div class="empty">Добавьте, сколько у вас отложено</div>'}
      ${months>0?`<p class="fhint">При расходах как сейчас накоплений хватит примерно на ${months<1?'меньше месяца':months.toFixed(1).replace('.',',')+' мес.'}</p>`:''}
      <button class="addinline" id="msv-add">+ Накопления</button></section>
    <section class="fstore"><div class="fsh"><b>С каких карт</b></div>
      ${Object.entries(SRC).map(([k,n])=>`<div class="frow"><div class="fname" style="cursor:default">${n}</div><span class="fprice" style="color:var(--text);font-weight:600">${money(c.bySrc[k]||0)}</span></div>`).join('')}
      <p class="fhint">Wolt записывается на карту, выбранную в настройках раздела.</p></section>
   </div>
   <div class="mcol">
    <section class="fstore mjournal"><div class="fsh"><b>Журнал</b><span class="n">${rows.length}</span></div>
      <div class="jchips"><button data-mjc="all" class="${J.cat==='all'?'on':''}">Все</button>${catsHere.map(([k,n])=>`<button data-mjc="${k}" class="${J.cat===k?'on':''}">${n}</button>`).join('')}</div>
      <div class="jh"><button data-mjs="date" class="${J.by==='date'?'on':''}">Дата${arrow('date')}</button><button data-mjs="sum" class="${J.by==='sum'?'on':''}">Сумма${arrow('sum')}</button></div>
      ${rows.length?rows.map(r=>`<div class="frow jrow ${r.wolt?'link':''}" ${r.wolt?`data-mord="${esc(r.id)}"`:''}>
        <span class="mdot" style="background:${MCAT[r.cat][2]}"></span>
        <div class="fname" style="cursor:inherit">${esc(r.note||MCAT[r.cat][1])}<small>${new Date(r.date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})} · ${esc(MCAT[r.cat][1])} · ${SRC[r.src]||''}${r.auto&&r.wolt.items?' · состав':''}${!r.auto&&r.who?' · '+esc(pname(r.who)):''}</small></div>
        <span class="fprice" style="color:var(--text);font-weight:600;text-align:right">−${money(r.sum)}${r.cur&&r.cur!==curDef()?`<small style="display:block;font-weight:400;color:var(--muted)">${moneyIn(+r.v,r.cur)}</small>`:''}</span>
        ${r.auto?'<span style="width:24px;color:var(--soft)">›</span>':!mine(r)?'':`<button class="iconbtn jdel" data-mdel="${r.id}" title="Удалить">✕</button>`}</div>`).join(''):'<div class="empty">Пусто</div>'}
    </section>
   </div>
  </div>`;
}

function orderModal2(m){
  const s = (S.food.spend||[]).find(x=>wkey(x)===m.id);
  if(!s) return '';
  const items = s.items || [];
  const sum = items.reduce((a,i)=>a+i[2],0), rest = r2(s.sum - sum);
  return `<div class="scrim" data-close><div class="sheet"><h2>${esc(s.store)}</h2>
    <small style="color:var(--muted)">${new Date(s.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})} · Wolt</small>
    <div style="margin-top:10px">${items.length?`${items.map(i=>`<div class="frow"><div class="fname" style="cursor:default">${esc(i[0])}<small>${esc(i[1])}</small></div><span class="fprice" style="color:var(--text)">${money(i[2])}</span></div>`).join('')}
      <div class="frow"><div class="fname" style="cursor:default;color:var(--muted)">Сервисный сбор и скидки</div><span class="fprice">${rest>0?'+':''}${money(rest)}</span></div>
      ${(s.skipped||[]).map(t=>`<p class="fhint" style="margin:6px 0 0">${esc(t)}</p>`).join('')}`
      :`<div class="empty">Состав этого заказа не сохранён. Пришлите чек, и я добавлю позиции.</div>`}
    <div class="frow" style="font-weight:700"><div class="fname" style="cursor:default">Итого</div><span class="fprice" style="color:var(--text)">${money(s.sum)}</span></div></div>
    <div class="actions"><button class="btn" data-close>Закрыть</button></div></div></div>`;
}
function moneySetModal(m){
  const d = m.draft;
  return `<div class="scrim" data-close><div class="sheet"><h2>Бюджет месяца</h2>
    <div class="field"><label>Сколько денег на месяц</label>${amtField('ms-budget',d.budget)}</div>
    <div class="field"><label>Обязательные платежи каждый месяц</label><div class="subs" id="ms-fixed">
      ${d.fixed.map((f,i)=>`<div class="s"><input type="text" class="inp" data-fn="${i}" value="${esc(f.name)}" placeholder="Аренда" style="flex:1;min-width:0">${amtField('ms-f'+i,{gel:f.amount,v:f.v,cur:f.cur})}<button data-fdel="${i}" title="Убрать">✕</button></div>`).join('')}
      <button class="addinline" id="ms-fadd" style="margin:0">+ платёж</button></div></div>
    <div class="field"><label>Пришли деньги в этом месяце (необязательно)</label>
      <div class="fquick">${amtField('ms-inc',null,'Сумма')}<button class="btn ghost" id="ms-incadd">Добавить</button></div>
      ${S.money.incomes.filter(r=>r.date.startsWith(localISO().slice(0,7))).map(r=>`<small style="color:var(--muted);display:block;margin-top:4px">+${money(r.sum)} · ${new Date(r.date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</small>`).join('')}</div>
    <div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn" id="ms-save">Сохранить</button></div></div></div>`;
}
function savingModal(m){
  const d = m.draft;
  return `<div class="scrim" data-close><div class="sheet"><h2>${m.isNew?'Накопления':'Изменить'}</h2>
    <div class="field"><label>Где лежат</label><input class="inp" id="sv-name" value="${esc(d.name)}" placeholder="Например: Bybit, USDT" list="sv-names"><datalist id="sv-names"><option value="Bybit"><option value="TBC"><option value="Наличные"></datalist></div>
    <div class="field"><label>Сколько</label>${amtField('sv-amt',{v:d.v,cur:d.cur||curDef(),gel:d.v?toGEL(+d.v,d.cur||curDef()):''})}</div>
    <p class="fhint">Остаток считается по текущему курсу. Курс меняется в настройках раздела «Деньги».</p>
    <div class="actions">${m.isNew?'':'<button class="del" id="sv-del">Удалить</button>'}<button class="btn ghost" data-close>Отмена</button><button class="btn" id="sv-save">Сохранить</button></div></div></div>`;
}

const mine = r => !r.who || r.who===S.me;
function bindMoney(){
  const q = s=>$root.querySelector(s), all=(s,fn)=>$root.querySelectorAll(s).forEach(fn);
  ensureMoney();
  const M = S.money;
  const first = q('#mb-first');
  if(first){ const go=()=>{ const a=readAmt('mb-first'); if(!a||!a.gel){ first.focus(); return; } M.budget=a.gel; M.budgetV=a.v; M.budgetCur=a.cur; save(); render(); toast('Бюджет сохранён. Аренду и платежи укажите в «Бюджет»'); };
    q('#mb-first-save').onclick=go; first.onkeydown=e=>{ if(e.key==='Enter') go(); }; first.focus(); }
  all('[data-mset]', b=>b.onclick=()=>{ UI.modal={type:'mset',draft:{budget:{gel:M.budget,v:M.budgetV,cur:M.budgetCur}, fixed:JSON.parse(JSON.stringify(M.fixed))}}; render(); });
  all('[data-mlimits]', b=>b.onclick=()=>openSettings('money'));
  all('[data-mjc]', b=>b.onclick=()=>{ UI.mj.cat=b.dataset.mjc; render(); });
  all('[data-mjs]', b=>b.onclick=()=>{ const by=b.dataset.mjs; if(UI.mj.by===by) UI.mj.dir*=-1; else { UI.mj.by=by; UI.mj.dir=-1; } render(); });
  all('[data-mord]', el=>el.onclick=()=>{ UI.modal={type:'order',id:el.dataset.mord}; render(); });
  all('[data-mdel]', b=>b.onclick=e=>{ e.stopPropagation(); const rr=M.log.find(r=>r.id===b.dataset.mdel); if(rr && !mine(rr)){ toast(`Запись добавил${rr.who==='4'||rr.who===4?'а':''} ${pname(rr.who)}. Удалить её может только автор`); return; } M.log=M.log.filter(r=>r.id!==b.dataset.mdel); save(); render(); toast('Удалено'); });
  const add = q('#mq-add');
  if(add){ const go=()=>{ const a=readAmt('mq-sum'); if(!a||!a.gel){ q('#mq-sum').focus(); return; }
      M.log.unshift({id:uid(),date:localISO(),sum:a.gel,v:a.v,cur:a.cur,cat:q('#mq-cat').value,src:q('#mq-src').value,note:q('#mq-note').value.trim(),who:S.me}); save(); render(); toast(`Записано: ${money(a.gel)}`); };
    add.onclick=go; q('#mq-note').onkeydown=q('#mq-sum').onkeydown=e=>{ if(e.key==='Enter') go(); }; }
  q('#msv-add')?.addEventListener('click', ()=>{ UI.modal={type:'msave',isNew:true,draft:{id:uid(),name:'',v:'',cur:curDef()}}; render(); });
  all('[data-msv]', el=>el.onclick=()=>{ const x=M.savings.find(s=>s.id===el.dataset.msv); if(x.who && x.who!==S.me){ toast(`Это накопления: ${pname(x.who)}. Менять их может только владелец`); return; } UI.modal={type:'msave',draft:{...x}}; render(); });
  const mod = UI.modal;
  if(mod?.type==='mset'){
    const d = mod.draft;
    const read=()=>{ d.budget = readAmt('ms-budget') || {gel:'',v:'',cur:undefined}; all('[data-fn]', i=>{ const k=+i.dataset.fn, a=readAmt('ms-f'+k); d.fixed[k].name=i.value; d.fixed[k].amount=a?a.gel:''; d.fixed[k].v=a?a.v:undefined; d.fixed[k].cur=a?a.cur:undefined; }); };
    q('#ms-fadd').onclick=()=>{ read(); d.fixed.push({id:uid(),name:'',amount:''}); render(); };
    all('[data-fdel]', b=>b.onclick=()=>{ read(); d.fixed.splice(+b.dataset.fdel,1); render(); });
    q('#ms-incadd').onclick=()=>{ const a=readAmt('ms-inc'); if(!a||!a.gel){ q('#ms-inc').focus(); return; } read(); M.incomes.push({id:uid(),date:localISO(),sum:a.gel,v:a.v,cur:a.cur,who:S.me}); save(); render(); toast(`Приход ${money(a.gel)} учтён`); };
    q('#ms-save').onclick=()=>{ read(); const b=d.budget; M.budget=b.gel||''; M.budgetV=b.v; M.budgetCur=b.cur; M.fixed=d.fixed.filter(f=>f.name.trim()||+f.amount); M.warned={}; UI.modal=null; save(); render(); toast('Сохранено'); };
  }
  if(mod?.type==='msave'){
    const d = mod.draft;
    q('#sv-save').onclick=()=>{ const a=readAmt('sv-amt'); if(!a){ q('#sv-amt').focus(); return; }
      const rec={id:d.id,name:q('#sv-name').value.trim()||'Накопления',v:a.v,cur:a.cur,who:d.who||S.me};
      const i=M.savings.findIndex(x=>x.id===d.id); if(i>=0) M.savings[i]=rec; else M.savings.push(rec);
      UI.modal=null; save(); render(); toast('Сохранено'); };
    q('#sv-del')?.addEventListener('click', ()=>{ M.savings=M.savings.filter(x=>x.id!==d.id); UI.modal=null; save(); render(); });
  }
}
