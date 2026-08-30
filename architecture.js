const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
let FACTS=null,STRUCTURE=null,busy=false;
const sleep=t=>new Promise(r=>setTimeout(r,t));
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const info={
 chat:{type:'HUMAN EVENT',title:'CHAT',text:'人の発話は自律系を起動する必須スイッチではなく、内部へ流れ込む一つのイベント。',file:'public UI / tools/auto/admin.mjs'},
 repository:{type:'RETRIEVAL',title:'REPOSITORY',text:'コード・設計書・ログ・履歴を根拠として取り出す。会話側へは必要な要約だけを出す。',file:'1F 保管庫本体 / index.mjs / cli.mjs'},
 context:{type:'ASSEMBLY',title:'CONTEXT',text:'観測、履歴、禁止境界、権限を束ねて対話器官へ渡す論理層。',file:'persona-kernel.json / ledger / observation records'},
 files:{type:'SOURCE',title:'APP FILES',text:'アプリ自身のコード、操作履歴、失敗、ログが発達の入力になる。',file:'開発アプリ保管庫 / project files'},
 vault:{type:'1F',title:'VAULT CORE',text:'アプリ取り込み、モジュール分離、guard検出、署名など保管庫本体の機能。',file:'index.mjs / cli.mjs'},
 fairy:{type:'2F',title:'FAIRY CORE',text:'採点、追記台帳、tripwire、五相の環など、改善機構そのもの。',file:'score.mjs / ledger.mjs / tripwires.mjs'},
 admin:{type:'3F',title:'ADMIN / DRIVE',text:'課題選択、隔離実験室、状態収集、会話UI、自発発話を束ねる司令塔。',file:'tools/auto/admin.mjs / drive.mjs'},
 supervisor:{type:'4.5F',title:'SHADOW SUPERVISOR',text:'影workerのPID・instanceId・heartbeatを監視し、無ければ起動、staleなら安全に回収する。',file:'tools/auto/shadow-supervisor.mjs'},
 phantom:{type:'SHADOW',title:'PHANTOM LOOP',text:'本番記録を読取専用で写し、別時計で世代を連続実行する。既定は12世代/バッチ、heartbeatは2秒。',file:'fairy-py/world/phantom_loop.py :: run_loop()'},
 evolution:{type:'CELL CYCLE',title:'ADAPT / SELECT / INHERIT',text:'世代評価、選択、継承、提案生成、人の決定読込、ChronicleRing適応へ繋がる。',file:'phantom_loop.py :: world.advance / ring.adapt'},
 worldline:{type:'COUNTERFACTUAL',title:'WORLDLINES',text:'反実仮想6分岐を使い、壊れや暴走を本番へ逆流させず経験化する。',file:'worldline-experiences.jsonl'},
 ledger:{type:'MEMORY',title:'APPEND-ONLY LEDGER',text:'会話・経験・提案・世代結果を追記で保持し、器官同士を来歴付きでつなぐ。',file:'fairy/ledger.mjs / fairy-py/fairy/ledger.py'},
 dialogue:{type:'EVENT DRIVEN',title:'NATIVE DIALOGUE',text:'人からメッセージが届いた時だけNativeMind.converse()へ渡す。',file:'fairy-py/world/native_dialogue.py'},
 mind:{type:'INDIVIDUAL BOUNDARY',title:'NATIVE MIND / CHRONICLE RING',text:'観測→解釈→想起→統合→発話を一周。現在の実コード再点検では externalModelUsed=false。',file:'fairy-py/fairy/native_mind.py'},
 proactive:{type:'AUTONOMOUS VOICE',title:'proactiveThoughts()',text:'人が黙っていても、一定条件で世代・提案・淘汰・門番の状態を自分から会話へ出す。',file:'tools/auto/admin.mjs :: proactiveThoughts / offerProactiveThought'},
 response:{type:'OUTPUT',title:'RESPONSE',text:'対話器官または自発発話から、同じ会話ログへ戻る。将来ここへ実LLMの言語化を差し込める。',file:'admin.mjs / NativeMind.converse()'},
 gate:{type:'CONTROL',title:'LOCAL INFERENCE GATE',text:'交換可能なローカル推論器を、起動する前に安全条件で検査する。モデル本体の実行器ではない。',file:'fairy-py/fairy/local_inference_substrate.py'},
 reality:{type:'BLOCKED',title:'REALITY GATE',text:'現実への書込みだけは自律ループと分離。公開版では完全無効、本体でも別の人間承認を要求する。',file:'persona-kernel.json :: productionChange'}
};
const human=['h1','h2','h3','h4','h5'];
const auto=['a1','a2','a3','a4','a5','a6','a7','a8','a9','a10'];
const all=[...human,...auto,'s1','s2','b1','b2'];

