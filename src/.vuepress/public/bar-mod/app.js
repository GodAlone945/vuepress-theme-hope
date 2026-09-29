(()=>{"use strict";
const D=window.BAR_TOOL_DATA||{raptors:[],scavs:[],behaviors:[],raptorParams:[],scavParams:[]};
const $=id=>document.getElementById(id);
const qa=s=>[...document.querySelectorAll(s)];
const num=(id,d)=>{const v=Number($(id)?.value);return Number.isFinite(v)?v:d};
const esc=s=>String(s??"").replace(/\\/g,"\\\\").replace(/"/g,'\\"');

function slotKey(slot){const n=Number(slot)||0;return "tweakdefs"+(n===0?"":n)}
function fillSlots(el){if(!el)return;el.innerHTML="";for(let i=0;i<=29;i++){const o=document.createElement("option");o.value=i;o.textContent=i===0?"tweakdefs":"tweakdefs"+i;el.appendChild(o)}}
["configSlot","b64Slot","editorSlot"].forEach(id=>fillSlots($(id)));

function encode64(text){
  const bytes=new TextEncoder().encode(text);let bin="";
  const size=0x8000;
  for(let i=0;i<bytes.length;i+=size)bin+=String.fromCharCode(...bytes.subarray(i,i+size));
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function decode64(input){
  let s=String(input||"").trim();
  const m=s.match(/^!bset\s+tweakdefs\d*\s+(.+)$/i);if(m)s=m[1].trim();
  s=s.replace(/-/g,"+").replace(/_/g,"/");
  s+="=".repeat((4-s.length%4)%4);
  const bin=atob(s),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
async function copyText(text,btn){
  try{await navigator.clipboard.writeText(text);if(btn){const old=btn.textContent;btn.textContent="已复制";setTimeout(()=>btn.textContent=old,1100)}}catch(e){alert("复制失败，请手动复制。")}
}
function switchTab(id){
  qa(".tab[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  qa(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
qa(".tab[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));

const CONFIG_IDS=["elite","roles","colossus","egg","intercept","boss","hp","damage","capn","roleCount","chance","roleWeight","giantHp","giantCap","eggMult","aggroDist","aggroChance","queenHp","stagger","staggerCost"];
const BOOL_IDS=new Set(["elite","roles","colossus","egg","intercept","boss"]);
function getConfig(){
  const s={};
  for(const id of CONFIG_IDS){const e=$(id);s[id]=BOOL_IDS.has(id)?e.checked:Number(e.value)}
  return s;
}
function setConfig(s){
  for(const id of CONFIG_IDS){if(s[id]===undefined)continue;const e=$(id);if(BOOL_IDS.has(id))e.checked=!!s[id];else e.value=s[id]}
  renderConfig();
}
const BUILTIN={
  balanced:{title:"低单位防线",desc:"精英化 + 职业 + 巨兽 + Queen 分工，优先降低后期场上单位数。",tags:["推荐","PVE","低单位"],state:{elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.8,damage:1.35,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  elite:{title:"精英虫群",desc:"更少、更硬、更危险的普通虫；避免简单把伤害与血量同比例放大。",tags:["精英","低人口"],state:{elite:true,roles:true,colossus:false,egg:false,intercept:false,boss:true,hp:2.5,damage:1.55,capn:12,roleCount:3,chance:.7,roleWeight:3,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  colossus:{title:"巨兽挑战",desc:"普通虫更少，中后期依靠 T4 Assault 与 Matriarch 制造压力。",tags:["巨兽","后期"],state:{elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.5,damage:1.25,capn:10,roleCount:3,chance:.7,roleWeight:3,giantHp:4,giantCap:2,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.75,stagger:3,staggerCost:5000}},
  economy:{title:"虫卵经济",desc:"启用战利品经济实验，提高 Raptor metalCost，从而影响蛋资源价值。",tags:["经济","回收"],state:{elite:true,roles:true,colossus:true,egg:true,intercept:false,boss:true,hp:1.7,damage:1.3,capn:18,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:3,eggMult:1.75,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}}
};
function resetState(){return {elite:false,roles:false,colossus:false,egg:false,intercept:false,boss:false,hp:1,damage:1,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2,giantCap:4,eggMult:1,aggroDist:1800,aggroChance:1,queenHp:1,stagger:1,staggerCost:5000}}

function squadLine(name,minA,maxA,behavior,rarity,count,weight,distance,chance){
  return '  setRaptorSquad("'+name+'",'+minA+','+maxA+',"'+behavior+'","'+rarity+'",'+count+','+weight+','+distance+','+chance+')\n';
}
function buildConfigLua(){
  const s=getConfig(),p=["do\n"];
  if(s.elite){
    p.push('  local hp='+s.hp+' local dmg='+s.damage+' local cap='+Math.max(1,Math.round(s.capn))+'\n');
    p.push('  for name,ud in pairs(UnitDefs) do\n');
    p.push('    if name:match("^raptor_") and not name:match("^raptor_queen_") then\n');
    p.push('      if ud.health then ud.health=ud.health*hp end\n');
    p.push('      ud.maxthisunit=math.min(ud.maxthisunit or cap,cap)\n');
    p.push('      for _,wd in pairs(ud.weapondefs or {}) do\n');
    p.push('        if wd.damage then for armor,v in pairs(wd.damage) do if type(v)=="number" then wd.damage[armor]=v*dmg end end end\n');
    p.push('      end\n');
    p.push('    end\n  end\n');
  }
  if(s.egg){
    p.push('  local eggCostMult='+s.eggMult+'\n');
    p.push('  for name,ud in pairs(UnitDefs) do if name:match("^raptor_") and not name:match("^raptor_queen_") and ud.metalcost then ud.metalcost=math.max(1,math.floor(ud.metalcost*eggCostMult)) end end\n');
  }
  if(s.roles||s.intercept){
    p.push('  local function setRaptorSquad(name,minA,maxA,behavior,rarity,amount,weight,distance,chance)\n');
    p.push('    local ud=UnitDefs[name] if not ud then return end ud.customparams=ud.customparams or {} local q=ud.customparams\n');
    p.push('    q.raptorcustomsquad="1" q.raptorsquadunitsamount=tostring(amount) q.raptorsquadminanger=tostring(minA) q.raptorsquadmaxanger=tostring(maxA) q.raptorsquadweight=tostring(weight) q.raptorsquadrarity=rarity q.raptorsquadbehavior=behavior q.raptorsquadbehaviordistance=tostring(distance) q.raptorsquadbehaviorchance=tostring(chance)\n');
    p.push('  end\n');
  }
  if(s.roles){
    const c=Math.max(1,Math.round(s.roleCount)),w=Math.max(1,Math.round(s.roleWeight)),ch=s.chance;
    p.push(squadLine("raptor_land_swarmer_basic_t2_v1",0,1000,"raider","basic",c,w+4,500,ch));
    p.push(squadLine("raptor_land_assault_basic_t2_v1",15,1000,"berserk","basic",Math.max(1,Math.ceil(c/2)),w,1400,ch));
    p.push(squadLine("raptor_land_spiker_basic_t2_v1",20,1000,"skirmisher","special",Math.max(1,Math.ceil(c/2)),w,500,ch));
    p.push(squadLine("raptor_allterrain_arty_basic_t2_v1",30,1000,"artillery","special",1,Math.max(1,w-1),700,ch));
    p.push(squadLine("raptor_land_swarmer_heal_t2_v1",25,1000,"healer","special",1,Math.max(1,w-2),550,ch));
    p.push(squadLine("raptor_land_kamikaze_basic_t2_v1",35,1000,"kamikaze","special",Math.max(2,c),Math.max(1,w-1),700,ch));
  }
  if(s.intercept){
    const d=Math.max(100,Math.round(s.aggroDist)),ch=s.aggroChance;
    p.push(squadLine("raptor_land_assault_basic_t2_v2",10,1000,"berserk","basic",3,6,d,ch));
    p.push(squadLine("raptor_land_assault_basic_t2_v3",20,1000,"berserk","basic",3,6,d,ch));
  }
  if(s.colossus){
    p.push('  local giantHp='+s.giantHp+' local giantCap='+Math.max(1,Math.round(s.giantCap))+'\n');
    p.push('  local giants={"raptor_matriarch_basic","raptor_matriarch_fire","raptor_matriarch_acid","raptor_matriarch_electric","raptor_land_assault_basic_t4_v1","raptor_land_assault_basic_t4_v2"}\n');
    p.push('  for _,name in ipairs(giants) do local ud=UnitDefs[name] if ud then if ud.health then ud.health=ud.health*giantHp end ud.maxthisunit=math.min(ud.maxthisunit or giantCap,giantCap) end end\n');
  }
  if(s.boss){
    p.push('  local queenHp='+s.queenHp+' local stagger='+s.stagger+' local costGate='+Math.max(0,Math.round(s.staggerCost))+'\n');
    p.push('  for name,ud in pairs(UnitDefs) do\n');
    p.push('    if name:match("^raptor_queen_") and ud.health then ud.health=ud.health*queenHp end\n');
    p.push('    if not name:match("^raptor_") and ud.canmove and not ud.canfly and ud.metalcost and ud.metalcost>=costGate then ud.customparams=ud.customparams or {} ud.customparams.bossstaggermultiplier=tostring(stagger) end\n');
    p.push('  end\n');
  }
  p.push("end");
  return p.join("");
}
function renderConfig(){
  const lua=buildConfigLua(),key=slotKey($("configSlot").value),cmd="!bset "+key+" "+encode64(lua);
  $("configLua").textContent=lua;$("configCommand").textContent=cmd;$("configStats").textContent=key+" · Lua "+lua.length+" chars · command "+cmd.length+" chars";
}
CONFIG_IDS.forEach(id=>$(id)?.addEventListener("input",renderConfig));
$("configSlot").addEventListener("change",renderConfig);
qa("[data-config-preset]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.configPreset;if(k==="reset")setConfig(resetState());else setConfig(BUILTIN[k].state)}));
$("copyConfigLua").onclick=()=>copyText($("configLua").textContent,$("copyConfigLua"));
$("copyConfigCmd").onclick=()=>copyText($("configCommand").textContent,$("copyConfigCmd"));
$("sendConfigToEditor").onclick=()=>{$("editorText").value=$("configLua").textContent;$("editorSlot").value=$("configSlot").value;renderEditor();switchTab("editor")};

function renderBuiltinPresets(){
  $("builtinPresets").innerHTML=Object.entries(BUILTIN).map(([k,p])=>'<article class="card preset-card"><h3>'+p.title+'</h3><p>'+p.desc+'</p><div class="chips">'+p.tags.map(t=>'<span class="chip">'+t+'</span>').join("")+'</div><button class="btn primary" data-apply-built="'+k+'">应用</button></article>').join("");
  qa("[data-apply-built]").forEach(b=>b.onclick=()=>{setConfig(BUILTIN[b.dataset.applyBuilt].state);switchTab("config")});
}
const STORE="bar-toolkit-presets-v2";
function readSaved(){try{return JSON.parse(localStorage.getItem(STORE)||"[]")}catch{return []}}
function writeSaved(v){localStorage.setItem(STORE,JSON.stringify(v));renderSaved()}
function renderSaved(){
  const list=readSaved();
  $("savedPresets").innerHTML=list.length?list.map((p,i)=>'<article class="card preset-card"><h3>'+p.name+'</h3><div class="meta">'+new Date(p.time).toLocaleString()+'</div><div class="chips"><span class="chip">自定义</span></div><div class="toolbar"><button class="btn primary small" data-load-saved="'+i+'">应用</button><button class="btn danger small" data-del-saved="'+i+'">删除</button></div></article>').join(""):'<div class="empty">还没有保存的本地预设。</div>';
  qa("[data-load-saved]").forEach(b=>b.onclick=()=>{setConfig(list[Number(b.dataset.loadSaved)].state);switchTab("config")});
  qa("[data-del-saved]").forEach(b=>b.onclick=()=>{const a=readSaved();a.splice(Number(b.dataset.delSaved),1);writeSaved(a)});
}
$("savePreset").onclick=()=>{const name=$("presetName").value.trim()||("Preset "+(readSaved().length+1));const a=readSaved();a.push({name,time:Date.now(),state:getConfig()});writeSaved(a);$("presetName").value=""};
$("clearPresets").onclick=()=>{if(confirm("清空所有本地 Preset？"))writeSaved([])};
$("exportPresets").onclick=()=>{const blob=new Blob([JSON.stringify(readSaved(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bar-presets.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$("importPresets").onclick=()=>{try{const v=JSON.parse($("presetImport").value);if(!Array.isArray(v))throw new Error("JSON 必须是数组");writeSaved(v);alert("导入成功")}catch(e){alert("导入失败："+e.message)}};

function angerText(x){
  const mins=x.min?.length?x.min.join(" / "):"默认";
  const maxs=x.max?.length?x.max.join(" / "):"默认";
  return mins+" → "+maxs;
}
function fillFilter(id,values,label){
  const el=$(id);for(const v of [...new Set(values.filter(Boolean))].sort()){const o=document.createElement("option");o.value=v;o.textContent=v;el.appendChild(o)} if(label)el.firstElementChild.textContent=label;
}
fillFilter("raptorTier",D.raptors.map(x=>x.tier),"全部 Tier");fillFilter("raptorRole",D.raptors.map(x=>x.role),"全部角色");
function renderRaptors(){
  const q=$("raptorSearch").value.trim().toLowerCase(),tier=$("raptorTier").value,role=$("raptorRole").value;
  const rows=D.raptors.filter(x=>(!tier||x.tier===tier)&&(!role||x.role===role)&&(!q||(x.id+" "+x.types.join(" ")).toLowerCase().includes(q)));
  $("raptorCount").textContent=rows.length+" / "+D.raptors.length;
  $("raptorRows").innerHTML=rows.map(x=>'<tr><td class="mono">'+x.id+'</td><td>'+x.tier+'</td><td>'+x.role+'</td><td>'+x.types.map(t=>'<span class="chip">'+t+'</span>').join("")+'</td><td class="mono">'+angerText(x)+'</td><td><button class="btn small" data-use-raptor="'+x.id+'">用于 Squad</button></td></tr>').join("");
  qa("[data-use-raptor]").forEach(b=>b.onclick=()=>{$("squadMode").value="raptor";$("squadUnit").value=b.dataset.useRaptor;switchTab("custom")});
}
["raptorSearch","raptorTier","raptorRole"].forEach(id=>$(id).addEventListener("input",renderRaptors));
function renderScavs(){
  const q=$("scavSearch").value.trim().toLowerCase();
  const rows=D.scavs.filter(x=>!q||(x.id+" "+x.types.join(" ")).toLowerCase().includes(q));
  $("scavCount").textContent=rows.length+" / "+D.scavs.length;
  $("scavRows").innerHTML=rows.map(x=>'<tr><td class="mono">'+x.id+'</td><td>'+x.tier+'</td><td>'+x.role+'</td><td>'+x.types.map(t=>'<span class="chip">'+t+'</span>').join("")+'</td><td class="mono">'+angerText(x)+'</td><td><button class="btn small" data-use-scav="'+x.id+'">用于 Squad</button></td></tr>').join("");
  qa("[data-use-scav]").forEach(b=>b.onclick=()=>{$("squadMode").value="scav";$("squadUnit").value=b.dataset.useScav;switchTab("custom")});
}
$("scavSearch").addEventListener("input",renderScavs);

for(const b of D.behaviors){const o=document.createElement("option");o.value=b.id;o.textContent=b.id+" · "+b.zh;$("squadBehavior").appendChild(o)}
function appendEditor(snippet){
  const e=$("editorText");const cur=e.value.trim();
  if(cur==="do\n  -- 在这里编辑 tweakdefs Lua\nend"||!cur)e.value=snippet;
  else e.value=cur+"\n\n"+snippet;
  renderEditor();
}
$("buildUnitTweak").onclick=()=>{
  const id=$("unitId").value.trim(),prop=$("unitProp").value,op=$("unitOp").value,v=Number($("unitValue").value);
  if(!id||!Number.isFinite(v))return alert("请填写 UnitDef ID 和数值");
  const rhs=op==="mul"?'(ud.'+prop+' or 0)*'+v:String(v);
  appendEditor('do\n  local ud=UnitDefs["'+esc(id)+'"]\n  if ud then ud.'+prop+'='+rhs+' end\nend');
  switchTab("editor");
};
$("buildSquad").onclick=()=>{
  const mode=$("squadMode").value,id=$("squadUnit").value.trim();if(!id)return alert("请填写 UnitDef ID");
  const pre=mode==="raptor"?"raptor":"scav",surface=$("squadSurface").value;
  const lines=['do','  local ud=UnitDefs["'+esc(id)+'"]','  if ud then','    ud.customparams=ud.customparams or {}','    local p=ud.customparams',
    '    p.'+pre+'customsquad="1"',
    '    p.'+pre+'squadunitsamount="'+Math.max(1,Math.round(num("squadAmount",1)))+'"',
    '    p.'+pre+'squadminanger="'+Math.round(num("squadMin",0))+'"',
    '    p.'+pre+'squadmaxanger="'+Math.round(num("squadMax",1000))+'"',
    '    p.'+pre+'squadweight="'+Math.max(1,Math.round(num("squadWeight",1)))+'"',
    '    p.'+pre+'squadrarity="'+esc($("squadRarity").value)+'"',
    '    p.'+pre+'squadbehavior="'+esc($("squadBehavior").value)+'"',
    '    p.'+pre+'squadbehaviordistance="'+Math.max(0,Math.round(num("squadDistance",500)))+'"',
    '    p.'+pre+'squadbehaviorchance="'+Math.max(0,Math.min(1,num("squadChance",.5)))+'"'];
  if(mode==="scav")lines.push('    p.scavsquadsurface="'+esc(surface)+'"');
  lines.push("  end","end");appendEditor(lines.join("\n"));switchTab("editor");
};

$("encodeB64").onclick=()=>{const lua=$("b64Input").value,key=slotKey($("b64Slot").value);$("b64Output").textContent="!bset "+key+" "+encode64(lua)};
$("decodeB64").onclick=()=>{try{$("b64Decoded").textContent=decode64($("b64DecodeInput").value)}catch(e){$("b64Decoded").textContent="解码失败："+e.message}};
$("copyB64").onclick=()=>copyText($("b64Output").textContent,$("copyB64"));

function renderEditor(){
  const lua=$("editorText").value,key=slotKey($("editorSlot").value),cmd="!bset "+key+" "+encode64(lua);
  $("editorCommand").textContent=cmd;$("editorStats").textContent=key+" · Lua "+lua.length+" chars · command "+cmd.length+" chars";
}
$("editorText").addEventListener("input",renderEditor);$("editorSlot").addEventListener("change",renderEditor);
$("clearEditor").onclick=()=>{if(confirm("清空 Editor？")){$("editorText").value="do\n  -- 在这里编辑 tweakdefs Lua\nend";renderEditor()}};
$("formatEditor").onclick=()=>{$("editorText").value=$("editorText").value.replace(/[ \t]+$/gm,"").trim()+"\n";renderEditor()};
$("copyEditorLua").onclick=()=>copyText($("editorText").value,$("copyEditorLua"));
$("copyEditorCmd").onclick=()=>copyText($("editorCommand").textContent,$("copyEditorCmd"));

function renderDocs(){
  $("raptorParamRows").innerHTML=D.raptorParams.map(x=>'<tr><td class="mono">'+x[0]+'</td><td>'+x[1]+'</td><td>'+x[2]+'</td></tr>').join("");
  $("scavParamRows").innerHTML=D.scavParams.map(x=>'<tr><td class="mono">'+x[0]+'</td><td>'+x[1]+'</td><td>'+x[2]+'</td></tr>').join("");
  $("behaviorCards").innerHTML=D.behaviors.map(x=>'<article class="card"><h3 class="mono">'+x.id+'</h3><p><b>'+x.zh+'</b><br>'+x.desc+'</p></article>').join("");
}
renderBuiltinPresets();renderSaved();renderRaptors();renderScavs();renderDocs();renderConfig();renderEditor();
})();