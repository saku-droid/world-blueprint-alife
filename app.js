const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];
let FACTS = null;
let demoGeneration = null;
const nodeInfo = {
  'CHAT':'会話を観測要求に変える入口。想定UIではここから問いを分類する。',
  'REPOSITORY':'設計書・コード・ログから根拠を取り出す層。公開デモでは verified-facts.json を参照。',
  'CONTEXT':'観測事実、履歴、権限境界をまとめてLLMへ渡す想定層。',
  '統合人格':'個体の境界。personaId / values / continuity を統合しつつ、memory・rules・genome・authority・clockは分離。',
  'SHADOW':'現実を忠実に模写して試す bounded-and-reversible の実験領域。',
  'WORLDLINE':'反実仮想を走らせ、考えを更新するための内的世界。最新記録は6分岐。',
  'VERIFY':'passed / rejected / unavailable を分離して、検査不能を成功扱いしない門番。',
  'REALITY GATE':'production change は separate-human-approval-required。公開デモでは書込みなし。',
  'ALife':'適応・淘汰・継承を世代で回す実験基盤。答えではなく探し方を継承させる方向。'
};

async function loadFacts(){
  FACTS = await fetch('./data/verified-facts.json',{cache:'no-store'}).then(r=>r.json());
  const s = FACTS.snapshot, g=s.latestGenerationRecord, wl=s.worldlineLatest;
  $('#runtimeState').textContent = s.statusState || 'SNAPSHOT';
  $('#runtimeGeneration').textContent = 'G'+s.generationEnd;
  $('#snapGen').textContent = 'G'+s.generationEnd;
  $('#snapPop').textContent = s.population;
  $('#snapInh').textContent = s.inheritanceEvents;
  $('#snapWrite').textContent = String(wl.productionAuthorized).toUpperCase();
  $('#worldlineSummary').textContent = `${wl.branches} branches / broken ${wl.outcomes['broken-contained']} / runaway ${wl.outcomes['runaway-contained']}`;
  $('#authoritySummary').textContent = `production=${s.persona.authorityContract.productionChange}`;
  $('#evoGen').textContent = 'G'+g.generation;
  $('#evoLearn').textContent = g.learningScore.toFixed(3);
  $('#evoNovelty').textContent = g.novelty;
  $('#evoGenomes').textContent = g.genomes;
  demoGeneration = s.generationEnd;
  $('#demoGeneration').textContent='G'+demoGeneration;
  buildBars(); buildEvidence();
}

function buildBars(){
  const box=$('#bars'); box.innerHTML='';
  FACTS.snapshot.generationSeries.forEach(g=>{
    const b=document.createElement('div'); b.className='bar';
    b.style.height=(40+g.learningScore*350)+'px';
    b.dataset.tip=`G${g.generation} learn ${g.learningScore.toFixed(3)} bred ${g.bred}`;
    box.appendChild(b);
  });
}
function buildEvidence(){
  $('#evidenceList').innerHTML = FACTS.sources.map((s,i)=>`<div class="evidence-item"><b>SOURCE ${String(i+1).padStart(2,'0')}</b><span>${escapeHtml(s)}</span></div>`).join('');
}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function addUser(text){
  $('#messages').insertAdjacentHTML('beforeend',`<article class="bubble user"><div class="avatar">U</div><div class="bubble-body"><div class="bubble-meta"><b>あなた</b></div><p>${escapeHtml(text)}</p></div></article>`);
}
function addRepo(html){
  $('#messages').insertAdjacentHTML('beforeend',`<article class="bubble repository"><div class="avatar">R</div><div class="bubble-body">${html}</div></article>`);
  $('#messages').scrollTop=$('#messages').scrollHeight;
}
function factBlock(title,body){return `<div class="answer-block"><h4><span class="label fact">実測</span>${title}</h4>${body}</div>`}
function proposalBlock(title,body,actions=''){return `<div class="answer-block"><h4><span class="label proposal">想定・提案</span>${title}</h4>${body}${actions}</div>`}
function meta(){return `<div class="bubble-meta"><b>アプリ保管庫</b><span class="label assumption">想定応答</span></div>`}

