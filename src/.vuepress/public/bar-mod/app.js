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

const PLAYER_DEFENSES=[
  {id:"armclaw",faction:"ARM",tier:"T1",role:"电链攻击墙",official:"340M · 1330HP · 430射程 · 连锁2",v1:"320M · 1450HP · 连锁距离70"},
  {id:"armlwall",faction:"ARM",tier:"T2",role:"近程连锁电网",official:"1020M · 5320HP · 315射程 · 连锁3",v1:"980M · 5000HP · 350射程 · 连锁4 / 100距离"},
  {id:"armamb",faction:"ARM",tier:"T2",role:"高频远程群攻",official:"2500M · 4000HP · 350/1.8s · AoE152",v1:"2400M · 4300HP · 330/1.6s · AoE140"},
  {id:"armanni",faction:"ARM",tier:"T2",role:"反巨兽重单体",official:"3500M · 6100HP · 10800/9.9s · 1400射程",v1:"3400M · 6500HP · 1450射程 · Boss Stagger 2.25"},
  {id:"armflak",faction:"ARM",tier:"T2",role:"大范围防空",official:"820M · 1750HP · 250/0.5s · AoE172",v1:"2000HP · 230/0.45s · AoE190"},
  {id:"armbrtha",faction:"ARM",tier:"T2",role:"高频远程重炮",official:"4500M · 4650射程 · 1625/13.2s",v1:"BuildTime -15% · 1625/12s"},

  {id:"cormaw",faction:"COR",tier:"T1",role:"近距喷火墙",official:"290M · 1610HP · 410射程 · 16×22",v1:"300M · 1700HP · 保留近距持续喷火"},
  {id:"cormwall",faction:"COR",tier:"T2",role:"燃烧区域墙",official:"1020M · 5320HP · 7×450/15s · AoE96",v1:"1000M · 5400HP · 6×380/12s · 125火区 / 40DPS / 6s"},
  {id:"cortoast",faction:"COR",tier:"T2",role:"重爆炸群攻",official:"2500M · 4250HP · 420/2.1s · AoE164",v1:"4700HP · 500/2.4s · AoE190"},
  {id:"cordoom",faction:"COR",tier:"T2",role:"泛用重堡垒",official:"3000M · 9400HP · 三层武器体系",v1:"10000HP · 保留多距离武器结构"},
  {id:"corflak",faction:"COR",tier:"T2",role:"重型高爆防空",official:"850M · 1840HP · 250/0.5s · AoE172",v1:"2100HP · 300/0.6s · AoE170"},
  {id:"corint",faction:"COR",tier:"T2",role:"最重单发LRPC",official:"4600M · 4950射程 · 2000/16s · AoE157",v1:"BuildTime -15% · 5000射程 · 2150/16.5s · AoE180"},

  {id:"legdtr",faction:"LEG",tier:"T1",role:"冲击击退墙",official:"290M · 1610HP · 240/2s · AoE140 · Impulse2",v1:"300M · 1750HP · 230/1.8s · AoE150 · Impulse2.4"},
  {id:"legrwall",faction:"LEG",tier:"T2",role:"轨道穿透墙",official:"1250M · 9600HP · 950射程 · 1000/4.5s",v1:"1150M · 6500HP · 925射程 · 1150/5s · 保留穿透"},
  {id:"legacluster",faction:"LEG",tier:"T2",role:"集束覆盖炮",official:"2300M · 3700HP · 主弹414 + 8×105",v1:"3900HP · 主弹420 + 6×120 · 3.6s"},
  {id:"legbastion",faction:"LEG",tier:"T2",role:"持续扫射重塔",official:"4200M · 12000HP · DM0.25 · 155 · 1100射程",v1:"4000M · 9500HP · DM0.33 · 170 · 1150射程"},
  {id:"legflak",faction:"LEG",tier:"T2",role:"高频微型防空",official:"820M · 1750HP · 3×58/0.166s · AoE44",v1:"1900HP · 900射程 · 3×55/0.18s · AoE48"},
  {id:"leglrpc",faction:"LEG",tier:"T2",role:"集束LRPC",official:"5200M · 4800射程 · 3×600 + Cluster",v1:"BuildTime -15% · 保留3连发与Cluster"}
];
let enabledDefenseUnits=new Set(PLAYER_DEFENSES.map(x=>x.id));

