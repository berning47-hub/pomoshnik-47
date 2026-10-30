/* ===== Помощник 47 — раздел «Книги» =====
   Самостоятельный модуль: подключается после sync.js и сам встраивается в render/bind/модалки/настройки. */
const BK_TABS = [['shelf','Полка'],['reading','Читаем'],['want','Хочу'],['goals','Цели']];
const BK_STATUS = {want:'Хочу прочитать', reading:'Читаем', done:'Прочитано', drop:'Бросили'};
const BK_FORMAT = [['boox','Boox'],['paper','Бумажная'],['audio','Аудио'],['phone','Телефон']];

/* стартовая полка: книги из Telegram-канала (постеры в папке books/) */
function bkSeed(){
  const B = (id, title, author, period, born, life, date, ideas, quote) => ({
    id:'bk-'+id, title, author, period, born, life, status:'done', owner:'both', format:'boox', pages:'',
    cover:`books/${id}.jpg`, thumb:`books/${id}-s.jpg`, ideas, quote, tags:[],
    addedBy:'7', addedAt:Date.parse(date), startedAt:'', finishedAt:date, r:{'7':bkR(100),'4':bkR(100)}
  });
  return [
    B('tri-tovarishcha','Три товарища','Эрих Мария Ремарк','1932–1936','Оснабрюк, Германия','1898–1970','2026-09-29',
      ['Дружба как убежище','Любовь как передышка','Война не кончается','Счастье на краю потери','Бедность и достоинство','Главный нерв'],
      'Иногда самое ценное — это люди, с которыми делишь хрупкую жизнь.'),
    B('sacks-shlyapa','Человек, который принял жену за шляпу','Оливер Сакс','1985','Лондон, Великобритания','1933–2015','2026-09-29',
      ['Сбой восприятия','Человек важнее диагноза','Странность без сенсации','Неврология как рассказ','Хрупкость нормы','Главный нерв'],
      'Самое важное у Сакса — не диагноз, а живой человек, который пытается остаться собой.'),
    B('luria','Маленькая книжка о большой памяти. Потерянный и возвращённый мир','Александр Романович Лурия','1968, 1971','Казань, Российская империя','1902–1977','2026-09-29',
      ['Потеря мира','Память как избыток','Личность важнее диагноза','Слово как возвращение','Цена исключительности','Главный нерв'],
      'Через память, речь и потерю Лурия показывает, насколько человеческий мир хрупок — и как упорно он может возвращаться.'),
    B('martin-eden','Мартин Иден','Джек Лондон','1908–1909','Сан-Франциско, Калифорния, США','1876–1916','2026-09-29',
      ['Жажда подняться','Любовь как толчок','Самообразование','Успех приходит поздно','Одиночество между мирами','Главный нерв'],
      'Иногда страшнее провала оказывается исполненная мечта.'),
    B('morfiy','Морфий','Михаил Афанасьевич Булгаков','1926–1927','Киев, Российская империя','1891–1940','2026-09-29',
      ['Боль как вход','Морфий не лечит — он стирает','Знание не спасает врача','Любовь становится частью болезни','Мир сужается','Страшнее всего — подмена спасения'],
      'Иногда лекарство становится страшнее болезни.'),
    B('uzorchatyy-pokrov','Узорчатый покров','Уильям Сомерсет Моэм','1924–1925','Париж, Франция','1874–1965','2026-09-29',
      ['Брак без любви','Измена и расплата','Холера как очищение','Позднее прозрение','Служение и взросление','Главный нерв'],
      'Иногда спасение начинается там, где рушится выдуманная жизнь.'),
    B('radost-zhizni','Радость жизни. Философия стоицизма для XXI века','Уильям Б. Ирвин','2008','США','1952 — н. в.','2026-10-12',
      ['Контроль и принятие','Негативная визуализация','Желания под наблюдением','Спокойствие в XXI веке','Радость как дисциплина','Главный нерв'],
      'Иногда лучшая форма радости — это спокойная ясность, а не бурная удача.'),
    B('igrok','Игрок','Фёдор Михайлович Достоевский','1866','Москва, Российская империя','1821–1881','2026-10-12',
      ['Азарт как потребность','Иллюзия контроля','Любовь и зависимость','Бегство от реальности','Разрушение личности','Надежда, которая не умирает'],
      'Азарт — это жажда жизни, принявшая форму болезни.'),
    {...B('sad-epikura','Сад Эпикура','Анатолий Иванович Домбровский','1983','село Коммунарное, Крым','1934–2001','2026-10-19',
      ['Эпикур как человек','Свобода от страха','Афины и время смуты','Сад как школа дружбы','Мера и ясность','Главный нерв'],
      'Иногда самая зрелая форма счастья — это ясность, мера и тихая свобода.'),
      extra:[{cover:'books/sad-epikura-2.jpg', ideas:['Удовольствие без излишеств','Атараксия','Не бояться смерти','Простые желания','Дружба как опора','Жить незаметно'],
        quote:'Эпикурейство ищет не роскошь, а ясную, свободную и спокойную жизнь.'}]}
  ];
}
function bkR(p=0){ return {p, page:'', rate:0, note:'', days:[]}; }

function ensureBooks(){
  if(!Array.isArray(S.books)){ S.books = bkSeed(); save(); }
  if(!S.bookcfg) S.bookcfg = {goals:{'7':12,'4':12,both:6}};
  S.books.forEach(b=>{ b.r = b.r||{}; ['7','4'].forEach(w=>{ b.r[w] = b.r[w]||bkR(); b.r[w].days = b.r[w].days||[]; }); b.ideas=b.ideas||[]; b.tags=b.tags||[]; });
  UI.btab = UI.btab || 'shelf'; UI.bwho = UI.bwho || 'all';
}
ensureBooks();

/* синхронизация: книги по одной записи, цели одной записью */
if(typeof ARR!=='undefined'){
  ARR.book = {get:()=>S.books, set:a=>{S.books=a;}};
  SINGLE.bookcfg = {get:()=>S.bookcfg, set:d=>{ S.bookcfg = d; }};
}

