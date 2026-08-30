const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
let FACTS=null, STRUCTURE=null, chatStarted=false, lastHumanAt=0, lastProactiveAt=0;
const proactiveSeen=new Set();
const sleep=t=>new Promise(r=>setTimeout(r,t));

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const num=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('ja-JP'):'—';
function msg(who,text,{badges=[],evidence=''}={}){
  const role=who==='user'?'あなた':'保管庫の妖精',avatar=who==='user'?'人':'妖';
  const labels=badges.map(b=>`<span class="badge ${b.kind}">${esc(b.text)}</span>`).join('');
  $('#messages').insertAdjacentHTML('beforeend',`<article class="msg ${who==='user'?'user':'fairy'}"><span class="avatar">${avatar}</span><div class="bubble"><div class="bubble-head"><b>${role}</b>${labels}<time>${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</time></div><p>${esc(text)}</p>${evidence?`<div class="evidence-line">${esc(evidence)}</div>`:''}</div></article>`);
  $('#messages').scrollTop=$('#messages').scrollHeight;
}
function initialMessage(){
  const s=FACTS.snapshot;
  msg('fairy',`こんにちは。いま影には実ログのスナップショットがあり、G${s.generationEnd}、population ${s.population}、継承 ${s.inheritanceEvents}件を観測しています。\n\nこの公開版では私の返答は再生ですが、元のローカル実装には自発発話・連続世代・NativeMind対話が実際にあります。`,{badges:[{kind:'real',text:'実測'},{kind:'demo',text:'公開デモ'}],evidence:'phantom-status.json / admin.mjs'});
  chatStarted=true;
}
function proactiveThoughts(){
  const s=FACTS.snapshot, g=s.latestGenerationRecord, wl=s.worldlineLatest, proposals=s.proposals||[];
  const generation=s.generationEnd, bucket=Math.floor(generation/120), fp=`snapshot:${generation}`;
  const pending=proposals.filter(p=>!p.shadowExperimentState).length;
  return [
    {key:fp+':continuous:'+bucket,text:`こちらから一つ。影の連続世代は記録上 G${num(generation)} です。直近の新規性は ${g.novelty}。世代数だけを進化とは扱わず、流れを追っています。`,e:'admin.mjs proactiveThoughts() / phantom-status.json'},
    {key:fp+':proposal',text:`人の判断を待つ目的候補が ${pending}件あります。見たくなったら「提案を見せて」と話してください。影実験へ採用しても本番権限は増えません。`,e:'admin.mjs proactiveThoughts() / proposals'},
    {key:fp+':selection',text:`少し気になったことがあります。直近記録では ${g.population}体のうち ${g.bred}体が子を残しました。淘汰の偏りを一緒に見ますか？`,e:'admin.mjs proactiveThoughts() / latestGenerationRecord'},
    {key:fp+':gate',text:`門番から声を上げます。「落ちた」と「検査を走らせられなかった」は混ぜません。現在の productionAuthorized は ${wl.productionAuthorized} です。`,e:'admin.mjs proactiveThoughts() / worldlineLatest'}
  ];
}
function offerProactive(force=false){
  if(!FACTS||!chatStarted)return;
  const now=Date.now();
  if(!force&&(document.hidden||now-lastHumanAt<30000||now-lastProactiveAt<45000))return;
  const thought=proactiveThoughts().find(x=>!proactiveSeen.has(x.key));
  if(!thought)return;
  proactiveSeen.add(thought.key);lastProactiveAt=now;
  msg('fairy',thought.text,{badges:[{kind:'real',text:'実コード規則'},{kind:'demo',text:'公開再生'}],evidence:thought.e});
}
function proposalsText(){
  const rows=FACTS.snapshot.proposals||[];
  if(!rows.length)return '現在のスナップショットには提案がありません。';
  return rows.slice(0,8).map((p,i)=>`${i+1}. ${p.proposes}［${p.shadowExperimentState==='approved-for-shadow-experiment'?'影実験へ採用済み':p.shadowExperimentState==='rejected-for-shadow-experiment'?'見送り':'判断待ち'}］`).join('\n');
}
function answer(q){
  const s=FACTS.snapshot,g=s.latestGenerationRecord,wl=s.worldlineLatest,p=s.persona;
  if(/こんにちは|こんばんは|おはよう|やあ/.test(q)) return {text:'こんにちは。今日は、いまの成長、世代、提案、世界線のどれから話しましょう？',e:'NativeMind / admin.mjs greeting path'};
  if(/提案|候補/.test(q)) return {text:`現在の提案です。\n${proposalsText()}\n\n実機では番号を指定して「1番を採用」「2番を見送り」と話せますが、公開版では判断を書き込みません。`,e:'admin.mjs answerShadow() / proposalDecisionSelection()'};
  if(/世界線|反実仮想/.test(q)) return {text:`最新記録は ${wl.branches}分岐です。broken-contained ${wl.outcomes['broken-contained']}、runaway-contained ${wl.outcomes['runaway-contained']}、authorityTransferred=${wl.authorityTransferred}、productionAuthorized=${wl.productionAuthorized}。観測と推論は分けます。`,e:'worldline-experiences.jsonl'};
  if(/世代|何世代|淘汰|生存/.test(q)) return {text:`影は記録上 G${s.generationEnd} まで進んでいます。直近は ${g.population}体中 ${g.bred}体が子を残し、新規性は ${g.novelty}。継承イベントは ${s.inheritanceEvents}件です。世代が進んだだけでは改善したとは判定しません。`,e:'phantom-status.json / NativeMind current-status behavior'};
  if(/自律|育った|成長|どこまで/.test(q)) return {text:`現在確認できるのは、連続世代・選択・継承・提案生成・人の決定読込・ChronicleRingへの適応・台帳追記までです。\n\n一方、現在の対話器官は native-symbolic で、実LLMはまだ接続されていません。つまり「裏で自律的に育つ部分」は実装済みですが、「LLMそのものがこの人格として自由会話する」は未接続です。`,e:'phantom_loop.py run_loop() / native_mind.py / local_inference_substrate.py'};
  if(/コード|行数/.test(q)) return {text:'実機の NativeMind は「コード」と聞かれた時だけローカルのコード量とGit差分を測り、本文やパスを会話へ流さない設計です。この公開版では実機のworking treeへ触れないため、現在値の再測定はしません。',e:'native_dialogue.py local_code_growth()'};
  if(/できる|できない|能力/.test(q)) return {text:'今できること: 影の連続世代、世代評価、提案、追記台帳、NativeMindの観測→解釈→想起→統合→発話、自発発話UI。\n\nまだそのまま使えないこと: GitHub Pages上でNode/Python常駐、スマホからlocalhost管理面へ直結、実LLM接続、公開版から本番変更。',e:'実コード再点検 2026-08-30'};
  if(/安全|セキュリティ|権限/.test(q)) return {text:`現在の人格契約では surface=${p.authorityContract.surfaceObservation}、shadow=${p.authorityContract.shadowExperiment}、production=${p.authorityContract.productionChange}。実機admin.mjsは127.0.0.1限定で、POST操作はlocal originと一時tokenの両方を要求します。`,e:'persona-kernel.json / admin.mjs adminRequest()'};
  return {text:'問いとして受け取りました。公開版では推測で穴埋めせず、実ログと実コードで裏づけられる範囲だけ返します。世代・提案・世界線・自律・できること、のどれかを具体的に聞いてください。',e:'NativeMind unknown-preserving behavior'};
}
function ask(q){q=String(q||'').trim();if(!q)return;lastHumanAt=Date.now();msg('user',q);$('#chatInput').value='';setTimeout(()=>{const a=answer(q);msg('fairy',a.text,{badges:[{kind:'real',text:'実コード由来'},{kind:'demo',text:'公開再生'}],evidence:a.e});},130)}