function answerFor(q){
  if(!FACTS) return meta()+`<p>スナップショットを読み込み中です。</p>`;
  const s=FACTS.snapshot,g=s.latestGenerationRecord,wl=s.worldlineLatest,p=s.persona;
  const t=q.toLowerCase();
  if(t.includes('分割')){
    return meta()+`<p>分割したい場所を、まず責務で切ります。これはまだ実装変更ではなく、想定プランです。</p>`+
      proposalBlock('分割プラン',`<ul><li>入力・会話層</li><li>根拠取得 / Repository Resolver</li><li>検証 / Gate</li><li>ALife / Worldline 実験層</li></ul>`,`<div class="action-row"><button data-demo-action="shadow">影で試す（想定）</button><button data-demo-action="diff">差分を見る</button><button data-demo-action="skip">今回は見送る</button></div>`)+
      factBlock('現在の境界',`<p>production change は <b>${escapeHtml(p.authorityContract.productionChange)}</b>。公開デモに本番書込み機能はありません。</p>`);
  }
  if(t.includes('改善') || t.includes('1番') || t.includes('一番')){
    return meta()+`<p>観測値から見ると、まず注目したいのは「世代は回っているが、新規性が長く低い」点です。</p>`+
      factBlock('観測上のボトルネック',`<p>latest novelty=${g.novelty}、lowNoveltyStreak=${g.lowNoveltyStreak}。世代数そのものより、探索の質を見直す余地があります。</p>`)+
      proposalBlock('改善候補',`<ul><li>低noveltyが続いた時だけ探索戦略を切替える</li><li>selectionPolicyScoreとlearningScoreの乖離を監視する</li><li>再シード条件を明示的に検証する</li></ul>`);
  }
  if(t.includes('自律') || t.includes('育った')){
    return meta()+`<p>「完全自律」とは言いません。現在は、世代交代・選択・継承・影実験の境界が実装され、記録を残しながら回る実験基盤の段階です。</p>`+
      factBlock('現在確認できる範囲',`<ul><li>generation ${s.generationStart} → ${s.generationEnd}</li><li>population ${s.population}</li><li>inheritance events ${s.inheritanceEvents}</li><li>latest genomes ${g.genomes}</li><li>latest bred ${g.bred}</li></ul>`)+
      factBlock('世界線',`<p>${wl.branches}分岐中、broken-contained ${wl.outcomes['broken-contained']}、runaway-contained ${wl.outcomes['runaway-contained']}。productionAuthorized=${wl.productionAuthorized}。</p>`);
  }
  if(t.includes('セキュリティ') || t.includes('security')){
    return meta()+`<p>現在の境界を保ったまま、さらに強くできる余地があります。</p>`+
      factBlock('現在の実装・契約',`<ul><li>surface=${escapeHtml(p.authorityContract.surfaceObservation)}</li><li>shadow=${escapeHtml(p.authorityContract.shadowExperiment)}</li><li>fieldTrial=${escapeHtml(p.authorityContract.fieldTrial)}</li><li>production=${escapeHtml(p.authorityContract.productionChange)}</li></ul>`)+
      proposalBlock('次のセキュリティ候補',`<ul><li>承認履歴を別台帳へ分離</li><li>実験権限の一時トークン化</li><li>worldline→production の逆流検出テストをCI化</li><li>署名器unavailableを通常失敗と混ぜない検査</li></ul>`);
  }
  if(t.includes('技術進捗') || t.includes('進捗')){
    return meta()+`<p>技術進捗としては、ALifeの適応・淘汰・継承と、LLMの推論を役割分離して扱う実験を進めています。</p>`+
      factBlock('実験で確認できるもの',`<p>世界線は ${wl.branches} 分岐を記録し、authorityTransferred=${wl.authorityTransferred}、productionAuthorized=${wl.productionAuthorized}。passed / rejected / unavailable を分離する壁も定義されています。</p>`)+
      proposalBlock('研究としての狙い',`<p>LLMが誤る可能性をゼロと仮定せず、誤った推論をそのまま事実や現実書込みへ昇格させない構造を、ALifeと検証層の両方で試す方向です。</p>`);
  }
  return meta()+`<p>その問いは、保管庫の実ファイルを検索してから答える想定です。今のデモでは、以下の実測スナップショットを返します。</p>`+factBlock('snapshot',`<p>G${s.generationEnd} / population ${s.population} / inheritance ${s.inheritanceEvents} / productionAuthorized ${wl.productionAuthorized}</p>`)+proposalBlock('次にできること',`<p>「改善」「セキュリティ」「自律」「技術進捗」「分割」のどれかを含めると、想定回答を切り替えます。</p>`);
}
function ask(q){
  q=q.trim(); if(!q)return; addUser(q); $('#chatInput').value='';
  setTimeout(()=>{addRepo(answerFor(q)); bindDemoActions();},180);
}
$('#sendBtn').onclick=()=>ask($('#chatInput').value);
$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(e.currentTarget.value)}});
$$('#promptRow button').forEach(b=>b.onclick=()=>ask(b.dataset.prompt));
function bindDemoActions(){
  $$('[data-demo-action]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.demoAction;
    const text=a==='shadow'?'影の実験室へ送る想定フローを開始しました。本番変更はしません。':a==='diff'?'差分ビューを開く想定です。現段階ではコード変更は行いません。':'提案を見送りました。想定デモ上の操作です。';
    addRepo(meta()+proposalBlock('ACTION DEMO',`<p>${text}</p>`));
  });
}

$$('.tabs button').forEach(b=>b.onclick=()=>{
  $$('.tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active')); $('#'+b.dataset.view).classList.add('active');
});

$$('#sliceStack button').forEach(b=>b.onclick=()=>{
  $$('#sliceStack button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $('#sliceTitle').textContent=b.dataset.node; $('#sliceText').textContent=nodeInfo[b.dataset.node]||'—';
});
$('#pulseSlice').onclick=async()=>{
  const nodes=$$('#sliceStack button');
  for(const n of nodes){n.classList.add('active'); await new Promise(r=>setTimeout(r,180)); n.classList.remove('active')}
};
$$('.w-node').forEach(b=>b.onclick=()=>{$$('.w-node').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#wiringCaption').textContent=`${b.dataset.node} — ${nodeInfo[b.dataset.node]||'—'}`});

$('#advanceGeneration').onclick=()=>{
  if(!FACTS)return;
  demoGeneration += 1;
  const patterns=[
    ['shadow-experiment','proposal generated / production write blocked'],
    ['selection','parent pool changed / no production authority'],
    ['worldline','counterfactual replay / result contained'],
    ['inheritance','search strategy inherited / local rule not promoted']
  ];
  const p=patterns[demoGeneration%patterns.length];
  $('#demoGeneration').textContent='G'+demoGeneration; $('#demoOutcome').textContent=p[0];
  $('#demoLog').insertAdjacentHTML('afterbegin',`<div>G${demoGeneration} :: ${p[1]} <span class="label assumption">DEMO</span></div>`);
};

loadFacts().catch(err=>{console.error(err);$('#runtimeState').textContent='FACT ERROR';});
