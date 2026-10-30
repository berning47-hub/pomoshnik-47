/* ===== Помощник 47 — внешность и одежда персонажей =====
   Расширяет аватары: больше причёсок, цветов и деталей, плюс гардероб. Подключается после index.html-скрипта (до body.js). */

/* новые варианты дописываются в конец списков, старые номера не меняются */
SKIN.push('#FBE6D6');                                              // очень светлая
HAIRC.push('#6B3F26', '#4A2C1C', '#8A5A3B', '#1C1410');          // каштановый, тёмно-каштановый, светло-каштановый, почти чёрный
HAIRS.push('straight', 'waves', 'bangs', 'bob', 'pony', 'braid', 'swept');
Object.assign(HAIR_NAMES, {straight:'Прямые длинные', waves:'Волны', bangs:'С чёлкой', bob:'Каре', pony:'Хвост', braid:'Коса', swept:'Назад с объёмом'});
ACC.push('round', 'square', 'sun', 'earrings');
Object.assign(ACC_NAMES, {round:'Круглые очки', square:'Большие очки', sun:'Солнечные', earrings:'Серьги'});

/* гардероб: верх рисуется на аватаре и силуэте, низ на силуэте */
const WARDROBE = {
  '4': [
    ['tee', 'Футболки', [
      ['m_tee_yel', 'Объёмная винтажная с принтом, 2mood', '#F3E3A6', 'teeo', 'print'],
      ['m_tee_white', 'Белая базовая', '#F7F5F0', 'tee'],
      ['m_tee_navy', 'Тёмно-синяя', '#1F2A44', 'tee'],
      ['m_tee_milk', 'Молочная оверсайз с надписью', '#EFE6D6', 'teeo', 'text'],
      ['m_tee_grey', 'Серый меланж', '#B9B6B1', 'teeo']]],
    ['knit', 'Свитеры и кофты', [
      ['m_knit_cream', 'Кремовый объёмный свитер', '#EDE3D1', 'knit'],
      ['m_card_blue', 'Голубой кардиган', '#A9C4E4', 'cardigan'],
      ['m_knit_choc', 'Шоколадный джемпер', '#5A3A2A', 'knit'],
      ['m_hood_grey', 'Серое худи', '#9C9893', 'hoodie'],
      ['m_long_white', 'Белый лонгслив', '#F4F1EA', 'long']]],
    ['shirt', 'Рубашки и жакеты', [
      ['m_shirt_blue', 'Голубая рубашка оверсайз', '#9DBBE0', 'shirt'],
      ['m_shirt_white', 'Белая рубашка', '#F8F6F1', 'shirt'],
      ['m_denim', 'Джинсовая куртка', '#6E8DB5', 'jacket'],
      ['m_trench', 'Бежевый тренч', '#CDB48E', 'jacket'],
      ['m_blazer', 'Чёрный жакет', '#26231F', 'jacket']]],
    ['bottom', 'Низ', [
      ['m_jeans_white', 'Белые джинсы', '#F2EFE8', 'pants'],
      ['m_pants_beige', 'Бежевые брюки', '#D9C7A8', 'pants'],
      ['m_jeans_blue', 'Голубые джинсы', '#8FA9CB', 'pants'],
      ['m_skirt_black', 'Чёрная юбка миди', '#22201E', 'skirt'],
      ['m_shorts', 'Джинсовые шорты', '#7F9CC2', 'shorts']]]
  ],
  '7': [
    ['polo', 'Поло, Lime', [
      ['l_polo_cream', 'Кремовое трикотажное поло', '#EFE5D0', 'polo'],
      ['l_polo_navy', 'Тёмно-синее поло', '#1F2A44', 'polo'],
      ['l_polo_white', 'Белое поло', '#F8F6F1', 'polo']]],
    ['knit', 'Свитеры, Lime', [
      ['l_knit_grey', 'Серый джемпер', '#5E5F61', 'knit'],
      ['l_knit_camel', 'Бежевый кашемир', '#C8A97E', 'knit'],
      ['l_cable', 'Кремовый свитер с косами', '#EEE6D6', 'cable']]],
    ['shirt', 'Рубашки, Lime', [
      ['l_linen', 'Белая льняная рубашка', '#F6F3EC', 'shirt'],
      ['l_oxford', 'Голубая оксфорд', '#B7CCE6', 'shirt'],
      ['l_tee_white', 'Белая футболка с принтом', '#F7F5F0', 'tee', 'print2']]],
    ['bottom', 'Брюки, Lime', [
      ['l_chino', 'Бежевые чиносы', '#D8C7A4', 'pants'],
      ['l_linen_pants', 'Светлые льняные брюки', '#EDE6D6', 'pants'],
      ['l_wool_grey', 'Серые брюки', '#55524F', 'pants']]]
  ]
};
const WITEM = {}; Object.values(WARDROBE).forEach(cs=>cs.forEach(([c,,items])=>items.forEach(it=>{ WITEM[it[0]] = {id:it[0], name:it[1], color:it[2], kind:it[3], deco:it[4]||'', cat:c}; })));
const WDEF = {'4':{top:'m_tee_yel', bottom:'m_jeans_white'}, '7':{top:'l_polo_cream', bottom:'l_chino'}};
const outfitOf = (a, who) => ({top:WITEM[a?.top] || WITEM[WDEF[who]?.top], bottom:WITEM[a?.bottom] || WITEM[WDEF[who]?.bottom]});
const mixC = (c, k) => typeof mixHex==='function' ? mixHex(c, k>0?'#FFFFFF':'#000000', 1-Math.abs(k)) : c;

