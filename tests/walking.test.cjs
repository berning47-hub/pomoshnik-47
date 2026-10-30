const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const inputs={};
function input(value=''){return {value,id:'',checkValidity:()=>true,reportValidity(){}};}
const context={
 S:{me:'7',walks:[{id:'walk',title:'Test'}],bodyp:{'7':{h:180,w:70}},placecfg:{speed:4.5}},UI:{},ARR:{},
 localStorage:{getItem:()=>''},window:{},document:{head:{insertAdjacentHTML(){}}},
 $root:{querySelector:s=>inputs[s]||null,querySelectorAll:s=>s==='.wa-fields input'?Object.entries(inputs).filter(([k])=>/^#wa-(date|km|minutes|up|down|stride|kg)$/.test(k)).map(([,v])=>v):[]},
 plWalks:()=>'<button class="fbtn" data-plwedit="walk">Edit</button>',modalView(){},bind(){},settingsPage:()=>'',
 plWalkCalc:()=>({km:3,walkMin:40,stayMin:60,pts:[{lat:41,lng:44},{lat:41.01,lng:44.02}]}),
 render(){},save(){},toast(){},uid:()=> 'activity-id',localISO:()=> '2026-10-30',fem:()=>false,
 esc:x=>String(x),pname:x=>x,plKmStr:x=>x+' km',fmtMin:x=>x+' min',setTimeout,clearTimeout,URLSearchParams,AbortController,
 plKm:(a,b)=>Math.hypot(a.lat-b.lat,a.lng-b.lng)*111
};
vm.createContext(context);vm.runInContext(fs.readFileSync('walking.js','utf8'),context);
function run(s){return vm.runInContext(s,context);}
assert.ok(context.ARR.activity,'registered for sync');
assert.match(context.plWalks(),/data-wa-open="walk"/);
let n=run('waNumbers({km:3,minutes:40,stride:.75,kg:70,up:0})');
assert.equal(n.steps,4000);assert.ok(n.active>0);
assert.ok(run('waNumbers({km:3,minutes:40,stride:.75,kg:70,up:200}).active')>n.active);
assert.equal(run('waNumbers({km:3,minutes:40,stride:.75,kg:"",up:0}).active'),null);
context.waOpen('walk');assert.equal(context.UI.modal.who,'7');
for(const [k,v] of Object.entries({date:'2026-10-30',km:'3',minutes:'40',up:'100',down:'',stride:'.75',kg:'70'}))inputs['#wa-'+k]=input(v);
inputs['#wa-save']=input();inputs['#wa-route']=input();context.bind();inputs['#wa-save'].onclick();
assert.equal(context.S.activities.length,1);assert.equal(context.S.activities[0].by,'7');
assert.equal(context.S.activities[0].steps,4000);assert.equal(context.S.activities[0].down,null);
assert.equal(context.UI.section,'body');assert.equal(context.UI.bdtab,'activity');
context.waOpen('walk');context.bind();inputs['#wa-save'].onclick();assert.equal(context.S.activities.length,1,'same day does not duplicate');
context.waOpen('walk');context.bind();context.S.me='4';inputs['#wa-save'].onclick();assert.equal(context.S.activities.length,1,'changed user cannot save old form');
context.S.me='7';
(async()=>{
 const geo={features:[{geometry:{type:'LineString',coordinates:[[44,41,100],[44.01,41,150],[44.02,41,110],[44.03,41,210]]}}]};
 context.geo=geo;
 const parsed=run('waParseRoute(geo)');assert.equal(parsed.up,150);assert.equal(parsed.down,40);assert.ok(parsed.adjusted>parsed.minutes);
 const missing=JSON.parse(JSON.stringify(geo));delete missing.features[0].geometry.coordinates[1][2];context.missing=missing;
 assert.equal(run('waParseRoute(missing).up'),null);assert.ok(run('waParseRoute(missing).warnings.length')>1);
 assert.throws(()=>run('waParseRoute({features:[]})'));
 context.bad={features:[{geometry:{type:'LineString',coordinates:[[null,41],[44,41]]}}]};assert.throws(()=>run('waParseRoute(bad)'));
 let url;
 context.fetch=async u=>{url=u;return {ok:true,json:async()=>geo};};
 context.waOpen('walk');await context.waRoute(context.UI.modal);
 assert.equal(new URL(url).searchParams.get('profile'),'hiking-mountain');assert.ok(!url.includes('key='));
 assert.equal(context.UI.modal.draft.source,'brouter-plan');assert.equal(context.S.activities.length,1,'forecast is not a completed activity');
 context.fetch=async()=>({ok:false});context.waOpen('walk');await context.waRoute(context.UI.modal);assert.ok(context.UI.modal.error);assert.equal(context.UI.modal.busy,false);
 let release;context.fetch=()=>new Promise(r=>{release=r;});context.waOpen('walk');const pending=context.waRoute(context.UI.modal);context.UI.modal=null;release({ok:true,json:async()=>geo});await pending;assert.equal(context.UI.modal,null);
 const drawn=[];context.document.documentElement={};context.getComputedStyle=()=>({getPropertyValue:k=>k==='--route-outline'?'#FFFFFF':'#1675D1'});
 context.L={polyline:(points,options)=>({addTo(target){drawn.push({points,options,target});return this;}})};
 context.waRouteLine('map',[{lat:41,lng:44},{lat:41.1,lng:44.1}]);assert.equal(drawn.length,2);assert.equal(drawn[0].options.color,'#FFFFFF');assert.equal(drawn[0].options.weight,7);assert.equal(drawn[1].options.weight,4);assert.equal(drawn[1].options.dashArray,'10 8');
 assert.ok(context.plWalkCalc(context.S.walks[0]).road,'cached road distance reused by walk cards');context.S.placecfg.speed=3.5;assert.ok(!context.plWalkCalc(context.S.walks[0]).road,'speed change invalidates cache');
 console.log('PASS: estimates, sync, own save, deduplication, ownership, GeoJSON validation, missing elevations, keyless hiking request, failure and cancellation');
})().catch(e=>{console.error(e);process.exitCode=1;});
