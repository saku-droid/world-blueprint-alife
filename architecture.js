const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
let FACTS=null,STRUCTURE=null,busy=false;
const sleep=t=>new Promise(r=>setTimeout(r,t));
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const info={
 files:{type:'SOURCE',title:'アプリのファイルを見る',text:'コード、ログ、操作履歴、失敗、提案などが観察対象になります。ここが発達の材料。',file:'開発アプリ保管庫 / index.mjs / cli.mjs / logs'},
 core:{type:'AUTONOMOUS CORE',title:'自律して育つ核',text:'人が話していない間も、観察→影で試す→評価→淘汰・継承→台帳の循環を回します。',file:'admin.mjs → shadow-supervisor.mjs → phantom_loop.py → ledger'},
 proactive:{type:'AUTONOMOUS VOICE',title:'話す価値がある？',text:'内部で何か起きたからといって毎回LLMを呼ぶのではなく、発話条件を超えた時だけ会話へ出す設計です。',file:'tools/auto/admin.mjs :: proactiveThoughts() / offerProactiveThought()'},
 chat:{type:'CHAT',title:'会話に出てくる',text:'向こうから話す場合も、人から聞かれた場合も、最終的には同じ会話ログへ出ます。',file:'admin.mjs / native_dialogue.py / NativeMind.converse()'},
 reality:{type:'HUMAN GATE',title:'本番変更は人に聞く',text:'現実への書込みだけは自律ループから切り離します。公開版は完全無効。本体も別の人間承認が必要です。',file:'persona-kernel.json :: productionChange = separate-human-approval-required'},
 observe:{type:'A / OBSERVE',title:'観察する',text:'保管庫本体とADMINがアプリの状態、ログ、失敗、提案を読みます。',file:'index.mjs / cli.mjs / tools/auto/admin.mjs'},
 shadow:{type:'B / EXPERIMENT',title:'影で試す',text:'SUPERVISORが影workerを監督し、PHANTOMが別時計で世代を回します。世界線もここで本番から隔離。',file:'shadow-supervisor.mjs / phantom_loop.py / worldline-experiences.jsonl'},
 judge:{type:'C / JUDGE',title:'評価する',text:'passed / rejected / unavailable を分け、検査不能を成功扱いしない。安全壁を弱めない。',file:'tripwires.mjs / checks / sovereign gates'},
 inherit:{type:'D / EVOLVE',title:'淘汰・継承',text:'世代評価から選択・継承・提案生成・ChronicleRing適応へ進みます。',file:'phantom_loop.py :: world.advance / ring.adapt'},
 ledger:{type:'E / MEMORY',title:'台帳へ残す',text:'会話、経験、提案、世代結果を追記で保持し、次の循環が過去を参照できるようにします。',file:'fairy/ledger.mjs / fairy-py/fairy/ledger.py'}
};
function select(id){const d=info[id];if(!d)return;$('#inspectType').textContent=d.type;$('#inspectTitle').textContent=d.title;$('#inspectText').textContent=d.text;$('#inspectFile').textContent=d.file;}
async function pulse(ids,label){if(busy)return;busy=true;$('#flowStatus').textContent=label;for(const id of ids){const e=$('#'+id);if(!e)continue;e.classList.add('active');await sleep(520);e.classList.remove('active')}$('#flowStatus').textContent=label+' / COMPLETE';busy=false}
function buildActual(){const r=STRUCTURE.actualRecheck;const rows=[['admin server',r.adminServerStarted],['shadow spawned',r.shadowWorkerSpawned],['generation',`G${r.generationObservedBefore} → G${r.generationObservedAfter}`],['dialogue',r.nativeDialogueAnswered],['external model',r.externalModelUsed],['isolated copy',r.isolatedCopy]];$('#recheck').innerHTML=rows.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(String(v))}</b></div>`).join('');$('#limitations').innerHTML=STRUCTURE.limitations.map(x=>`<div class="limit-item">${esc(x)}</div>`).join('')}
async function load(){[FACTS,STRUCTURE]=await Promise.all([fetch('./data/verified-facts.json',{cache:'no-store'}).then(r=>r.json()),fetch('./data/runtime-structure.json',{cache:'no-store'}).then(r=>r.json())]);const s=FACTS.snapshot;$('#headState').textContent=s.statusState||'snapshot';$('#headGen').textContent='G'+s.generationEnd;buildActual()}
$$('[data-id]').forEach(n=>n.addEventListener('click',()=>select(n.dataset.id)));
$('#coreNode').addEventListener('click',()=>{select('core');$('#coreDetail').classList.add('open');$('#coreDetail').setAttribute('aria-hidden','false');setTimeout(()=>$('#coreDetail').scrollIntoView({behavior:'smooth',block:'nearest'}),80)});
$('#closeCore').onclick=()=>{$('#coreDetail').classList.remove('open');$('#coreDetail').setAttribute('aria-hidden','true')};
$('#playAuto').onclick=()=>pulse(['sFiles','sTalk'],'AUTONOMOUS: FILES → GROW → SPEAK');
$('#playTalk').onclick=()=>pulse(['sReply'],'HUMAN CHAT → CORE → REPLY');
$('#playWrite').onclick=()=>pulse(['sWrite'],'PRODUCTION WRITE → HUMAN GATE');
load().catch(e=>{console.error(e);$('#flowStatus').textContent='LOAD ERROR'});