/* новые готовые образы, похожие на вас */
PRESETS['4'].push({skin:4,hair:'straight',hc:5,acc:'none',top:'m_tee_yel',bottom:'m_jeans_white'},
  {skin:4,hair:'straight',hc:5,acc:'sun',top:'m_tee_navy',bottom:'m_jeans_white'},
  {skin:0,hair:'waves',hc:7,acc:'earrings',top:'m_card_blue',bottom:'m_pants_beige'});
PRESETS['7'].push({skin:4,hair:'swept',hc:6,acc:'round',top:'l_knit_grey',bottom:'l_wool_grey'},
  {skin:4,hair:'swept',hc:6,acc:'square',top:'l_tee_white',bottom:'l_linen_pants'},
  {skin:0,hair:'swept',hc:6,acc:'round',top:'l_polo_cream',bottom:'l_chino'});

/* у Даши по умолчанию футболка 2mood, у Кирилла поло */
['7','4'].forEach(w=>{ const a = S.people?.[w]?.avatar; if(a && !a.top){ a.top = WDEF[w].top; a.bottom = WDEF[w].bottom; } });

/* ---------- рисование ---------- */
function avHair(a, h){
  let back='', front='';
  switch(a.hair){
    case 'short': front=`<path d="M28 44 Q27 19 50 18 Q73 19 72 44 Q68 31 50 30 Q33 31 28 44Z" fill="${h}"/>`;break;
    case 'long': back=`<path d="M25 46 Q24 15 50 15 Q76 15 75 46 L78 82 Q64 78 62 64 L38 64 Q36 78 22 82Z" fill="${h}"/>`;
      front=`<path d="M28 42 Q31 21 50 21 Q69 21 72 42 Q62 30 50 33 Q40 29 28 42Z" fill="${h}"/>`;break;
    case 'bun': back=`<circle cx="50" cy="14" r="10" fill="${h}"/>`;
      front=`<path d="M28 43 Q29 20 50 20 Q71 20 72 43 Q66 30 50 30 Q34 30 28 43Z" fill="${h}"/>`;break;
    case 'curly': front=[[31,34],[38,25],[48,21],[58,22],[67,28],[71,37],[29,42],[60,30],[42,30]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="${h}"/>`).join('');break;
    case 'side': front=`<path d="M27 46 Q25 18 52 18 Q74 19 73 44 Q70 32 60 30 Q46 40 30 38Z" fill="${h}"/>`;break;
    case 'straight': case 'waves': case 'bangs': {
      const w = a.hair==='waves';
      back=`<path d="M26 46 Q24 16 50 16 Q76 16 74 46 L76 100 L24 100Z" fill="${h}"/>`;
      const L = w ? `M40 24 Q29 30 28 46 Q26 56 30 64 Q26 72 30 82 Q27 90 31 100 L39 100 Q35 92 38 84 Q34 74 37 66 Q34 56 36 46 Q37 34 46 26Z`
                  : `M40 24 Q29 30 28 46 Q27 64 29 82 Q29 92 31 100 L38 100 Q36 90 36 80 Q35 64 36 48 Q37 34 46 26Z`;
      front = `<path d="${L}" fill="${h}"/><path d="${L}" fill="${h}" transform="translate(100 0) scale(-1 1)"/>`
        + (a.hair==='bangs' ? `<path d="M29 40 Q30 20 50 19 Q70 20 71 40 Q66 36 60 37 Q55 35 50 37 Q44 35 40 37 Q34 36 29 40Z" fill="${h}"/>`
                            : `<path d="M30 40 Q31 19 50 18 Q69 19 70 40 Q64 26 52 25 L50 22 L48 25 Q36 26 30 40Z" fill="${h}"/>`);
      break; }
    case 'bob': back=`<path d="M25 46 Q24 17 50 17 Q76 17 75 46 L76 66 Q70 70 64 65 L36 65 Q30 70 24 66Z" fill="${h}"/>`;
      front=`<path d="M28 42 Q30 21 50 20 Q70 21 72 42 Q66 34 56 36 Q50 32 44 36 Q34 34 28 42Z" fill="${h}"/>`;break;
    case 'pony': back=`<path d="M64 22 Q86 24 82 48 Q80 64 72 70 Q76 52 70 34Z" fill="${h}"/>`;
      front=`<path d="M28 44 Q27 19 50 18 Q73 19 72 44 Q70 31 50 28 Q31 31 28 44Z" fill="${h}"/><circle cx="68" cy="24" r="4" fill="${mixC(h,-.3)}"/>`;break;
    case 'braid': back=`<path d="M26 46 Q24 17 50 17 Q76 17 74 46 L72 60 L28 60Z" fill="${h}"/>`;
      front=`<path d="M28 44 Q28 20 50 19 Q72 20 72 44 Q66 30 52 27 Q40 28 33 40 Q30 50 31 58Z" fill="${h}"/>`
        + [62,70,78,86,94].map((y,i)=>`<ellipse cx="${30+i*.6}" cy="${y}" rx="5" ry="5.5" fill="${h}"/>`).join('');break;
    case 'swept': front=`<path d="M27 44 Q24 22 36 16 Q50 9 64 15 Q76 21 73 42 Q71 30 62 25 Q54 22 46 25 Q36 28 33 36 Q30 39 27 44Z" fill="${h}"/><path d="M40 20 Q52 14 66 20" stroke="${mixC(h,.18)}" stroke-width="1.4" fill="none"/>`;break;
  }
  return {back, front};
}
function avAcc(a, h, shirt){
  switch(a.acc){
    case 'glasses': return `<g fill="none" stroke="#3B2A1E" stroke-width="2"><circle cx="42" cy="47" r="6"/><circle cx="58" cy="47" r="6"/><path d="M48 47h4"/></g>`;
    case 'round': return `<g fill="none" stroke="#9A8E80" stroke-width="1.3"><circle cx="41" cy="47" r="7"/><circle cx="59" cy="47" r="7"/><path d="M48 46 Q50 44 52 46M34 46l-6-1M66 46l6-1"/></g>`;
    case 'square': return `<g fill="rgba(255,255,255,.12)" stroke="#B9AEA2" stroke-width="1.3"><rect x="32" y="40" width="15" height="14" rx="3"/><rect x="53" y="40" width="15" height="14" rx="3"/><path d="M47 46 Q50 44 53 46" fill="none"/></g>`;
    case 'sun': return `<g fill="#1A1714"><path d="M31 41 h16 v8 q-1 6 -8 6 q-7 0 -8 -6Z"/><path d="M53 41 h16 v8 q-1 6 -8 6 q-7 0 -8 -6Z"/><rect x="46" y="42" width="8" height="2"/></g>`;
    case 'earrings': return `<circle cx="28.5" cy="57" r="2" fill="#D9B45A"/><circle cx="71.5" cy="57" r="2" fill="#D9B45A"/>`;
    case 'beard': return `<path d="M30 50 Q31 72 50 73 Q69 72 70 50 Q66 62 57 60 Q50 57 43 60 Q34 62 30 50Z" fill="${h}"/><path d="M44 59 Q50 63 56 59" stroke="#3B2A1E" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'cap': return `<path d="M27 38 Q28 17 50 17 Q72 17 73 38Z" fill="${shirt}"/><path d="M50 36 L84 38 Q80 43 70 41Z" fill="${shirt}"/><circle cx="50" cy="18" r="2.5" fill="#fff" opacity=".6"/>`;
    case 'phones': return `<path d="M26 46 Q26 14 50 14 Q74 14 74 46" fill="none" stroke="#3B2A1E" stroke-width="3"/><rect x="21" y="42" width="9" height="14" rx="4" fill="#3B2A1E"/><rect x="70" y="42" width="9" height="14" rx="4" fill="#3B2A1E"/>`;
    case 'flower': return `<g transform="translate(69 27)">${[0,72,144,216,288].map(r=>`<ellipse rx="3.5" ry="6" cy="-5" fill="#E8A0A8" transform="rotate(${r})"/>`).join('')}<circle r="3" fill="#F2C14E"/></g>`;
  }
  return '';
}
/* верх одежды на плечах аватара */
function avTop(t, s){
  const c = t.color, d = mixC(c, -.18), l = mixC(c, .35);
  const wide = ['teeo','knit','cable','hoodie','cardigan','jacket'].includes(t.kind);
  const body = wide ? `M13 104 Q14 73 50 71 Q86 73 87 104Z` : `M18 104 Q20 74 50 72 Q80 74 82 104Z`;
  let x = '';
  switch(t.kind){
    case 'tee': case 'teeo': case 'long': x = `<path d="M42 72.5 Q50 79 58 72.5" stroke="${d}" stroke-width="2" fill="none"/>`; break;
    case 'knit': x = `<path d="M41 72 Q50 80 59 72" stroke="${d}" stroke-width="3.5" fill="none"/>`; break;
    case 'cable': x = `<path d="M41 72 Q50 80 59 72" stroke="${d}" stroke-width="3.5" fill="none"/>${[36,50,64].map(cx=>`<path d="M${cx} 84 q-3 3 0 6 q3 3 0 6 q-3 3 0 6" stroke="${d}" stroke-width="1.6" fill="none"/>`).join('')}`; break;
    case 'hoodie': x = `<path d="M34 74 Q50 86 66 74" stroke="${d}" stroke-width="5" fill="none"/><path d="M46 80 v10 M54 80 v10" stroke="${l}" stroke-width="1.4"/>`; break;
    case 'polo': x = `<path d="M43 72 L50 81 L45 85 L39 75Z M57 72 L50 81 L55 85 L61 75Z" fill="${l}" stroke="${d}" stroke-width=".8"/><path d="M50 81 v9" stroke="${d}" stroke-width="1"/><circle cx="50" cy="85" r="1" fill="${d}"/>`; break;
    case 'shirt': x = `<path d="M42 71 L50 80 L44 84 L38 74Z M58 71 L50 80 L56 84 L62 74Z" fill="${l}" stroke="${d}" stroke-width=".8"/><path d="M50 80 v24" stroke="${d}" stroke-width="1"/>${[86,93,100].map(y=>`<circle cx="52.5" cy="${y}" r="1" fill="${d}"/>`).join('')}`; break;
    case 'cardigan': x = `<path d="M42 72 L50 104 L58 72 Q50 77 42 72Z" fill="#F4F1EA"/><path d="M42 72 L50 104 M58 72 L50 104" stroke="${d}" stroke-width="1.2"/>${[86,95].map(y=>`<circle cx="${50-(104-y)*.18}" cy="${y}" r="1.1" fill="${d}"/>`).join('')}`; break;
    case 'jacket': x = `<path d="M41 72 L50 104 L59 72 Q50 77 41 72Z" fill="#F4F1EA"/><path d="M41 72 L36 84 L45 88 Z M59 72 L64 84 L55 88Z" fill="${d}"/>`; break;
  }
  if(t.deco==='print') x += `<rect x="42" y="84" width="16" height="12" rx="2" fill="${mixC(c,-.35)}" opacity=".55"/><circle cx="50" cy="90" r="3.4" fill="${l}"/>`;
  if(t.deco==='text') x += `<path d="M42 88 h16 M44 92 h12" stroke="${mixC(c,-.4)}" stroke-width="1.6"/>`;
  if(t.deco==='print2') x += `<circle cx="50" cy="88" r="3" fill="none" stroke="#3B3A38" stroke-width="1"/><path d="M47 93 l6 5" stroke="#3B3A38" stroke-width="1"/>`;
  return `<path d="${body}" fill="${c}"/>${x}`;
}

/* полная замена рисования аватара (структура прежняя, чтобы раздел «Тело» мог взять голову) */
avatarSVG = function(a, who, size=48, badge=true){
  const shirt = colorOf(who), bg = softOf(who);
  const s = SKIN[a.skin]||SKIN[0], h = HAIRC[a.hc]||HAIRC[0];
  const {back, front} = avHair(a, h), acc = avAcc(a, h, shirt);
  const top = outfitOf(a, who).top;
  const mouth = a.acc==='beard' ? '' : `<path d="M44 57 Q50 62 56 57" stroke="#3B2A1E" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const lips = who==='4' && a.acc!=='beard' ? `<path d="M45 57.5 Q50 60.5 55 57.5 Q50 59 45 57.5Z" fill="#C97B7B" opacity=".55"/>` : '';
  const brows = `<path d="M37 40 Q42 38 46 40" stroke="${mixC(h,-.1)}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M54 40 Q58 38 63 40" stroke="${mixC(h,-.1)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const b = badge ? `<circle cx="80" cy="80" r="15" fill="${shirt}" style="stroke:var(--card)" stroke-width="3"/><text x="80" y="86" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="-apple-system,Segoe UI,sans-serif">${who}</text>` : '';
  const cid = 'cl'+who+size+Math.random().toString(36).slice(2,6);
  return `<svg class="av" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="${cid}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
    <circle cx="50" cy="50" r="48" fill="${bg}"/>
    <g clip-path="url(#${cid})">${back}
      <g class="av-top">${top ? avTop(top, s) : `<path d="M18 104 Q20 74 50 72 Q80 74 82 104Z" fill="${shirt}"/>`}</g>
      <rect x="44" y="60" width="12" height="14" rx="5" fill="${s}"/>
      <circle cx="50" cy="46" r="22" fill="${s}"/>
      ${brows}<circle cx="42" cy="47" r="2.4" fill="#3B2A1E"/><circle cx="58" cy="47" r="2.4" fill="#3B2A1E"/>
      <circle cx="37" cy="54" r="3.2" fill="#E8A0A8" opacity=".55"/><circle cx="63" cy="54" r="3.2" fill="#E8A0A8" opacity=".55"/>
      ${mouth}${lips}${front}${acc}</g>${b}</svg>`;
};

/* ---------- редактор: блок «Одежда» ---------- */
(function(){
  const _ed = avatarEditor, _bind = bindAvatarEditor;
  avatarEditor = (a, w) => {
    const cats = WARDROBE[w] || [], o = outfitOf(a, w);
    const cat = UI.wcat && cats.some(c=>c[0]===UI.wcat) ? UI.wcat : cats[0]?.[0];
    const items = (cats.find(c=>c[0]===cat)||[])[2] || [];
    const sel = cat==='bottom' ? o.bottom?.id : o.top?.id;
    return _ed(a, w) + `<div class="field"><label>Одежда${w==='4'?'':' · Lime, old money'}</label>
      <div class="seg wd-cats">${cats.map(([k,n])=>`<button data-wcat="${k}" class="${k===cat?'on':''}">${n}</button>`).join('')}</div>
      <div class="wd-items">${items.map(([id,n,c])=>`<button data-wear="${id}" class="${sel===id?'on':''}"><i style="background:${c}"></i><span>${esc(n)}</span></button>`).join('')}</div>
      <p class="fhint" style="margin:6px 0 0">Сейчас: ${esc(o.top?.name||'')}${o.bottom?', '+esc(o.bottom.name.toLowerCase()):''}. Низ виден на силуэте в разделе «Тело».</p></div>`;
  };
  bindAvatarEditor = (getA, w, after) => {
    _bind(getA, w, after);
    $root.querySelectorAll('[data-wcat]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); UI.wcat=b.dataset.wcat; after(); });
    $root.querySelectorAll('[data-wear]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const it=WITEM[b.dataset.wear], a=getA();
      if(it.cat==='bottom') a.bottom=it.id; else a.top=it.id; after(); });
  };
})();

document.head.insertAdjacentHTML('beforeend', `<style>
.wd-cats{display:flex;overflow-x:auto;max-width:100%}.wd-cats button{white-space:nowrap}
.wd-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:8px}
.wd-items button{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--bg);border:1.5px solid var(--line);text-align:left;font-size:13px;line-height:1.2}
.wd-items button.on{border-color:var(--c7);background:var(--c7soft)}
.wd-items i{width:22px;height:22px;border-radius:7px;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
.avgrid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}
</style>`);