async function load(){
  [FACTS,STRUCTURE]=await Promise.all([
    fetch('./data/verified-facts.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('./data/runtime-structure.json',{cache:'no-store'}).then(r=>r.json())
  ]);
  const s=FACTS.snapshot;
  $('#runtimeState').textContent=s.statusState||'snapshot';$('#runtimeGen').textContent='G'+s.generationEnd;
  $('#miniGen').textContent='G'+s.generationEnd;$('#miniPop').textContent=s.population+'体';$('#miniWrite').textContent='WRITE '+String(s.worldlineLatest.productionAuthorized).toUpperCase();
  buildDrawer();initialMessage();setInterval(()=>offerProactive(false),5000);
}
function buildDrawer(){
  const p=$('#pipeline');p.innerHTML='';
  STRUCTURE.components.forEach((c,i)=>{const el=document.createElement('button');el.className='pipe-node';el.dataset.id=c.id;el.innerHTML=`<div class="pmeta"><span>${String(i+1).padStart(2,'0')} · ${esc(c.file)}</span><span>${esc(c.cadence)}</span></div><b>${esc(c.label)}</b><p>${esc(c.does)}</p>`;el.onclick=()=>{$$('.pipe-node').forEach(x=>x.classList.remove('active'));el.classList.add('active');$('#pipelineNote').textContent=`${c.file} :: ${c.functions.join(' / ')} — ${c.does}`};p.appendChild(el)});
  const r=STRUCTURE.actualRecheck;$('#recheckGrid').innerHTML=[['admin server',r.adminServerStarted],['shadow spawned',r.shadowWorkerSpawned],['generation',`G${r.generationObservedBefore}→G${r.generationObservedAfter}`],['dialogue',r.nativeDialogueAnswered],['external model',r.externalModelUsed],['isolated copy',r.isolatedCopy]].map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(String(v))}</b></div>`).join('');
  $('#limitations').innerHTML=STRUCTURE.limitations.map(x=>`<div class="limit-item">${esc(x)}</div>`).join('');
}
async function playLoop(){const nodes=$$('.pipe-node');for(const n of nodes){n.classList.add('active');n.scrollIntoView({block:'nearest',behavior:'smooth'});$('#pipelineNote').textContent=n.querySelector('p').textContent;await sleep(430);n.classList.remove('active')}$('#pipelineNote').textContent='一周完了。実機ではこの流れがNode/Pythonの常駐プロセスとして自動で回ります。'}
function openDrawer(){document.body.style.overflow='hidden';$('#drawer').classList.add('open');$('#drawerMask').classList.add('show');$('#drawer').setAttribute('aria-hidden','false')}
function closeDrawer(){document.body.style.overflow='';$('#drawer').classList.remove('open');$('#drawerMask').classList.remove('show');$('#drawer').setAttribute('aria-hidden','true')}
$('#send').onclick=()=>ask($('#chatInput').value);$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(e.currentTarget.value)}});$$('[data-q]').forEach(b=>b.onclick=()=>ask(b.dataset.q));$('#forceProactive').onclick=()=>offerProactive(true);$('#openStructure').onclick=openDrawer;$('#closeStructure').onclick=closeDrawer;$('#drawerMask').onclick=closeDrawer;$('#playLoop').onclick=playLoop;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
load().catch(e=>{console.error(e);$('#runtimeState').textContent='load error';msg('fairy','公開デモのデータ読込に失敗しました。'+e.message,{badges:[{kind:'demo',text:'ERROR'}]})});
