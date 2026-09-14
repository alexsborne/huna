/* ===== dados e constantes ===== */
const DATA = __DATA__;
const CATMAP = __CATMAP__;
const LOGO = "__LOGO__";
const PANEL="__PANEL__"; /* 'pasta' | 'completo' — substituído no rebuild */
const ETAPAS_PASTA=["Cadastro Cliente","Pasta em Anállise","Pasta com Pendência","Pasta Validada pendente de Pix","Pasta Aprovada com Pix"];
const ETAPAS_ALERTA=["Cadastro Cliente","Pasta em Anállise","Pasta com Pendência"];
const PGTO=["PIX","FALTA PIX","Venda à vista","Até 24x","Até 48x","Plano longo","BOLETO NEXO"];
const PLANOTAGS=["Venda à vista","Até 24x","Até 48x","Plano longo"];
const ORD=["#86b6ef","#5598e7","#2a78d6","#1c5cab","#104281"];
const SER=["#2a78d6","#eb6834","#1baf7a","#eda100","#e87ba4","#008300","#4a3aa7","#e34948"];
const CATCOLOR={"PAGAMENTO":"#2a78d6","CONTRATO":"#eb6834","TEMPERATURA":"#1baf7a","CANAL/PARCEIRO":"#eda100","CAMPANHA":"#e87ba4","RELACIONAMENTO":"#008300","OUTROS":"#4a3aa7"};
const FAIXAS=["0 / não informado","até R$ 3 mil","R$ 3–5 mil","R$ 5–8 mil","R$ 8–12 mil","R$ 12–20 mil","acima de R$ 20 mil"];
const HOJE="__EXTRACAO__";

/* ===== temas ===== */
const THEMES=[
  {id:'nexo',label:'Nexo (padrão)'},
  {id:'midnight',label:'Meia-Noite'},
  {id:'abissal',label:'Abissal'},
  {id:'bordo',label:'Bordô'},
  {id:'terracota',label:'Terracota'}
];
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
(function initTheme(){
  let saved='nexo';
  try{ saved=localStorage.getItem('nexoTema')||'nexo'; }catch(e){}
  if(!THEMES.some(t=>t.id===saved)) saved='nexo';
  if(saved!=='nexo') document.documentElement.dataset.theme=saved;
})();
let INK=cssVar('--ink')||"#141414", INK2=cssVar('--ink-2')||"#4a4a52", LINE=cssVar('--line')||"#e3e5ec", NAVY=cssVar('--navy')||"#1F2A66";
function applyTheme(id){
  if(!THEMES.some(t=>t.id===id)) id='nexo';
  document.documentElement.dataset.theme=id;
  try{ localStorage.setItem('nexoTema',id); }catch(e){}
  INK=cssVar('--ink'); INK2=cssVar('--ink-2'); LINE=cssVar('--line'); NAVY=cssVar('--navy');
  if(typeof gx!=='undefined') gx.grid.color=LINE;
  if(typeof Chart!=='undefined'){
    Chart.defaults.color=INK2;
    Chart.defaults.plugins.tooltip.backgroundColor=cssVar('--navy-d');
  }
  if(typeof paint==='function') paint();
}