const CONFIG_IDS=["playerDefense","elite","roles","colossus","egg","intercept","boss","hp","damage","capn","roleCount","chance","roleWeight","giantHp","giantCap","eggMult","aggroDist","aggroChance","queenHp","stagger","staggerCost"];
const BOOL_IDS=new Set(["playerDefense","elite","roles","colossus","egg","intercept","boss"]);
function getConfig(){
  const s={};
  for(const id of CONFIG_IDS){const e=$(id);s[id]=BOOL_IDS.has(id)?e.checked:Number(e.value)}
  s.defenseUnits=[...enabledDefenseUnits];
  return s;
}
function setConfig(s){
  for(const id of CONFIG_IDS){if(s[id]===undefined)continue;const e=$(id);if(BOOL_IDS.has(id))e.checked=!!s[id];else e.value=s[id]}
  if(Array.isArray(s.defenseUnits)) enabledDefenseUnits=new Set(s.defenseUnits);
  else if(s.playerDefense===true) enabledDefenseUnits=new Set(PLAYER_DEFENSES.map(x=>x.id));
  renderPlayerDefenseRows();
  renderConfig();
}
const BUILTIN={
  balanced:{title:"低单位防线",desc:"精英化 + 职业 + 巨兽 + Queen 分工，优先降低后期场上单位数。",tags:["推荐","PVE","低单位"],state:{playerDefense:true,elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.8,damage:1.35,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  elite:{title:"精英虫群",desc:"更少、更硬、更危险的普通虫；避免简单把伤害与血量同比例放大。",tags:["精英","低人口"],state:{playerDefense:true,elite:true,roles:true,colossus:false,egg:false,intercept:false,boss:true,hp:2.5,damage:1.55,capn:12,roleCount:3,chance:.7,roleWeight:3,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  colossus:{title:"巨兽挑战",desc:"普通虫更少，中后期依靠 T4 Assault 与 Matriarch 制造压力。",tags:["巨兽","后期"],state:{playerDefense:true,elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.5,damage:1.25,capn:10,roleCount:3,chance:.7,roleWeight:3,giantHp:4,giantCap:2,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.75,stagger:3,staggerCost:5000}},
  economy:{title:"虫卵经济",desc:"启用战利品经济实验，提高 Raptor metalCost，从而影响蛋资源价值。",tags:["经济","回收"],state:{playerDefense:true,elite:true,roles:true,colossus:true,egg:true,intercept:false,boss:true,hp:1.7,damage:1.3,capn:18,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:3,eggMult:1.75,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}}
};
function resetState(){return {playerDefense:false,defenseUnits:[],elite:false,roles:false,colossus:false,egg:false,intercept:false,boss:false,hp:1,damage:1,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2,giantCap:4,eggMult:1,aggroDist:1800,aggroChance:1,queenHp:1,stagger:1,staggerCost:5000}}

function squadLine(name,minA,maxA,behavior,rarity,count,weight,distance,chance){
  return '  setRaptorSquad("'+name+'",'+minA+','+maxA+',"'+behavior+'","'+rarity+'",'+count+','+weight+','+distance+','+chance+')\n';
}
function buildDefenseLua(faction){
  const rows=[];
  const add=(id,code)=>{const meta=PLAYER_DEFENSES.find(x=>x.id===id);if(enabledDefenseUnits.has(id)&&(!faction||meta?.faction===faction))rows.push(code)};
  rows.push('  local function U(n,t) local d=UnitDefs[n] if not d then return end for k,v in pairs(t) do if k=="customparams" then d.customparams=d.customparams or {} for ck,cv in pairs(v) do d.customparams[ck]=cv end else d[k]=v end end end\n');
  rows.push('  local function W(n,k,t) local d=UnitDefs[n] local w=d and d.weapondefs and d.weapondefs[k] if not w then return end for a,v in pairs(t) do if a=="damage" then w.damage=w.damage or {} for dk,dv in pairs(v) do w.damage[dk]=dv end elseif a=="customparams" then w.customparams=w.customparams or {} for ck,cv in pairs(v) do w.customparams[ck]=cv end else w[a]=v end end end\n');

  add("armclaw",'  U("armclaw",{metalcost=320,health=1450}) W("armclaw","dclaw",{customparams={spark_range="70"}})\n');
  add("armlwall",'  U("armlwall",{metalcost=980,health=5000}) W("armlwall","lightning",{range=350,reloadtime=1.35,damage={default=60},customparams={spark_maxunits="4",spark_range="100",spark_forkdamage="0.35"}})\n');
  add("armamb",'  U("armamb",{metalcost=2400,health=4300}) W("armamb","armamb_gun",{reloadtime=1.6,areaofeffect=140,damage={default=330}}) W("armamb","armamb_gun_high",{reloadtime=1.6,areaofeffect=140,damage={default=330}})\n');
  add("armanni",'  U("armanni",{metalcost=3400,health=6500,customparams={bossstaggermultiplier="2.25"}}) W("armanni","ata",{range=1450})\n');
  add("armflak",'  U("armflak",{health=2000}) W("armflak","armflak_gun",{reloadtime=0.45,areaofeffect=190,damage={vtol=230}})\n');
  add("armbrtha",'  U("armbrtha",{buildtime=72250}) W("armbrtha","lrpc",{reloadtime=12})\n');

  add("cormaw",'  U("cormaw",{metalcost=300,health=1700})\n');
  add("cormwall",'  U("cormwall",{metalcost=1000,health=5400}) W("cormwall","exp_heavyrocket",{range=675,reloadtime=12,burst=6,areaofeffect=110,damage={default=380},customparams={area_onhit_ceg="fire-area-150-repeat",area_onhit_damageceg="burnflamexl-gen",area_onhit_resistance="fire",area_onhit_damage="40",area_onhit_range="125",area_onhit_time="6"}})\n');
  add("cortoast",'  U("cortoast",{health=4700}) W("cortoast","cortoast_gun",{reloadtime=2.4,areaofeffect=190,damage={default=500}}) W("cortoast","cortoast_gun_high",{reloadtime=2.4,areaofeffect=190,damage={default=500}})\n');
  add("cordoom",'  U("cordoom",{health=10000})\n');
  add("corflak",'  U("corflak",{health=2100}) W("corflak","armflak_gun",{reloadtime=0.6,areaofeffect=170,damage={vtol=300}})\n');
  add("corint",'  U("corint",{buildtime=79305}) W("corint","lrpc",{range=5000,reloadtime=16.5,areaofeffect=180,damage={default=2150}})\n');

  add("legdtr",'  U("legdtr",{metalcost=300,health=1750}) W("legdtr","corlevlr_weapon",{range=410,reloadtime=1.8,areaofeffect=150,impulsefactor=2.4,damage={default=230}})\n');
  add("legrwall",'  U("legrwall",{metalcost=1150,health=6500}) W("legrwall","railgunt2",{range=925,reloadtime=5,damage={default=1150}})\n');
  add("legacluster",'  U("legacluster",{health=3900}) W("legacluster","plasma",{reloadtime=3.6,damage={default=420},customparams={cluster_number="6"}}) W("legacluster","plasma_high",{reloadtime=3.6,damage={default=420},customparams={cluster_number="6"}}) W("legacluster","cluster_munition",{damage={default=120}})\n');
  add("legbastion",'  U("legbastion",{metalcost=4000,health=9500,damagemodifier=0.33}) W("legbastion","t2heatray",{range=1150,damage={default=170}})\n');
  add("legflak",'  U("legflak",{health=1900}) W("legflak","leg_t2_microflak",{range=900,reloadtime=0.18,areaofeffect=48,burst=3,damage={vtol=55}})\n');
  add("leglrpc",'  U("leglrpc",{buildtime=79050})\n');
  return rows.join("");
}

function wrapModule(body){
  if(!body||!body.trim()) return "";
  return "do\n"+body+"end";
}
function buildRaptorCoreLua(s){
  const p=[];
  if(s.elite){
    p.push('  local hp='+s.hp+' local dmg='+s.damage+' local cap='+Math.max(1,Math.round(s.capn))+'\n');
    p.push('  for name,ud in pairs(UnitDefs) do\n');
    p.push('    if name:match("^raptor_") and not name:match("^raptor_queen_") then\n');
    p.push('      if ud.health then ud.health=ud.health*hp end\n');
    p.push('      ud.maxthisunit=math.min(ud.maxthisunit or cap,cap)\n');
    p.push('      for _,wd in pairs(ud.weapondefs or {}) do if wd.damage then for armor,v in pairs(wd.damage) do if type(v)=="number" then wd.damage[armor]=v*dmg end end end end\n');
    p.push('    end\n  end\n');
  }
  return wrapModule(p.join(""));
}
function buildRaptorRolesLua(s){
  const p=[];
  if(s.roles||s.intercept){
    p.push('  local function setRaptorSquad(name,minA,maxA,behavior,rarity,amount,weight,distance,chance)\n');
    p.push('    local ud=UnitDefs[name] if not ud then return end ud.customparams=ud.customparams or {} local q=ud.customparams\n');
    p.push('    q.raptorcustomsquad="1" q.raptorsquadunitsamount=tostring(amount) q.raptorsquadminanger=tostring(minA) q.raptorsquadmaxanger=tostring(maxA) q.raptorsquadweight=tostring(weight) q.raptorsquadrarity=rarity q.raptorsquadbehavior=behavior q.raptorsquadbehaviordistance=tostring(distance) q.raptorsquadbehaviorchance=tostring(chance)\n');
    p.push('  end\n');
  }
  if(s.roles){
    const count=Math.max(1,Math.round(s.roleCount)),weight=Math.max(1,Math.round(s.roleWeight)),chance=s.chance;
    p.push(squadLine("raptor_land_swarmer_basic_t2_v1",0,1000,"raider","basic",count,weight+4,500,chance));
    p.push(squadLine("raptor_land_assault_basic_t2_v1",15,1000,"berserk","basic",Math.max(1,Math.ceil(count/2)),weight,1400,chance));
    p.push(squadLine("raptor_land_spiker_basic_t2_v1",20,1000,"skirmisher","special",Math.max(1,Math.ceil(count/2)),weight,500,chance));
    p.push(squadLine("raptor_allterrain_arty_basic_t2_v1",30,1000,"artillery","special",1,Math.max(1,weight-1),700,chance));
    p.push(squadLine("raptor_land_swarmer_heal_t2_v1",25,1000,"healer","special",1,Math.max(1,weight-2),550,chance));
    p.push(squadLine("raptor_land_kamikaze_basic_t2_v1",35,1000,"kamikaze","special",Math.max(2,count),Math.max(1,weight-1),700,chance));
  }
  if(s.intercept){
    const d=Math.max(100,Math.round(s.aggroDist)),chance=s.aggroChance;
    p.push(squadLine("raptor_land_assault_basic_t2_v2",10,1000,"berserk","basic",3,6,d,chance));
    p.push(squadLine("raptor_land_assault_basic_t2_v3",20,1000,"berserk","basic",3,6,d,chance));
  }
  return wrapModule(p.join(""));
}
function buildBossLua(s){
  const p=[];
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
  return wrapModule(p.join(""));
}
function buildEggLua(s){
  if(!s.egg)return "";
  return wrapModule('  local eggCostMult='+s.eggMult+'\n  for name,ud in pairs(UnitDefs) do if name:match("^raptor_") and not name:match("^raptor_queen_") and ud.metalcost then ud.metalcost=math.max(1,math.floor(ud.metalcost*eggCostMult)) end end\n');
}
function buildConfigModules(){
  const s=getConfig(),mods=[];
  const push=(slot,title,lua,type="tweakdefs")=>{if(lua&&lua.trim())mods.push({slot,title,lua,type,key:type+(slot===0?"":slot)})};
  if(s.playerDefense){
    push(0,"ARM 基础防御",wrapModule(buildDefenseLua("ARM")));
    push(1,"COR 基础防御",wrapModule(buildDefenseLua("COR")));
    push(2,"LEG 基础防御",wrapModule(buildDefenseLua("LEG")));
  }
  push(4,"Raptor 基础数值与存量",buildRaptorCoreLua(s));
  push(5,"Raptor 职业与机动迎击",buildRaptorRolesLua(s));
  push(6,"巨兽与 Queen Boss",buildBossLua(s));
  push(7,"虫卵经济",buildEggLua(s));
  return mods;
}
function renderConfig(){
  const mods=buildConfigModules();
  const blocks=mods.map(m=>{
    const cmd="!bset "+m.key+" "+encode64(m.lua);
    const warn=cmd.length>16000?"  ⚠ 超过16000字符":"";
    return "-- "+m.title+" ["+m.key+"]"+warn+"\n"+cmd;
  });
  const combined=mods.map(m=>"-- "+m.title+" ["+m.key+"]\n"+m.lua).join("\n\n");
  $("configLua").textContent=combined||"-- 当前没有启用任何模块";
  $("configCommand").textContent=blocks.join("\n\n")||"-- 当前没有可生成的命令";
  const over=mods.filter(m=>("!bset "+m.key+" "+encode64(m.lua)).length>16000).length;
  $("configStats").textContent=mods.length+" 个模块 · "+mods.map(m=>m.key).join(" / ")+(over?" · ⚠ "+over+" 个模块超长":"");
  if($("playerDefenseSummary"))$("playerDefenseSummary").textContent=enabledDefenseUnits.size+" / "+PLAYER_DEFENSES.length+" 已启用";
}
CONFIG_IDS.forEach(id=>$(id)?.addEventListener("input",renderConfig));
$("openPlayerDefense")?.addEventListener("click",()=>switchTab("players"));
qa("[data-config-preset]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.configPreset;if(k==="reset")setConfig(resetState());else setConfig(BUILTIN[k].state)}));
$("copyConfigLua").onclick=()=>copyText($("configLua").textContent,$("copyConfigLua"));
$("copyConfigCmd").onclick=()=>{const cmds=buildConfigModules().map(m=>"!bset "+m.key+" "+encode64(m.lua)).join("\n");copyText(cmds,$("copyConfigCmd"))};
$("sendConfigToEditor").onclick=()=>{$("editorText").value=$("configLua").textContent;renderEditor();switchTab("editor")};

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

function renderPlayerDefenseRows(){
  if(!$("playerDefenseRows"))return;
  const q=($("playerDefenseSearch")?.value||"").trim().toLowerCase();
  const faction=$("playerDefenseFaction")?.value||"";
  const rows=PLAYER_DEFENSES.filter(x=>(!faction||x.faction===faction)&&(!q||(x.id+" "+x.role+" "+x.faction).toLowerCase().includes(q)));
  $("playerDefenseRows").innerHTML=rows.map(x=>'<tr><td><input type="checkbox" data-defense-unit="'+x.id+'" '+(enabledDefenseUnits.has(x.id)?"checked":"")+'></td><td><span class="chip">'+x.faction+'</span></td><td>'+x.tier+'</td><td class="mono">'+x.id+'</td><td>'+x.role+'</td><td>'+x.official+'</td><td>'+x.v1+'</td></tr>').join("");
  $("playerDefenseCount").textContent=enabledDefenseUnits.size+" / "+PLAYER_DEFENSES.length+" 默认启用";
  if($("playerDefenseSummary"))$("playerDefenseSummary").textContent=enabledDefenseUnits.size+" / "+PLAYER_DEFENSES.length+" 已启用";
  qa("[data-defense-unit]").forEach(e=>e.addEventListener("change",()=>{if(e.checked)enabledDefenseUnits.add(e.dataset.defenseUnit);else enabledDefenseUnits.delete(e.dataset.defenseUnit);renderPlayerDefenseRows();renderConfig()}));
}
$("playerDefenseSearch")?.addEventListener("input",renderPlayerDefenseRows);
$("playerDefenseFaction")?.addEventListener("change",renderPlayerDefenseRows);
$("enableAllDefense")?.addEventListener("click",()=>{enabledDefenseUnits=new Set(PLAYER_DEFENSES.map(x=>x.id));$("playerDefense").checked=true;renderPlayerDefenseRows();renderConfig()});
$("disableAllDefense")?.addEventListener("click",()=>{enabledDefenseUnits.clear();renderPlayerDefenseRows();renderConfig()});

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
renderBuiltinPresets();renderSaved();renderPlayerDefenseRows();renderRaptors();renderScavs();renderDocs();renderConfig();renderEditor();
})();