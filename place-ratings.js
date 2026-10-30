/* Личные отзывы о местах: отдельная запись на автора, чтобы синхронизация
   одной оценки не перезаписывала отзыв партнёра внутри общей карточки места. */
S.placeReviews=Array.isArray(S.placeReviews)?S.placeReviews:[];
if(typeof ARR!=='undefined')ARR.placereview={get:()=>S.placeReviews,set:a=>{S.placeReviews=a;}};
const PR_CRITERIA={
  coffee:[['black','Чёрный кофе'],['milk','Молочный кофе'],['interior','Интерьер'],['service','Обслуживание'],['value','Цены']],
  food:[['food','Еда'],['drinks','Напитки'],['interior','Интерьер'],['service','Обслуживание'],['value','Цены']],
  park:[['nature','Природа'],['clean','Чистота'],['comfort','Удобство прогулки'],['quiet','Тишина']],
  view:[['view','Вид'],['access','Удобство подхода'],['clean','Чистота'],['quiet','Атмосфера']],
  culture:[['interest','Насколько интересно'],['exhibit','Экспозиция / программа'],['comfort','Комфорт'],['service','Обслуживание'],['value','Цены']],
  other:[['impression','Впечатление'],['comfort','Комфорт'],['service','Обслуживание'],['value','Цены']]
};
const prCriteria=cat=>PR_CRITERIA[cat]||PR_CRITERIA.other;
const prFind=(placeId,by)=>S.placeReviews.find(r=>r.placeId===placeId&&r.by===by);
const prScore=v=>Number.isInteger(v)&&v>=1&&v<=10?v:0;
function prAverage(p,r){
  const vs=prCriteria(p.cat).map(([k])=>prScore(r?.scores?.[k])).filter(Boolean);
  return vs.length?(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1).replace('.',','):'';
}
function prCard(p){
  const grades=['7','4'].map(by=>{const a=prAverage(p,prFind(p.id,by));return a?`${esc(pname(by))}: ${a}/10`:'';}).filter(Boolean);
  return `<div class="pr-card"><button class="fbtn" data-pr-open="${esc(p.id)}">${prFind(p.id,S.me)?'Моя оценка':'Оценить место'}</button>${grades.length?`<small>${grades.join(' · ')}</small>`:''}</div>`;
}
function prOpen(placeId){
  const p=plFind(placeId);if(!p||!['7','4'].includes(S.me))return;
  const r=prFind(placeId,S.me);
  UI.modal={type:'placereview',placeId,who:S.me,view:S.me,cat:p.cat,draft:{scores:{...(r?.scores||{})},note:r?.note||''}};
  render();
}
function prSave(m){
  if(m.who!==S.me||!['7','4'].includes(S.me))return false;
  const p=plFind(m.placeId);if(!p)return false;
  if(p.cat!==m.cat){toast('Тип места изменился. Откройте оценку заново.');return false;}
  const current=prFind(p.id,S.me),scores={...(current?.scores||{})};
  for(const [key] of prCriteria(p.cat)){const value=prScore(m.draft.scores[key]);if(value)scores[key]=value;else delete scores[key];}
  const note=String(m.draft.note||'').trim().slice(0,2000);
  if(!Object.keys(scores).length&&!note&&!current){toast('Поставьте оценку или напишите примечание');return false;}
  const record={id:current?.id||'pr-'+p.id+'-'+S.me,placeId:p.id,by:S.me,scores,note,at:Date.now()};
  const i=S.placeReviews.findIndex(r=>r.id===record.id);if(i<0)S.placeReviews.push(record);else S.placeReviews[i]=record;
  save();return true;
}
function prModal(m){
  const p=plFind(m.placeId);if(!p)return '<div class="scrim" data-close><div class="sheet"><h2>Место удалено</h2></div></div>';
  const mine=m.view===m.who, r=mine?m.draft:prFind(p.id,m.view), criteria=prCriteria(p.cat);
  return `<div class="scrim" data-close><div class="sheet pr-sheet"><h2>${esc(p.name)}: оценки</h2>
    <div class="seg pr-tabs">${['7','4'].map(by=>`<button data-pr-who="${by}" class="${m.view===by?'on':''}" aria-pressed="${m.view===by}">${esc(pname(by))}${by===m.who?' · я':''}</button>`).join('')}</div>
    <p class="fhint">${mine?'Нажмите нужную звезду: от 1 до 10. Не пробовали — оставьте без оценки. 10 — лучшая оценка; для цен это соотношение цены и качества.':'Оценка партнёра — только просмотр.'}</p>
    ${criteria.map(([key,label])=>{const value=prScore(r?.scores?.[key]);return `<section class="pr-row" data-pr-group="${key}"><div class="pr-label"><b>${label}</b><span data-pr-value>${value?value+'/10':'Без оценки'}</span>${mine?`<button class="pr-reset" data-pr-reset="${key}" aria-label="Сбросить: ${label}">Сбросить</button>`:''}</div>
      ${mine?`<div class="pr-stars" role="group" aria-label="${label}">${Array.from({length:10},(_,i)=>{const n=i+1;return `<button class="pr-star ${n<=value?'on':''}" data-pr-star="${key}:${n}" aria-label="${label}: ${n} из 10" aria-pressed="${n===value}"><span aria-hidden="true">${n<=value?'★':'☆'}</span><small aria-hidden="true">${n}</small></button>`;}).join('')}</div>`:`<div class="pr-read">${value?`<span aria-hidden="true">${'★'.repeat(value)}${'☆'.repeat(10-value)}</span><span class="sr-only">${value} из 10</span>`:'Пока не оценено'}</div>`}</section>`;}).join('')}
    <div class="field"><label for="pr-note">Личное примечание</label>${mine?`<textarea class="inp" id="pr-note" rows="3" maxlength="2000" placeholder="Что понравилось, что заказать в следующий раз…">${esc(m.draft.note)}</textarea>`:`<div class="pr-note">${esc(r?.note||'Примечания пока нет')}</div>`}</div>
    <div class="actions"><button class="btn ghost" data-close>Закрыть</button>${mine?'<button class="btn" id="pr-save">Сохранить оценку</button>':''}</div>
  </div></div>`;
}
(function(){
  const modal=modalView,binding=bind,placeModal=plModal;
  modalView=()=>UI.modal?.type==='placereview'?prModal(UI.modal):modal();
  plModal=m=>{const html=placeModal(m);return m.isNew?html:html.replace('<div class="actions">',`<div class="pr-detail"><button class="fbtn" data-pr-open="${esc(m.draft.id)}">Оценки и личные примечания</button></div><div class="actions">`);};
  bind=()=>{
    binding();const q=s=>$root.querySelector(s),all=(s,f)=>$root.querySelectorAll(s).forEach(f);
    all('[data-pr-open]',b=>b.onclick=e=>{e.stopPropagation();prOpen(b.dataset.prOpen);});
    const m=UI.modal;if(m?.type!=='placereview')return;
    all('[data-pr-who]',b=>b.onclick=()=>{m.view=b.dataset.prWho;render();});
    if(m.who!==S.me||m.view!==m.who)return;
    if(q('#pr-note'))q('#pr-note').oninput=e=>{m.draft.note=e.target.value;};
    const update=(key,value)=>{
      if(m.who!==S.me||m.view!==m.who)return;
      if(!prCriteria(m.cat).some(([k])=>k===key))return;
      if(value)m.draft.scores[key]=value;else delete m.draft.scores[key];
      const row=q(`[data-pr-group="${key}"]`);row.querySelector('[data-pr-value]').textContent=value?value+'/10':'Без оценки';
      row.querySelectorAll('[data-pr-star]').forEach(b=>{const n=+b.dataset.prStar.split(':')[1];b.classList.toggle('on',n<=value);b.setAttribute('aria-pressed',String(n===value));b.querySelector('span').textContent=n<=value?'★':'☆';});
    };
    all('[data-pr-star]',b=>b.onclick=()=>{const [key,n]=b.dataset.prStar.split(':');update(key,+n);});
    all('[data-pr-reset]',b=>b.onclick=()=>update(b.dataset.prReset,0));
    q('#pr-save').onclick=()=>{if(prSave(m)){UI.modal=null;render();toast('Ваша оценка сохранена');}};
  };
})();
document.head.insertAdjacentHTML('beforeend',`<style>
.pr-sheet .actions{display:grid;grid-template-columns:auto minmax(0,1fr)}.pr-sheet .actions .btn{min-width:0;padding-left:10px;padding-right:10px}.pr-card{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}.pr-card small{flex-basis:100%}.pr-detail{margin:12px 0}.pr-tabs{display:flex}.pr-tabs button{flex:1;min-height:44px}
.pr-row{padding:12px 0;border-top:1px solid var(--line)}.pr-label{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}.pr-label b{flex:1}.pr-label>span{font-size:13px;color:var(--muted)}.pr-reset{font-size:12px;color:var(--muted);min-height:44px;text-decoration:underline}
.pr-stars{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}.pr-star{min-width:0;min-height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;background:var(--bg);border:1px solid var(--line)}.pr-star>span{font-size:25px;line-height:1.1;color:var(--muted)}.pr-star small{font-size:11px;color:var(--muted)}.pr-star.on{border-color:var(--c7);background:var(--c7soft)}.pr-star.on>span{color:var(--c7)}.pr-star[aria-pressed="true"]{outline:2px solid var(--c7);outline-offset:-3px}
.pr-read{color:var(--c7);font-size:20px;overflow-wrap:anywhere}.pr-note{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);padding:12px;border-radius:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>`);