function select(id){
  $$('.node,.proactive').forEach(x=>x.classList.toggle('active',x.dataset.id===id));
  const d=info[id]||{};$('#inspectType').textContent=d.type||'—';$('#inspectTitle').textContent=d.title||id;$('#inspectText').textContent=d.text||'—';$('#inspectFile').textContent=d.file||'—';
}
async function play(ids,label){if(busy)return;busy=true;$('#flowStatus').textContent=label;for(const id of ids){const w=$('#'+id);if(!w)continue;w.classList.add('active');await sleep(360);w.classList.remove('active')}$('#flowStatus').textContent=label+' / COMPLETE';busy=false}
function buildWalls(){
  const names=['主権の門','追記台帳','三状態判定','範囲の狭窄','逆流禁止','人の承認','署名済証拠','表裏の分離'];const r=$('#wallRing');
  names.forEach((n,i)=>{const b=document.createElement('button');b.className='wall';b.textContent=n;const a=i*45;b.style.transform=`rotate(${a}deg) translateY(-140px) rotate(${-a}deg)`;b.onclick=()=>{b.classList.toggle('hot');$('#inspectType').textContent='SOVEREIGN WALL';$('#inspectTitle').textContent=n;$('#inspectText').textContent='統合人格の周囲を巡回する不可侵・検証境界として可視化。';$('#inspectFile').textContent='public design mapping / persona authority / sovereign gates'};r.appendChild(b)})
}
function buildActual(){const r=STRUCTURE.actualRecheck;const rows=[['admin server',r.adminServerStarted],['shadow spawned',r.shadowWorkerSpawned],['generation',`G${r.generationObservedBefore} → G${r.generationObservedAfter}`],['dialogue',r.nativeDialogueAnswered],['external model',r.externalModelUsed],['isolated copy',r.isolatedCopy]];$('#recheck').innerHTML=rows.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(String(v))}</b></div>`).join('');$('#limitations').innerHTML=STRUCTURE.limitations.map(x=>`<div class="limit-item">${esc(x)}</div>`).join('')}
async function load(){[FACTS,STRUCTURE]=await Promise.all([fetch('./data/verified-facts.json',{cache:'no-store'}).then(r=>r.json()),fetch('./data/runtime-structure.json',{cache:'no-store'}).then(r=>r.json())]);const s=FACTS.snapshot;$('#headState').textContent=s.statusState||'snapshot';$('#headGen').textContent='G'+s.generationEnd;buildActual();buildWalls()}
$$('.node,.proactive').forEach(n=>n.onclick=()=>select(n.dataset.id));
$('#playHuman').onclick=()=>play(human,'HUMAN EVENT FLOW');
$('#playAuto').onclick=()=>play(auto,'AUTONOMOUS LOOP');
$('#playAll').onclick=()=>play(all,'FULL SYSTEM FLOW');
$('#toggleWalls').onclick=()=>{$('#wallRing').classList.toggle('paused');$('#toggleWalls').textContent=$('#wallRing').classList.contains('paused')?'8枚の壁を回す':'8枚の壁を止める'};
load().catch(e=>{$('#flowStatus').textContent='LOAD ERROR';console.error(e)});