/* ---------- логика ---------- */
const bkMine = b => b.owner==='both' || b.owner===S.me;        // можно вести прогресс и статус
const bkOwn = b => b.owner===S.me || (b.owner==='both' && (b.addedBy||'7')===S.me);  // менять и удалять может только тот, кто добавил
const bkReaders = b => b.owner==='both' ? ['7','4'] : [b.owner];
const bkWhoOk = b => UI.bwho==='all' || (UI.bwho==='both' ? b.owner==='both' : b.owner===UI.bwho || b.owner==='both');
const bkYear = d => (d||'').slice(0,4);
const bkProgress = b => Math.max(...bkReaders(b).map(w=>+b.r[w].p||0));
const bkAvgRate = b => { const r = bkReaders(b).map(w=>b.r[w].rate).filter(Boolean); return r.length ? r.reduce((a,x)=>a+x,0)/r.length : 0; };
const bkStars = (n, who, id) => `<span class="bk-stars">${[1,2,3,4,5].map(i=>`<button ${who?`data-brate="${id}:${who}:${i}"`:'tabindex="-1"'} class="${i<=n?'on':''}" aria-label="${i}">★</button>`).join('')}</span>`;
const bkMatch = b => { const s=(UI.bsearch||'').toLowerCase(); return !s || (b.title+' '+b.author+' '+(b.tags||[]).join(' ')).toLowerCase().includes(s); };
function bkCover(b, big){
  const src = big ? (b.cover||b.thumb) : (b.thumb||b.cover);
  if(src) return `<img class="bk-img" src="${esc(src)}" alt="" loading="lazy">`;
  let h = 0; for(const c of b.title) h = (h*31 + c.charCodeAt(0)) % 360;
  return `<div class="bk-gen" style="background:hsl(${h} 32% 34%)"><b>${esc(b.title)}</b><small>${esc(b.author||'')}</small></div>`;
}
function bkDoneIn(w, year){
  return S.books.filter(b=>b.status==='done' && bkYear(b.finishedAt)===String(year) && (w==='both' ? b.owner==='both' : (b.owner===w || b.owner==='both')));
}
function bkStreak(w){
  const days = new Set(S.books.flatMap(b=>b.r[w]?.days||[]));
  let n = 0, d = new Date();
  if(!days.has(localISO(d))) d.setDate(d.getDate()-1);           // сегодня ещё можно успеть
  while(days.has(localISO(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function bkSetProgress(b, w, p, page){
  const r = b.r[w];
  r.p = Math.max(0, Math.min(100, Math.round(p)));
  if(page!==undefined) r.page = page;
  const t = localISO(); if(!r.days.includes(t)) r.days.push(t); r.days = r.days.slice(-400);
  if(b.status==='want'){ b.status='reading'; b.startedAt = b.startedAt || t; }
  if(bkReaders(b).every(x=>+b.r[x].p>=100) && b.status!=='done') bkFinish(b);
}
function bkFinish(b){
  b.status = 'done'; b.finishedAt = localISO();
  bkReaders(b).forEach(w=>{ if(w===S.me || b.owner!=='both') b.r[w].p = 100; });
  if(b.owner==='both') notify(`${pname(S.me)} отметил${fem(S.me)?'а':''} «${b.title}» прочитанной`, other(S.me));
  const y = new Date().getFullYear(), g = +S.bookcfg.goals[S.me]||0, n = bkDoneIn(S.me, y).length;
  toast(g && n===g ? `Цель на ${y} выполнена: ${n} из ${g}!` : `«${b.title}» на полке`);
}

/* ---------- экран ---------- */
function booksView(){
  ensureBooks();
  const n = st => S.books.filter(b=>b.status===st && bkWhoOk(b)).length;
  const tabs = BK_TABS.map(([k,t])=>[k, t + ((k==='shelf'?n('done'):k==='reading'?n('reading'):k==='want'?n('want'):0) ? ` <small>${k==='shelf'?n('done'):k==='reading'?n('reading'):n('want')}</small>` : '')]);
  const who = [['all','Все'],['7',esc(pname('7'))],['4',esc(pname('4'))],['both','Вместе']];
  return `<div class="filters"><div class="seg bk-tabs">${tabs.map(([k,t])=>`<button data-btab="${k}" class="${UI.btab===k?'on':''}">${t}</button>`).join('')}</div>
      <div class="sp" style="flex:1"></div><button class="btn" data-bnew>+ Книга</button></div>
    ${UI.btab!=='goals'?`<div class="filters"><div class="seg">${who.map(([k,t])=>`<button data-bwho="${k}" class="${UI.bwho===k?'on':''}">${t}</button>`).join('')}</div>
      <input class="inp bk-search" id="bsearch" placeholder="Поиск: название, автор" value="${esc(UI.bsearch||'')}"></div>`:''}
    ${UI.btab==='shelf' ? bkShelf() : UI.btab==='reading' ? bkReading() : UI.btab==='want' ? bkWant() : bkGoals()}`;
}
function bkThought(){
  const pool = S.books.filter(b=>b.status==='done' && b.quote);
  if(!pool.length) return '';
  const b = pool[Math.floor(Date.now()/864e5) % pool.length];   // меняется раз в день
  return `<div class="bk-thought" data-bopen="${b.id}"><small>Мысль дня с полки</small><p>«${esc(b.quote)}»</p><em>${esc(b.title)} · ${esc(b.author)}</em></div>`;
}
function bkShelf(){
  const list = S.books.filter(b=>b.status==='done' && bkWhoOk(b) && bkMatch(b));
  const sort = UI.bsort || 'date';
  const by = {date:(a,b)=>(b.finishedAt||'').localeCompare(a.finishedAt||''), rate:(a,b)=>bkAvgRate(b)-bkAvgRate(a), title:(a,b)=>a.title.localeCompare(b.title,'ru')}[sort];
  list.sort(by);
  if(!list.length) return `<div class="empty">На полке пока пусто${UI.bsearch?' по такому поиску':''}. Отметьте книгу прочитанной, и она встанет сюда.</div>`;
  const groups = sort==='date' ? [...new Set(list.map(b=>bkYear(b.finishedAt)||'Без даты'))].map(y=>[y, list.filter(b=>(bkYear(b.finishedAt)||'Без даты')===y)]) : [['',list]];
  return `${bkThought()}
    <div class="bk-sortrow"><small>Сортировка</small>${segBtns('bsort',[['date','по дате'],['rate','по оценке'],['title','по названию']],sort)}</div>
    ${groups.map(([y,l])=>`${y?`<h3 class="bk-year">${y} <small>${l.length} ${plural(l.length,'книга','книги','книг')}</small></h3>`:''}
    <div class="bk-shelf">${l.map(b=>`<button class="bk-book" data-bopen="${b.id}">
      <div class="bk-cov">${bkCover(b)}<span class="bk-own">${b.owner==='both'?badgeEl('7')+badgeEl('4'):badgeEl(b.owner)}</span></div>
      <b>${esc(b.title)}</b><small>${esc(b.author)}</small>
      ${bkAvgRate(b)?`<span class="bk-rate">★ ${bkAvgRate(b).toFixed(1).replace('.0','').replace('.',',')}</span>`:''}</button>`).join('')}</div>`).join('')}
    <div class="bk-shelfline"></div>`;
}
function bkReading(){
  const list = S.books.filter(b=>b.status==='reading' && bkWhoOk(b) && bkMatch(b));
  if(!list.length) return `<div class="empty">Сейчас ничего не читаете. Возьмите книгу из «Хочу прочитать» или нажмите «+ Книга».</div>${bkNextPick()}`;
  return `<div class="bk-reading">${list.map(b=>`<section class="bk-rcard">
      <div class="bk-rcov" data-bopen="${b.id}">${bkCover(b)}</div>
      <div class="bk-rbody"><div class="bk-rtitle" data-bopen="${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author)}${b.format?' · '+BK_FORMAT.find(f=>f[0]===b.format)?.[1]:''}${b.pages?` · ${b.pages} стр.`:''}</small></div>
      ${bkReaders(b).map(w=>{ const r=b.r[w], me=w===S.me;
        return `<div class="bk-prow"><span class="badge b${w}">${w}</span><div class="bk-bar"><i style="width:${r.p}%;background:${colorOf(w)}"></i></div><span class="bk-pct">${r.p}%${r.page?` · с. ${r.page}`:''}</span>
        ${me?`<button class="fbtn" data-bstep="${b.id}">+${b.pages?'10 стр.':'5%'}</button><button class="fbtn" data-bprog="${b.id}">Где я?</button>`:''}</div>`; }).join('')}
      ${b.startedAt?`<small class="bk-meta">Начали ${new Date(b.startedAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}${bkEta(b)}</small>`:''}
      ${bkMine(b)?`<div class="bk-ractions"><button class="fbtn back" data-bdone="${b.id}">Дочитал${S.me==='4'?'а':''}</button></div>`:''}
      </div></section>`).join('')}</div>`;
}
function bkEta(b){
  const r = b.r[S.me]; if(!r || !b.startedAt || !(+r.p>4) || +r.p>=100) return '';
  const days = Math.max(1,(Date.now()-new Date(b.startedAt))/864e5), left = Math.ceil(days*(100-r.p)/r.p);
  return `. В этом темпе ${esc(pname(S.me))} дочитает примерно через ${left} ${plural(left,'день','дня','дней')}`;
}
function bkNextPick(){
  const want = S.books.filter(b=>b.status==='want' && bkWhoOk(b));
  if(!want.length) return '';
  return `<div style="margin-top:12px"><button class="btn ghost" data-bpick>🎲 Что читать дальше?</button></div>`;
}
function bkWant(){
  const list = S.books.filter(b=>b.status==='want' && bkWhoOk(b) && bkMatch(b)).sort((a,b)=>(b.prio||0)-(a.prio||0) || b.addedAt-a.addedAt);
  const quick = `<div class="fquick" style="margin-bottom:12px"><input class="inp" id="bq" placeholder="Название, можно через тире автора" autocomplete="off"><button class="btn" id="bq-add">Хочу прочитать</button></div>`;
  if(!list.length) return quick + `<div class="empty">Список пуст. Впишите книгу сверху: её увидите вы оба.</div>`;
  return quick + `<section class="fstore">${list.map(b=>`<div class="frow">
      <button class="bk-prio ${b.prio?'on':''}" data-bprio="${b.id}" title="В первую очередь">${b.prio?'★':'☆'}</button>
      <div class="fname" data-bopen="${b.id}">${esc(b.title)}<small>${esc(b.author||'')}${b.why?' · '+esc(b.why):''} · ${b.owner==='both'?'вместе':esc(pname(b.owner))}</small></div>
      ${bkMine(b)?`<button class="fbtn" data-bstart="${b.id}">Начать</button>`:`<button class="fbtn" data-bcopy="${b.id}">Я тоже</button>`}
    </div>`).join('')}</section>${bkNextPick()}`;
}
function bkGoals(){
  const y = new Date().getFullYear(), G = S.bookcfg.goals;
  const doy = (Date.now()-new Date(y,0,1))/864e5, frac = doy/((new Date(y+1,0,1)-new Date(y,0,1))/864e5);
  const ring = (w, label) => {
    const n = bkDoneIn(w, y).length, g = +G[w]||0, pct = g ? Math.min(1, n/g) : 0;
    const need = g*frac, diff = Math.round((n-need)*10)/10;
    const monthsLeft = 12 - new Date().getMonth(), perM = g>n ? (g-n)/monthsLeft : 0;
    const pace = !g ? 'Цель не задана' : n>=g ? 'Цель выполнена 🎉' : diff>=0 ? `Опережаете график${diff>=1?` на ${Math.floor(diff)}`:''}` : `Отстаёте на ${Math.ceil(-diff)} ${plural(Math.ceil(-diff),'книгу','книги','книг')}`;
    const C = 2*Math.PI*42, col = w==='both' ? 'var(--both)' : colorOf(w);
    return `<div class="bk-goal"><svg viewBox="0 0 100 100" class="bk-ring"><circle cx="50" cy="50" r="42" stroke="var(--bg2)"/><circle cx="50" cy="50" r="42" stroke="${col}" stroke-dasharray="${C*pct} ${C}" transform="rotate(-90 50 50)"/>
      <text x="50" y="49" text-anchor="middle">${n}</text><text x="50" y="66" text-anchor="middle" class="s">из ${g||'—'}</text></svg>
      <div><b>${label}</b><small>${pace}</small>${perM?`<small>Нужно ${String(Math.round(perM*10)/10).replace('.',',')} в месяц до конца года</small>`:''}
      ${w!=='both'?`<small>Серия чтения: ${bkStreak(w)} ${plural(bkStreak(w),'день','дня','дней')} подряд</small>`:''}
      <div class="bk-gset">${w===S.me||w==='both'?`<input class="inp" type="number" min="0" max="365" data-bgoal="${w}" value="${g||''}" placeholder="книг"><span>книг в ${y}</span>`:''}</div></div></div>`;
  };
  const done = S.books.filter(b=>b.status==='done');
  const auth = {}; done.forEach(b=>auth[b.author]=(auth[b.author]||0)+1);
  const topA = Object.entries(auth).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const rated = done.filter(b=>bkAvgRate(b));
  const best = [...rated].sort((a,b)=>bkAvgRate(b)-bkAvgRate(a))[0];
  const months = Array.from({length:12},(_,i)=>{ const m=`${y}-${String(i+1).padStart(2,'0')}`; return done.filter(b=>(b.finishedAt||'').startsWith(m)).length; });
  const mx = Math.max(1,...months);
  return `<div class="bk-goals">${ring('7',esc(pname('7')))}${ring('4',esc(pname('4')))}${ring('both','Вместе')}</div>
    <p class="fhint">Цель своя у каждого: в неё идут ваши книги и общие. «Вместе» считает только книги, которые читали вдвоём. Серия растёт, когда отмечаете прогресс хотя бы раз в день.</p>
    <div class="fstats">
      <div class="stat"><small>Всего на полке</small><b>${done.length}</b></div>
      <div class="stat"><small>Средняя оценка</small><b>${rated.length?'★ '+(rated.reduce((a,b)=>a+bkAvgRate(b),0)/rated.length).toFixed(1).replace('.',','):'—'}</b></div>
      <div class="stat"><small>Лучшая книга</small><b class="bk-sm">${best?esc(best.title):'Оцените книги'}</b></div>
    </div>
    <section class="fstore" style="margin-top:12px"><div class="fsh"><b>По месяцам ${y}</b></div>
      <div class="bk-months">${months.map((v,i)=>`<div><i style="height:${v/mx*100}%" title="${v}"></i><small>${new Date(y,i,1).toLocaleDateString('ru-RU',{month:'short'}).replace('.','')}</small></div>`).join('')}</div></section>
    ${topA.length?`<section class="fstore" style="margin-top:12px"><div class="fsh"><b>Любимые авторы</b></div>${topA.map(([a,n])=>`<div class="frow"><div class="fname">${esc(a)}</div><span class="fprice">${n} ${plural(n,'книга','книги','книг')}</span></div>`).join('')}</section>`:''}`;
}

/* ---------- модалки ---------- */
function bkBookModal(m){
  const b = S.books.find(x=>x.id===m.id); if(!b) return '';
  const ed = bkMine(b), own = bkOwn(b);
  const parts = b.extra ? [{cover:b.cover, ideas:b.ideas, quote:b.quote}, ...b.extra] : [{cover:b.cover, ideas:b.ideas, quote:b.quote}];
  const pi = Math.min(m.part||0, parts.length-1), P = parts[pi];
  return `<div class="scrim" data-close><div class="sheet wide bk-sheet" role="dialog">
    <div class="bk-detail">
      <div class="bk-poster">${P.cover?`<a href="${esc(P.cover)}" target="_blank" rel="noopener"><img src="${esc(P.cover)}" alt="Постер"></a>`:bkCover(b,true)}
        ${parts.length>1?`<div class="seg" style="margin-top:8px">${parts.map((_,i)=>`<button data-bpart="${i}" class="${i===pi?'on':''}">Постер ${i+1}</button>`).join('')}</div>`:''}</div>
      <div class="bk-info">
        <h2>${esc(b.title)}</h2>
        <p class="bk-auth">${esc(b.author)}${b.period?` · ${esc(b.period)}`:''}</p>
        ${b.born||b.life?`<p class="fhint" style="margin-top:0">${b.born?'Место рождения: '+esc(b.born):''}${b.born&&b.life?'<br>':''}${b.life?'Годы жизни: '+esc(b.life):''}</p>`:''}
        <p class="fhint">${BK_STATUS[b.status]}${b.finishedAt&&b.status==='done'?' '+new Date(b.finishedAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):''} · ${b.owner==='both'?'читаем вместе':esc(pname(b.owner))}</p>
        ${P.ideas?.length?`<h3>Главные мысли</h3><ol class="bk-ideas">${P.ideas.map(i=>`<li>${esc(i)}</li>`).join('')}</ol>`:''}
        ${P.quote?`<blockquote class="bk-quote">${esc(P.quote)}</blockquote>`:''}
        ${b.status==='done'||b.status==='reading'?`<h3>Оценки и заметки</h3>${bkReaders(b).map(w=>{ const r=b.r[w], me=w===S.me;
          return `<div class="bk-note"><div class="bk-noteh">${badgeEl(w)} <b>${esc(pname(w))}</b>${bkStars(r.rate, me?w:null, b.id)}</div>
            ${me?`<textarea class="inp" id="bk-note" rows="2" placeholder="Что зацепило, цитата, мысль">${esc(r.note)}</textarea>`:r.note?`<p>${esc(r.note)}</p>`:'<p class="fhint" style="margin:4px 0">Пока без заметки</p>'}</div>`;}).join('')}`:''}
        <div class="pick bk-links">
          <a class="btn ghost" href="https://www.litres.ru/search/?q=${encodeURIComponent(b.title+' '+b.author)}" target="_blank" rel="noopener">Найти на ЛитРес ↗</a>
          <a class="btn ghost" href="https://www.google.com/search?q=${encodeURIComponent(b.title+' '+b.author+' epub')}" target="_blank" rel="noopener">Найти epub ↗</a>
          <button class="btn ghost" id="bk-tg">Текст для Telegram</button>
        </div>
      </div>
    </div>
    <div class="actions">${own?`<button class="del" id="bk-del">Удалить</button><button class="btn ghost" id="bk-edit">Изменить</button>`:''}
      ${ed&&b.status==='want'?`<button class="btn ghost" data-bstart="${b.id}">Начать читать</button>`:''}
      ${ed&&b.status==='reading'?`<button class="btn ghost" data-bdone="${b.id}">Прочитано</button>`:''}
      <button class="btn" id="bk-close">Готово</button></div>
  </div></div>`;
}
function bkEditModal(m){
  const d = m.draft, ro = !m.isNew && !bkOwn(d);
  const owners = [[S.me, badgeEl(S.me)+' '+esc(pname(S.me))], ['both', `<span class="marks" style="margin:0">${badgeEl('4')+badgeEl('7')}</span> Вместе`]];
  return `<div class="scrim" data-close><div class="sheet" role="dialog"><h2>${m.isNew?'Новая книга':'Книга'}</h2>
    ${ro?`<p class="fhint" style="margin-top:-6px">Книгу добавил${fem(d.addedBy)?'а':''} ${esc(pname(d.addedBy||'7'))}, менять её может только ${fem(d.addedBy)?'она':'он'}.</p>`:''}
    <div class="field"><label>Название</label><input class="inp" id="be-title" value="${esc(d.title)}" placeholder="Например: Цветы для Элджернона"></div>
    <div class="field"><label>Автор</label><input class="inp" id="be-author" value="${esc(d.author)}" placeholder="Дэниел Киз"></div>
    <div class="field"><label>Где книга</label><div class="pick" id="be-status">${Object.entries(BK_STATUS).map(([k,t])=>`<button data-v="${k}" class="${d.status===k?'on':''}">${t}</button>`).join('')}</div></div>
    <div class="field"><label>Чья</label><div class="pick" id="be-owner">${owners.map(([k,h])=>`<button data-v="${k}" class="${d.owner===k?'on':''}">${h}</button>`).join('')}</div></div>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Формат</label><select class="inp" id="be-format">${BK_FORMAT.map(([k,t])=>`<option value="${k}" ${d.format===k?'selected':''}>${t}</option>`).join('')}</select></div>
      <div style="flex:1"><label>Страниц</label><input class="inp" id="be-pages" type="number" min="0" value="${esc(d.pages)}" placeholder="320"></div></div>
    ${d.status==='done'?`<div class="field"><label>Дочитали</label><input class="inp" id="be-fin" type="date" value="${esc(d.finishedAt||localISO())}"></div>`:''}
    ${d.status==='want'?`<div class="field"><label>Почему хочется (по желанию)</label><input class="inp" id="be-why" value="${esc(d.why||'')}" placeholder="Посоветовал друг, продолжение…"></div>`:''}
    <details class="bk-more" ${m.isNew?'':'open'}><summary>Как в Telegram: постер, мысли, об авторе</summary>
      <div class="field"><label>Постер или обложка</label><div class="bk-up">${d.thumb||d.cover?`<img src="${esc(d.thumb||d.cover)}" alt="">`:''}<label class="btn ghost">${d.cover?'Заменить':'Загрузить картинку'}<input type="file" id="be-cover" accept="image/*" hidden></label>${d.cover?'<button class="fbtn" id="be-nocover">Убрать</button>':''}</div></div>
      <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Период</label><input class="inp" id="be-period" value="${esc(d.period||'')}" placeholder="1932–1936"></div>
        <div style="flex:1"><label>Годы жизни автора</label><input class="inp" id="be-life" value="${esc(d.life||'')}" placeholder="1898–1970"></div></div>
      <div class="field"><label>Место рождения автора</label><input class="inp" id="be-born" value="${esc(d.born||'')}"></div>
      <div class="field"><label>Главные мысли, по одной в строке</label><textarea class="inp" id="be-ideas" rows="4">${esc((d.ideas||[]).join('\n'))}</textarea></div>
      <div class="field"><label>Итоговая фраза</label><input class="inp" id="be-quote" value="${esc(d.quote||'')}"></div>
    </details>
    <div class="actions"><button class="btn ghost" data-close>Отмена</button>${ro?'':'<button class="btn" id="be-save">Сохранить</button>'}</div>
  </div></div>`;
}
function bkProgModal(m){
  const b = S.books.find(x=>x.id===m.id), r = b.r[S.me];
  return `<div class="scrim" data-close><div class="sheet"><h2>${esc(b.title)}</h2>
    <p class="fhint" style="margin-top:-6px">Посмотрите на Boox внизу экрана: там страница или процент.</p>
    <div class="field" style="display:flex;gap:10px"><div style="flex:1"><label>Страница</label><input class="inp" id="bp-page" type="number" min="0" value="${esc(r.page)}" placeholder="${b.pages?'из '+b.pages:'например 84'}"></div>
      <div style="flex:1"><label>${b.pages?'Всего страниц':'или процент'}</label><input class="inp" id="${b.pages?'bp-total':'bp-pct'}" type="number" min="0" value="${b.pages?esc(b.pages):r.p}"></div></div>
    <div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn" id="bp-save">Сохранить</button></div></div></div>`;
}
function bkPickModal(m){
  const b = S.books.find(x=>x.id===m.id);
  return `<div class="scrim" data-close><div class="sheet bk-pick"><small>Следующей читаем</small><h2>${esc(b.title)}</h2><p class="bk-auth">${esc(b.author||'')}</p>
    ${b.why?`<p class="fhint">${esc(b.why)}</p>`:''}
    <div class="actions"><button class="btn ghost" data-bpick>Другую</button>${bkMine(b)?`<button class="btn" data-bstart="${b.id}">Начинаем</button>`:''}</div></div></div>`;
}
function bkTelegram(b){
  return [b.title, b.period?`Период: ${b.period}`:'', '', b.author, b.born?`Место рождения: ${b.born}`:'', b.life?`Годы жизни: ${b.life}`:''].filter((l,i)=>l||i===2).join('\n');
}

/* картинка с телефона → уменьшенный JPEG прямо в записи книги (так она синхронизируется) */
function bkImage(file, max, q){
  return new Promise((ok, bad)=>{
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = ()=>{ const k = Math.min(1, max/Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width*k); c.height = Math.round(img.height*k); c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', q)); };
    img.onerror = bad; img.src = url;
  });
}
function bkNew(status='want', title='', author=''){
  return {id:'bk-'+uid(), title, author, period:'', born:'', life:'', status, owner:'both', format:'boox', pages:'', cover:'', thumb:'',
    ideas:[], quote:'', tags:[], why:'', prio:0, addedBy:S.me, addedAt:Date.now(), startedAt:status==='reading'?localISO():'', finishedAt:status==='done'?localISO():'', r:{'7':bkR(),'4':bkR()}};
}
function bkAdd(b){
  S.books.push(b);
  if(b.owner==='both') notify(`${pname(S.me)} добавил${fem(S.me)?'а':''} книгу «${b.title}»: ${BK_STATUS[b.status].toLowerCase()}`, other(S.me));
}
function bkSplit(v){ const m = v.split(/\s+[—–-]\s+/); return m.length>1 ? [m[0].trim(), m.slice(1).join(' — ').trim()] : [v.trim(), '']; }

/* ---------- обработчики ---------- */
function bindBooks(){
  const q = s=>$root.querySelector(s), all = (s,fn)=>$root.querySelectorAll(s).forEach(fn);
  const find = id => S.books.find(b=>b.id===id);
  const open = id => { UI.modal = {type:'book', id}; render(); };
  all('[data-btab]', b=>b.onclick=()=>{ UI.btab=b.dataset.btab; render(); });
  all('[data-bwho]', b=>b.onclick=()=>{ UI.bwho=b.dataset.bwho; render(); });
  all('[data-bsort]', b=>b.onclick=()=>{ UI.bsort=b.dataset.bsort; render(); });
  all('[data-bopen]', el=>el.onclick=()=>open(el.dataset.bopen));
  all('[data-bnew]', b=>b.onclick=()=>{ const st = UI.btab==='shelf'?'done':UI.btab==='reading'?'reading':'want'; UI.modal={type:'bedit', isNew:true, draft:bkNew(st)}; render(); setTimeout(()=>q('#be-title')?.focus(),30); });
  all('[data-bstep]', b=>b.onclick=()=>{ const bk=find(b.dataset.bstep), r=bk.r[S.me];
    if(bk.pages){ const pg=(+r.page||Math.round(r.p/100*bk.pages))+10; bkSetProgress(bk,S.me,pg/bk.pages*100,Math.min(pg,+bk.pages)); } else bkSetProgress(bk,S.me,(+r.p||0)+5);
    save(); render(); });
  all('[data-bprog]', b=>b.onclick=()=>{ UI.modal={type:'bprog', id:b.dataset.bprog}; render(); setTimeout(()=>q('#bp-page')?.focus(),30); });
  all('[data-bdone]', b=>b.onclick=()=>{ const bk=find(b.dataset.bdone); bkFinish(bk); UI.modal={type:'book', id:bk.id}; save(); render(); });
  all('[data-bstart]', b=>b.onclick=()=>{ const bk=find(b.dataset.bstart); bk.status='reading'; bk.startedAt=localISO(); UI.btab='reading'; UI.modal=null; save(); render(); toast(`Начали «${bk.title}»`); });
  all('[data-bprio]', b=>b.onclick=()=>{ const bk=find(b.dataset.bprio); if(!bkOwn(bk)) return; bk.prio=bk.prio?0:1; save(); render(); });
  all('[data-bcopy]', b=>b.onclick=()=>{ const bk=find(b.dataset.bcopy); const c=bkNew('want',bk.title,bk.author); c.owner=S.me; c.why=bk.why||''; S.books.push(c); notify(`${pname(S.me)} тоже хочет прочитать «${bk.title}»`, other(S.me)); save(); render(); toast('Добавлено в ваш список'); });
  all('[data-bpick]', b=>b.onclick=()=>{ const l=S.books.filter(x=>x.status==='want' && bkWhoOk(x)); if(!l.length) return;
    const pr = l.filter(x=>x.prio), pool = pr.length && Math.random()<.6 ? pr : l, cur = UI.modal?.id;
    let pick = pool[Math.floor(Math.random()*pool.length)]; if(pick.id===cur && l.length>1) pick = l.find(x=>x.id!==cur);
    UI.modal={type:'bpick', id:pick.id}; render(); });
  all('[data-bgoal]', i=>i.onchange=()=>{ S.bookcfg.goals[i.dataset.bgoal]=Math.max(0,+i.value||0); save(); render(); });
  const bs = q('#bsearch'); if(bs) bs.oninput=e=>{ UI.bsearch=e.target.value; const pos=e.target.selectionStart; render(); const n=q('#bsearch'); n.focus(); n.setSelectionRange(pos,pos); };
  const bq = q('#bq');
  if(bq){ const go=()=>{ const v=bq.value.trim(); if(!v) return; const [t,a]=bkSplit(v); bkAdd(bkNew('want',t,a)); save(); render(); toast(`«${t}» в списке`); setTimeout(()=>$root.querySelector('#bq')?.focus(),30); };
    q('#bq-add').onclick=go; bq.onkeydown=e=>{ if(e.key==='Enter') go(); }; }

  const m = UI.modal; if(!m) return;
  if(m.type==='book'){
    const b = find(m.id); if(!b) return;
    all('[data-bpart]', x=>x.onclick=()=>{ m.part=+x.dataset.bpart; render(); });
    all('[data-brate]', x=>x.onclick=()=>{ const [id,w,n]=x.dataset.brate.split(':'); const r=find(id).r[w]; r.rate = r.rate===+n ? 0 : +n; keepNote(); save(); render(); });
    const keepNote = () => { const t=q('#bk-note'); if(t) b.r[S.me].note=t.value; };
    q('#bk-note') && (q('#bk-note').onchange=()=>{ keepNote(); save(); });
    q('#bk-close').onclick=()=>{ keepNote(); UI.modal=null; save(); render(); };
    q('#bk-tg').onclick=()=>{ const t=bkTelegram(b); (navigator.clipboard?.writeText(t)||Promise.reject()).then(()=>toast('Текст скопирован'), ()=>prompt('Скопируйте текст', t)); };
    q('#bk-edit') && (q('#bk-edit').onclick=()=>{ keepNote(); UI.modal={type:'bedit', draft:JSON.parse(JSON.stringify(b))}; render(); });
    q('#bk-del') && (q('#bk-del').onclick=()=>{ if(!confirm(`Удалить «${b.title}»?`)) return; S.books=S.books.filter(x=>x.id!==b.id); UI.modal=null; save(); render(); toast('Удалено'); });
  }
  if(m.type==='bedit'){
    const d = m.draft;
    if(m.isNew || bkOwn(d)){
      const read = () => { d.title=q('#be-title').value; d.author=q('#be-author').value; d.format=q('#be-format').value; d.pages=q('#be-pages').value;
        if(q('#be-fin')) d.finishedAt=q('#be-fin').value; if(q('#be-why')) d.why=q('#be-why').value;
        d.period=q('#be-period').value; d.life=q('#be-life').value; d.born=q('#be-born').value; d.quote=q('#be-quote').value;
        d.ideas=q('#be-ideas').value.split('\n').map(s=>s.trim()).filter(Boolean); m.isNew && (m.more=q('.bk-more').open); };
      all('#be-status button', x=>x.onclick=()=>{ read(); d.status=x.dataset.v; if(d.status==='done') d.finishedAt=d.finishedAt||localISO(); if(d.status==='reading') d.startedAt=d.startedAt||localISO(); render(); if(m.more) q('.bk-more').open=true; });
      all('#be-owner button', x=>x.onclick=()=>{ read(); d.owner=x.dataset.v; render(); if(m.more) q('.bk-more').open=true; });
      q('#be-cover').onchange=async e=>{ const f=e.target.files[0]; if(!f) return; read();
        try{ d.cover = await bkImage(f, 1100, .72); d.thumb = await bkImage(f, 320, .7); }catch(_){ toast('Не получилось открыть картинку'); }
        render(); q('.bk-more').open=true; };
      q('#be-nocover') && (q('#be-nocover').onclick=()=>{ read(); d.cover=''; d.thumb=''; render(); q('.bk-more').open=true; });
      q('#be-save').onclick=()=>{ read(); d.title=d.title.trim(); d.author=d.author.trim(); if(!d.title){ q('#be-title').focus(); return; }
        if(d.status==='done') bkReaders(d).forEach(w=>{ if(w===S.me || d.owner!=='both') d.r[w].p=100; });
        const i = S.books.findIndex(x=>x.id===d.id);
        if(i>=0) S.books[i]=d; else bkAdd(d);
        UI.btab = d.status==='done'?'shelf':d.status==='drop'?UI.btab:d.status;
        UI.modal = i>=0 ? {type:'book', id:d.id} : null; save(); render(); toast(i>=0?'Сохранено':'Книга добавлена'); };
    }
  }
  if(m.type==='bprog'){
    const b = find(m.id);
    q('#bp-save').onclick=()=>{ const page=+q('#bp-page').value||0;
      if(b.pages || q('#bp-total')){ const tot=+(q('#bp-total')?.value)||+b.pages; if(tot) b.pages=String(tot); bkSetProgress(b,S.me,tot?page/tot*100:b.r[S.me].p,page||''); }
      else bkSetProgress(b,S.me,+q('#bp-pct').value||0,page||'');
      UI.modal=null; save(); render(); };
    q('#bp-page').onkeydown=e=>{ if(e.key==='Enter') q('#bp-save').click(); };
  }
}

/* ---------- настройки раздела ---------- */
function bkSettings(){
  const G = S.bookcfg.goals, y = new Date().getFullYear();
  return `<h3>Цели на ${y}</h3>
    ${[['7',pname('7')],['4',pname('4')],['both','Вместе']].map(([w,n])=>swRow(esc(n), `<input class="inp" style="width:90px" type="number" min="0" max="365" data-sbgoal="${w}" value="${G[w]||''}" placeholder="книг">`)).join('')}
    <p class="fhint">Прогресс и темп видны во вкладке «Цели».</p>
    <h3>Добавить списком</h3>
    <p class="fhint">Каждая книга с новой строки, автор через тире: «Мастер и Маргарита — Булгаков».</p>
    <textarea class="inp" id="sb-list" rows="4"></textarea>
    <div class="pick" style="margin-top:8px"><button data-sblist="done">На полку (прочитано)</button><button data-sblist="want">В «Хочу прочитать»</button></div>`;
}
function bindBookSettings(){
  const q = s=>$root.querySelector(s), all = (s,fn)=>$root.querySelectorAll(s).forEach(fn);
  all('[data-sbgoal]', i=>i.onchange=()=>{ S.bookcfg.goals[i.dataset.sbgoal]=Math.max(0,+i.value||0); save(); });
  all('[data-sblist]', b=>b.onclick=()=>{ const lines=q('#sb-list').value.split('\n').map(s=>s.trim()).filter(Boolean); if(!lines.length) return;
    let n=0; lines.forEach(l=>{ const [t,a]=bkSplit(l); if(S.books.some(x=>x.title.toLowerCase()===t.toLowerCase())) return; const bk=bkNew(b.dataset.sblist,t,a); if(bk.status==='done') bk.r[S.me].p=bk.r[other(S.me)].p=100; S.books.push(bk); n++; });
    save(); q('#sb-list').value=''; toast(`Добавлено книг: ${n}`); });
}

/* ---------- встраивание в приложение ---------- */
(function(){
  const _soon = soonView, _modal = modalView, _bind = bind, _render = render, _sp = settingsPage, _bs = bindSettings;
  soonView = k => k==='books' ? booksView() : _soon(k);
  modalView = () => { const t = UI.modal?.type;
    return t==='book' ? bkBookModal(UI.modal) : t==='bedit' ? bkEditModal(UI.modal) : t==='bprog' ? bkProgModal(UI.modal) : t==='bpick' ? bkPickModal(UI.modal) : _modal(); };
  bind = () => { _bind(); if(UI.section==='books' || ['book','bedit','bprog','bpick'].includes(UI.modal?.type)) bindBooks(); };
  settingsPage = p => p==='books' ? bkSettings() : _sp(p);
  bindSettings = () => { _bs(); if(UI.modal?.type==='settings' && UI.modal.page==='books') bindBookSettings(); };
  render = () => { _render();
    const nb = $root.querySelector('.nav [data-sec="books"] small'); if(nb) nb.remove();
    const n = S.books?.filter(b=>b.status==='reading' && bkReaders(b).includes(S.me)).length;
    const btn = $root.querySelector('.nav [data-sec="books"]'); if(btn && n) btn.insertAdjacentHTML('beforeend', `<small>${n}</small>`);
  };
})();

/* стили раздела */
document.head.insertAdjacentHTML('beforeend', `<style>
.bk-search{max-width:280px;padding:8px 12px;margin-left:auto}
.bk-sortrow{display:flex;align-items:center;gap:10px;margin:6px 0 4px}.bk-sortrow small{color:var(--muted)}
.bk-year{margin:18px 0 10px;font-size:15px}.bk-year small{color:var(--soft);font-weight:400;margin-left:6px}
.bk-shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:18px 14px;padding-bottom:14px;border-bottom:6px solid var(--bg2)}
.bk-book{text-align:left;display:flex;flex-direction:column;gap:3px;min-width:0}
.bk-book b{font-size:13px;line-height:1.25;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bk-book small{color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bk-book:hover .bk-cov{transform:translateY(-3px)}
.bk-cov{position:relative;aspect-ratio:2/3;border-radius:6px 10px 10px 6px;overflow:hidden;box-shadow:var(--shadow),inset 4px 0 0 rgba(0,0,0,.12);transition:transform .15s;background:var(--bg2)}
.bk-img{width:100%;height:100%;object-fit:cover;display:block}
.bk-gen{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:12px;color:#fff;gap:6px;text-align:center}
.bk-gen b{font-size:13px;line-height:1.2;overflow-wrap:anywhere;hyphens:auto}.bk-gen small{opacity:.8;font-size:11px}
.bk-own{position:absolute;right:6px;bottom:6px;display:flex}.bk-own .badge+.badge{margin-left:-7px}
.bk-rate{font-size:12px;color:var(--warn)}
.bk-thought{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 16px;margin-bottom:10px;border-left:4px solid var(--c7);cursor:pointer}
.bk-thought small{color:var(--soft);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.bk-thought p{margin:6px 0;font-family:Georgia,serif;font-size:16px;font-style:italic}.bk-thought em{color:var(--muted);font-size:12px;font-style:normal}
.bk-reading{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.bk-rcard{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:14px;display:flex;gap:14px}
.bk-rcov{width:84px;flex:none;aspect-ratio:2/3;border-radius:6px;overflow:hidden;cursor:pointer}
.bk-rbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.bk-rtitle{cursor:pointer}.bk-rtitle b{display:block}.bk-rtitle small{color:var(--muted);font-size:12px}
.bk-prow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.bk-bar{flex:1;min-width:80px;height:8px;background:var(--bg2);border-radius:5px;overflow:hidden}.bk-bar i{display:block;height:100%;border-radius:5px}
.bk-pct{font-size:12px;color:var(--muted);min-width:42px}
.bk-meta{color:var(--soft);font-size:12px}
.bk-ractions{display:flex;gap:6px;justify-content:flex-end;margin-top:auto}
.bk-prio{font-size:18px;color:var(--soft);width:26px}.bk-prio.on{color:var(--warn)}
.bk-goals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.bk-goal{background:var(--card);border-radius:var(--r);box-shadow:var(--shadow);padding:16px;display:flex;gap:14px;align-items:center}
.bk-goal>div{display:flex;flex-direction:column;gap:3px;min-width:0}.bk-goal small{color:var(--muted);font-size:12px}
.bk-ring{width:92px;flex:none}.bk-ring circle{fill:none;stroke-width:9;stroke-linecap:round}
.bk-ring text{font-size:24px;font-weight:700;fill:var(--text)}.bk-ring text.s{font-size:11px;font-weight:400;fill:var(--muted)}
.bk-gset{display:flex;align-items:center;gap:6px;margin-top:6px}.bk-gset .inp{width:70px;padding:6px 8px}.bk-gset span{font-size:12px;color:var(--muted)}
.bk-sm{font-size:14px!important;line-height:1.25;display:block}
.bk-months{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;height:110px;align-items:end;padding-top:8px}
.bk-months div{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:4px}
.bk-months i{width:100%;max-width:26px;background:var(--c7);border-radius:5px 5px 2px 2px;min-height:2px}.bk-months small{font-size:10px;color:var(--soft)}
.bk-detail{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:20px}
.bk-poster img{width:100%;border-radius:12px;display:block;box-shadow:var(--shadow)}
.bk-poster .bk-gen{aspect-ratio:2/3;border-radius:12px}
.bk-info h2{margin:0 0 4px}.bk-auth{color:var(--muted);margin:0 0 8px}
.bk-info h3{font-size:14px;margin:16px 0 6px}
.bk-ideas{margin:0;padding-left:22px;display:grid;gap:3px}
.bk-quote{margin:12px 0 0;padding:10px 14px;border-left:3px solid var(--c7);background:var(--bg);border-radius:0 10px 10px 0;font-family:Georgia,serif;font-style:italic}
.bk-note{background:var(--bg);border-radius:12px;padding:10px;margin-bottom:8px}.bk-note p{margin:6px 0 0}
.bk-noteh{display:flex;align-items:center;gap:8px;margin-bottom:6px}.bk-noteh .bk-stars{margin-left:auto}
.bk-stars{display:inline-flex}.bk-stars button{font-size:19px;color:var(--line);padding:0 1px;line-height:1}.bk-stars button.on{color:var(--warn)}
.bk-tabs button{white-space:nowrap}.bk-tabs small{color:var(--soft);font-size:11px;margin-left:2px}.bk-sortrow .seg button{white-space:nowrap}
.bk-links a{text-decoration:none;color:var(--text)}.bk-links{margin-top:14px}.bk-links .btn{padding:8px 12px;font-weight:500;font-size:13px}
.bk-more{margin:4px 0 8px}.bk-more summary{cursor:pointer;color:var(--muted);font-size:13px;margin-bottom:12px}
.bk-up{display:flex;align-items:center;gap:10px}.bk-up img{width:54px;border-radius:6px}.bk-up .btn{margin:0;font-weight:500}
.bk-pick{text-align:center}.bk-pick small{color:var(--soft);text-transform:uppercase;font-size:11px;letter-spacing:.05em}.bk-pick h2{margin:8px 0 2px}.bk-pick .actions{justify-content:center}
@media (max-width:820px){
  .bk-tabs{flex:1}.bk-tabs button{flex:1;padding:7px 8px}.bk-sortrow .seg button{padding:6px 10px;font-size:13px}
  .bk-search{max-width:none;margin-left:0;flex:1 1 100%}
  .bk-shelf{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 10px}
  .bk-reading{grid-template-columns:1fr}
  .bk-goals{grid-template-columns:1fr}
  .bk-detail{grid-template-columns:1fr}.bk-poster{max-width:340px;margin:0 auto}
}
</style>`);