const GRUPOS_LANCADORA=[
  {label:'HUNA',     re:/^HUNA(\s|$)/},
  {label:'Lopes',    re:/^LOPES(\s|$)/},
  {label:'URBS',     re:/^URBS(\s|$)/},
  {label:'AEVO',     re:/^AEVO(\s|$)/},
  {label:'Adão',     re:/^ADAO(\s|$)/},
  {label:'MyBroker', re:/^MY\s+BROKER(\s|$)/}
];
const normMarca=s=>String(s||'').toUpperCase().normalize('NFD').replace(/[^\x00-\x7F]/g,'');
function grupoLancadora(raw){
  const n=normMarca(raw);
  const g=GRUPOS_LANCADORA.find(g=>g.re.test(n));
  return g? g.label : 'Mercado';
}
DATA.forEach(r=>{
  const raw=(r.equipe||'').split(/\s*-\s*/)[0].trim() || '(sem equipe)';
  r.marca = grupoLancadora(raw);
  /* tipo_imob: só 2 valores, é o que o filtro "Imobiliária" do topo usa (04/09/2026).
     `marca` (7 grupos finos) continua existindo pra gráficos/hierarquia que precisam do nome específico. */
  r.tipo_imob = r.marca==='Mercado' ? 'Mercado' : 'Lançadora';
});
function orderedEtapas(){
  const seen=new Set(DATA.map(r=>r.etapa).filter(e=>e && e!=='Desistente'));
  const pasta=ETAPAS_PASTA.filter(e=>seen.has(e));
  const rest=[...seen].filter(e=>!ETAPAS_PASTA.includes(e)).sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
  return pasta.concat(rest);
}
const ETAPAS=PANEL==='completo'?orderedEtapas():ETAPAS_PASTA;
const corEtapa=i=>ORD[i]||SER[i%SER.length];
const nf=n=>Number(n).toLocaleString('pt-BR');
const money=n=>n==null?'—':'R$ '+Number(n).toLocaleString('pt-BR',{maximumFractionDigits:0});
const pct=(a,b)=>b?(100*a/b).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'—';
const cat=t=>CATMAP[t]||'OUTROS';
const faixa=v=>(v==null||v===0)?FAIXAS[0]:v<=3000?FAIXAS[1]:v<=5000?FAIXAS[2]:v<=8000?FAIXAS[3]:v<=12000?FAIXAS[4]:v<=20000?FAIXAS[5]:FAIXAS[6];
const has=(r,t)=>r.tags_list.includes(t);
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const uniq=k=>[...new Set(DATA.map(r=>r[k]).filter(v=>v!==''&&v!=null))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
const ALLTAGS=(()=>{const c={};DATA.forEach(r=>r.tags_list.forEach(t=>c[t]=(c[t]||0)+1));
  return Object.keys(c).sort((a,b)=>c[b]-c[a]||a.localeCompare(b,'pt-BR'));})();
const ALLCATS=[...new Set(ALLTAGS.map(cat))];
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const gerLabel=e=>{const parts=e.split(/\s*-\s*/); return parts.length>1?parts.slice(1).join(' - ').trim():e;};

const CAMPOS_COMERCIAIS=[
  {k:'finalidade',    l:'finalidade declarada',      ok:r=>!!r.finalidade && r.finalidade!=='-'},
  {k:'valor_negocio', l:'valor de venda informado',  ok:r=>!!r.valor_negocio},
  {k:'plano_tag',     l:'tag de plano de pagamento', ok:r=>PLANOTAGS.some(t=>has(r,t))},
  {k:'pix_tag',       l:'tag de Pix',                ok:r=>has(r,'PIX')}
];
const fichaComercialCompleta=r=>CAMPOS_COMERCIAIS.every(c=>c.ok(r));
const estagnado=r=>(r.dias_cadastro||0)>=14 && r.etapa!=='Pasta Aprovada com Pix' && r.etapa!=='Desistente' && r.etapa!=='Descarte';

/* Desistentes existem nos dados mas não entram no "cálculo de leads" do painel (04/09/2026, a
   pedido do usuário — escopo D1: painel inteiro) — ver rowsFor() abaixo, que já os exclui por
   padrão. LEADS_TOTAL é a base "ativa" (sem desistentes) usada como denominador de % em vez de
   DATA.length nos lugares que representam leads no funil — o selo do cabeçalho (`bTot`) e o
   rodapé de metodologia continuam com DATA.length de propósito (são contagem bruta da extração,
   não "cálculo de leads"). */
const isDesistente=r=>r.etapa==='Desistente';
const LEADS_TOTAL=DATA.filter(r=>!isDesistente(r)).length;

/* ===== previsão de venda x execução (09/09/2026) =====
   Tabela de metas colada pelo usuário (imobiliária/equipe/gerente + previsão), sem período — o usuário
   confirmou que é a meta ACUMULADA do funil inteiro (não mensal), e que "execução" é o total de
   cadastros em qualquer etapa (não só "Pasta Aprovada com Pix"). Por isso esta aba usa `DATA` direto,
   não `rowsFor()` — comparar um recorte filtrado do topo com uma meta que é sempre do funil inteiro
   daria uma leitura errada. `keys` localiza a equipe real dentro do campo `equipe` (texto antes do "-",
   igual `marca`/`t3Parts`): lista de palavras-chave pra igualar por "contém"; array vazio = time "geral"
   (equipe = só o nome da imobiliária, sem sufixo, ex. "ADÃO X"); `null` = meta é da imobiliária inteira
   (MyBroker, HUNA), sem quebra por equipe na planilha original. */
const METAS=[
  {imob:'Adão',    equipe:'Matriz',    gerente:'Matheus Ferrari',  meta:20, keys:['MATRIZ']},
  {imob:'Adão',    equipe:'Action',    gerente:'Guttyane',         meta:5,  keys:['ACTION']},
  {imob:'Adão',    equipe:'Prosper',   gerente:'Kenjy / Sandro',   meta:12, keys:['PROSPER']},
  {imob:'Adão',    equipe:'Vida Nova', gerente:'Tristão / Wesley', meta:8,  keys:['VIDA NOVA']},
  {imob:'Adão',    equipe:'Solo',      gerente:'Nayane',           meta:5,  keys:['SOLO']},
  {imob:'Adão',    equipe:'Mais',      gerente:'Grazi',            meta:0,  keys:['MAIS']},
  {imob:'Adão',    equipe:'Virto',     gerente:'Adriano',          meta:0,  keys:['VIRTO']},
  {imob:'Adão',    equipe:'Una',       gerente:'Ekika / Larissa',  meta:10, keys:['UNA']},
  {imob:'Adão',    equipe:'X',         gerente:'',                 meta:0,  keys:['X']},
  {imob:'URBS',    equipe:'Connect',   gerente:'Abdala',           meta:5,  keys:['CONNECT']},
  {imob:'URBS',    equipe:'Seven',     gerente:'Nayane',           meta:10, keys:['SEVEN']},
  {imob:'URBS',    equipe:'Meu Apê',   gerente:'Weber',            meta:5,  keys:['MEU AP']},
  {imob:'URBS',    equipe:'One',       gerente:'Flávio',           meta:5,  keys:['ONE']},
  {imob:'URBS',    equipe:'Infinity',  gerente:'Saulo',            meta:5,  keys:['INFINITY']},
  {imob:'Lopes',   equipe:'Marista',   gerente:'',                 meta:10, keys:['MARISTA']},
  {imob:'Lopes',   equipe:'Jd Goiás',  gerente:'',                 meta:10, keys:['JARDIM GOIAS','JD GOIAS']},
  {imob:'Lopes',   equipe:'Oeste',     gerente:'',                 meta:10, keys:['OESTE']},
  {imob:'Lopes',   equipe:'Geral',     gerente:'',                 meta:10, keys:[]},
  {imob:'AEVO',    equipe:'Marista',   gerente:'',                 meta:70, keys:['MARISTA']},
  {imob:'AEVO',    equipe:'Jd Goiás',  gerente:'',                 meta:70, keys:['JARDIM GOIAS','JD GOIAS']},
  {imob:'AEVO',    equipe:'Bueno',     gerente:'',                 meta:70, keys:['BUENO']},
  {imob:'AEVO',    equipe:'Geral',     gerente:'',                 meta:70, keys:[]},
  {imob:'MyBroker',equipe:'',          gerente:'',                 meta:20, keys:null},
  {imob:'HUNA',    equipe:'',          gerente:'',                 meta:40, keys:null}
];
const metaTeamPart=equipe=>normMarca((equipe||'').split(/\s*-\s*/)[0]).trim();
function metaRest(imob,tp){ const pre=normMarca(imob); return tp.indexOf(pre)===0 ? tp.slice(pre.length).trim() : tp; }
function metaMatches(m,equipe){
  if(m.keys===null) return true;
  const rest=metaRest(m.imob,metaTeamPart(equipe));
  return m.keys.length ? m.keys.some(k=>rest.includes(normMarca(k))) : rest==='';
}
/* No painel completo a meta continua sendo do Funil de Pasta — misturar Venda inflaria a execução.
   Exclui Desistente pelo mesmo motivo de LEADS_TOTAL/rowsFor() acima: sem isso, o total desta aba
   (METABASE.length) ficava maior que o de "Visão Geral" (LEADS_TOTAL), dois números de "total de
   cadastros" que deveriam bater e não batiam (corrigido 13/09/2026, a pedido do usuário). */
const METABASE=(PANEL==='completo'?DATA.filter(r=>(r.funil||'')==='Funil de Pasta'):DATA).filter(r=>!isDesistente(r));
const METAEXEC=METAS.map(m=>Object.assign({},m,{exec:METABASE.filter(r=>r.marca===m.imob&&metaMatches(m,r.equipe)).length}));
const METAIMOBS=[...new Set(METAS.map(m=>m.imob))].map(imob=>({imob,
  meta:METAS.filter(m=>m.imob===imob).reduce((a,m)=>a+m.meta,0),
  exec:METABASE.filter(r=>r.marca===imob).length}));
/* equipes com cadastros reais mas sem nenhuma linha de meta correspondente (ex.: "ADAO UNIQUE",
   "AEVO 3"/"AEVO 4" — existem no CRM, não apareceram na planilha de previsão) */
const METAUNMAPPED=(()=>{
  const comEquipe=METAS.filter(m=>m.keys!==null);
  const imobs=[...new Set(comEquipe.map(m=>m.imob))];
  const out=[];
  imobs.forEach(imob=>{
    const porEquipe={};
    METABASE.filter(r=>r.marca===imob).forEach(r=>{
      const nomeada=comEquipe.some(m=>m.imob===imob&&m.keys.length&&metaMatches(m,r.equipe));
      if(!nomeada) (porEquipe[r.equipe||'(sem equipe)']=porEquipe[r.equipe||'(sem equipe)']||[]).push(r);
    });
    Object.keys(porEquipe).forEach(eq=>out.push({imob,equipe:eq,n:porEquipe[eq].length}));
  });
  return out.sort((a,b)=>b.n-a.n);
})();
const META_MERCADO_N=METABASE.filter(r=>r.marca==='Mercado').length;
const METATOTAL=METAS.reduce((a,m)=>a+m.meta,0);
const METAEXECTOTAL=METAEXEC.reduce((a,m)=>a+m.exec,0);
const METAFORA=META_MERCADO_N+METAUNMAPPED.reduce((a,u)=>a+u.n,0);

/* ===== previsão de vendas por imobiliária — Lançadoras + Mercado (planilha SIENA, 11/09/2026) =====
   Diferente de METAS acima (meta por EQUIPE dentro das 6 lançadoras, planilha de 09/09/2026), esta
   nova planilha traz a expectativa por IMOBILIÁRIA: as mesmas 6 lançadoras (agrupamento de `marca`)
   + ~29 imobiliárias do "Mercado" cada uma com sua própria meta — a aba antiga lumpava todo o
   Mercado num só número. É um baseline diferente do de METAS (ex.: Lopes caiu de 40 pra 10, HUNA
   subiu de 40 pra 45). Desde 11/09/2026 esta é a única aba "Previsão x Execução" na navegação — a
   antiga (METAS acima, por equipe) foi desativada (fora de TABS, código intacto e reversível), mas
   os dados de METAS continuam vivos abaixo pra não perder a lógica caso o usuário peça de volta.
   `keys`=null → uma das 6 lançadoras, casa direto por `marca`. `keys` com lista → imobiliária do
   Mercado, casada pelo prefixo bruto de `equipe` (antes do "-"): nomes variam entre planilha e CRM
   (ex. "DATA NEGOCIOS" no CRM = "DATA IMOVEIS" na planilha), por isso usa contém-palavra-chave, uma
   por uma conferida contra os prefixos de Mercado que de fato existem nos dados (11/09/2026). */
const SIENA2=[
  {imob:'AEVO',     meta:70, keys:null},
  {imob:'Adão',     meta:60, keys:null},
  {imob:'MyBroker', meta:20, keys:null},
  {imob:'HUNA',     meta:45, keys:null},
  {imob:'URBS',     meta:30, keys:null},
  {imob:'Lopes',    meta:10, keys:null},
  {imob:'Mikasa',          meta:15, keys:['MIKASA']},
  {imob:'Data Imóveis',    meta:5,  keys:['DATA']},
  {imob:'Hopp',            meta:20, keys:['HOPP']},
  {imob:'Argon',           meta:10, keys:['ARGON']},
  {imob:'Kadosh',          meta:8,  keys:['KADOSH']},
  {imob:'Provenda',        meta:15, keys:['PROVENDA']},
  {imob:'Nex Imóveis',     meta:8,  keys:['NEX ']},
  {imob:'Alitz',           meta:2,  keys:['ALITZ']},
  {imob:'Veld Imobiliária',meta:3,  keys:['VELD']},
  {imob:'RCF',             meta:5,  keys:['RCF']},
  {imob:'41 Business',     meta:5,  keys:['41 BUSINES']},
  {imob:'Inovart',         meta:5,  keys:['INOVART']},
  {imob:'Sharks',          meta:10, keys:['SHARKS']},
  {imob:'AJ Imóveis',      meta:1,  keys:['AJ IMO']},
  {imob:'Paraíso Imóveis', meta:1,  keys:['PARAISO']},
  {imob:'W',               meta:1,  keys:['W N NEGOCIOS']},
  {imob:'One Percent Prime',meta:1, keys:['ONE PERCENT']},
  {imob:'Villa Bamboo',    meta:20, keys:['VILLA BAMB']},
  {imob:'Neri e Cabral',   meta:5,  keys:['NERI']},
  {imob:'VW Imóveis',      meta:10, keys:['VW ']},
  {imob:'Alfa Center',     meta:5,  keys:['ALFA']},
  {imob:'Morar Mais',      meta:5,  keys:['MORAR']},
  {imob:'Rosa',            meta:10, keys:['ROSA']},
  {imob:'Alpha Soluções',  meta:10, keys:['ALPHA']},
  {imob:'Amiz',            meta:10, keys:['AMIZ']},
  {imob:'Casa 41',         meta:5,  keys:['CASA 41']},
  {imob:'Lago Premium',    meta:5,  keys:['LAGO']},
  {imob:'Melhor Imóveis',  meta:5,  keys:['MELHOR']},
  {imob:'Portfólio',       meta:5,  keys:['PORTFOLIO']}
];
function siena2MatchMercado(r){
  const raw=normMarca((r.equipe||'').split(/\s*-\s*/)[0]);
  const hit=SIENA2.find(s=>s.keys && s.keys.some(k=>raw.includes(normMarca(k))));
  return hit?hit.imob:null;
}
const SIENA2EXEC=SIENA2.map(s=>Object.assign({},s,{exec:
  s.keys===null ? METABASE.filter(r=>r.marca===s.imob).length
                : METABASE.filter(r=>r.marca==='Mercado'&&siena2MatchMercado(r)===s.imob).length}));
/* equipes do Mercado com cadastro real mas sem imobiliária correspondente na planilha SIENA */
const SIENA2UNMAPPED=(()=>{
  const by={};
  METABASE.filter(r=>r.marca==='Mercado'&&!siena2MatchMercado(r)).forEach(r=>{
    const k=(r.equipe||'').split(/\s*-\s*/)[0].trim()||'(sem equipe)';
    (by[k]=by[k]||[]).push(r);
  });
  return Object.keys(by).map(k=>({equipe:k,n:by[k].length})).sort((a,b)=>b.n-a.n);
})();
const SIENA2TOTAL=SIENA2.reduce((a,s)=>a+s.meta,0);
const SIENA2EXECTOTAL=SIENA2EXEC.reduce((a,s)=>a+s.exec,0);
const SIENA2FORA=SIENA2UNMAPPED.reduce((a,u)=>a+u.n,0);

/* ===== estado ===== */
const DIMS=(PANEL==='completo'?['funil']:[]).concat(['etapa','marca','tipo_imob','equipe','responsavel','origem','plano_pagamento','mes','tag','categoria','faixa','data']);
const DIMLABEL={funil:'Funil',etapa:'Etapa',marca:'Lançadora',tipo_imob:'Imobiliária',equipe:'Equipe',responsavel:'Responsável',origem:'Origem',
  plano_pagamento:'Plano',mes:'Mês',tag:'Tag',categoria:'Categoria',faixa:'Faixa de renda',data:'Dia'};
let ST={}; DIMS.forEach(d=>ST[d]=[]); ST.tagMode='or';
const HIST=[];
const snap=()=>JSON.parse(JSON.stringify(ST));
const pushHist=()=>{HIST.push(snap()); if(HIST.length>60)HIST.shift();};

function matchDim(r,d,v){
  if(!v.length) return true;
  if(d==='tag') return ST.tagMode==='and'? v.every(t=>has(r,t)) : v.some(t=>has(r,t));
  if(d==='categoria') return v.some(c=>r.tags_list.some(t=>cat(t)===c));
  if(d==='faixa') return v.includes(faixa(r.valor_renda));
  return v.includes(r[d]||'');
}
function rowsFor(except){
  const ex = except? (Array.isArray(except)?except:[except]) : [];
  return DATA.filter(r=>{
    if(ST.tagMode==='none' && !ex.includes('tag') && r.tags_list.length) return false;
    /* Desistentes fora do cálculo de leads em todo o painel, exceto quando o próprio usuário
       filtra explicitamente pela etapa Desistente (aí o recorte pode ser só eles) — ver LEADS_TOTAL. */
    if(isDesistente(r) && !ex.includes('etapa') && !ST.etapa.includes('Desistente')) return false;
    return DIMS.every(d=> ex.includes(d) || matchDim(r,d,ST[d]));
  });
}
const activeCount=()=>DIMS.reduce((a,d)=>a+ST[d].length,0)+(ST.tagMode==='none'?1:0);

function setDim(d,vals){ pushHist(); ST[d]=vals; apply(); }
function toggle(d,val,additive){
  pushHist();
  const cur=ST[d];
  if(additive){ const i=cur.indexOf(val); i>=0?cur.splice(i,1):cur.push(val); }
  else { ST[d] = (cur.length===1 && cur[0]===val) ? [] : [val]; }
  apply();
}
function clearAll(){ pushHist(); DIMS.forEach(d=>ST[d]=[]); ST.tagMode='or';
  const q=document.getElementById('q'); if(q)q.value=''; apply(); }
function undo(){ if(HIST.length){ ST=HIST.pop(); apply(true); } }

/* ===== url hash ===== */
let TAB='visao';
let GER=null;
function writeHash(){
  const p=new URLSearchParams(); p.set('t',TAB);
  DIMS.forEach(d=>{ if(ST[d].length) p.set(d, ST[d].join('~')); });
  if(ST.tagMode!=='or') p.set('m',ST.tagMode);
  history.replaceState(null,'','#'+p.toString());
}
function readHash(){
  const p=new URLSearchParams(location.hash.slice(1));
  if(p.get('t')) TAB=p.get('t');
  if(!TABS.some(([k])=>k===TAB)) TAB='visao';
  DIMS.forEach(d=>{ if(p.get(d)) ST[d]=p.get(d).split('~'); });
  if(p.get('m')) ST.tagMode=p.get('m');
}
