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

const CONFIG_IDS=["playerDefense","landUnits","armLand","corLand","legLand","legSlow","t3Units","armT3","corT3","legT3","bossSupport","bossSupportStagger","bossSupportQueenBonus","ultimate","teamColorFx","teamColorMode","armUltRange","armUltDamage","armUltBeam","armUltReload","armUltAoe","corUltRange","corUltDamage","corUltReload","corUltAoe","corUltFireDps","corUltFireRange","corUltFireTime","legUltRange","legUltDamage","legUltBurst","legUltBurstRate","legUltBeam","legUltReload","legUltAoe","elite","roles","colossus","egg","intercept","boss","hp","damage","capn","roleCount","chance","roleWeight","giantHp","giantCap","eggMult","aggroDist","aggroChance","queenHp","stagger","staggerCost"];
const BOOL_IDS=new Set(["playerDefense","landUnits","armLand","corLand","legLand","legSlow","t3Units","armT3","corT3","legT3","bossSupport","ultimate","teamColorFx","elite","roles","colossus","egg","intercept","boss"]);
const TEXT_IDS=new Set(["teamColorMode"]);
function getConfig(){
  const s={};
  for(const id of CONFIG_IDS){
    const e=$(id);if(!e)continue;
    s[id]=BOOL_IDS.has(id)?e.checked:(TEXT_IDS.has(id)?e.value:Number(e.value));
  }
  s.defenseUnits=[...enabledDefenseUnits];
  return s;
}
function setConfig(s){
  for(const id of CONFIG_IDS){
    if(s[id]===undefined)continue;
    const e=$(id);if(!e)continue;
    if(BOOL_IDS.has(id))e.checked=!!s[id];else e.value=s[id];
  }
  if(Array.isArray(s.defenseUnits)) enabledDefenseUnits=new Set(s.defenseUnits);
  else if(s.playerDefense===true) enabledDefenseUnits=new Set(PLAYER_DEFENSES.map(x=>x.id));
  renderPlayerDefenseRows();
  renderConfig();
}
const BUILTIN={
  balanced:{title:"低单位防线",desc:"精英化 + 职业 + 巨兽 + Queen 分工，优先降低后期场上单位数。",tags:["推荐","PVE","低单位"],state:{playerDefense:true,landUnits:true,armLand:true,corLand:true,legLand:true,legSlow:true,t3Units:true,armT3:true,corT3:true,legT3:true,bossSupport:true,bossSupportStagger:4.5,bossSupportQueenBonus:1.25,ultimate:true,teamColorFx:true,teamColorMode:"hybrid",armUltRange:6200,armUltDamage:45000,armUltBeam:4,armUltReload:5,armUltAoe:40,corUltRange:6100,corUltDamage:6000,corUltReload:1.05,corUltAoe:260,corUltFireDps:240,corUltFireRange:200,corUltFireTime:9,legUltRange:6100,legUltDamage:2000,legUltBurst:63,legUltBurstRate:.03,legUltBeam:.15,legUltReload:14,legUltAoe:120,elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.8,damage:1.35,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  elite:{title:"精英虫群",desc:"更少、更硬、更危险的普通虫；避免简单把伤害与血量同比例放大。",tags:["精英","低人口"],state:{playerDefense:true,landUnits:true,armLand:true,corLand:true,legLand:true,legSlow:true,t3Units:true,armT3:true,corT3:true,legT3:true,bossSupport:true,bossSupportStagger:4.5,bossSupportQueenBonus:1.25,ultimate:true,teamColorFx:true,teamColorMode:"hybrid",armUltRange:6200,armUltDamage:45000,armUltBeam:4,armUltReload:5,armUltAoe:40,corUltRange:6100,corUltDamage:6000,corUltReload:1.05,corUltAoe:260,corUltFireDps:240,corUltFireRange:200,corUltFireTime:9,legUltRange:6100,legUltDamage:2000,legUltBurst:63,legUltBurstRate:.03,legUltBeam:.15,legUltReload:14,legUltAoe:120,elite:true,roles:true,colossus:false,egg:false,intercept:false,boss:true,hp:2.5,damage:1.55,capn:12,roleCount:3,chance:.7,roleWeight:3,giantHp:2.5,giantCap:4,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}},
  colossus:{title:"巨兽挑战",desc:"普通虫更少，中后期依靠 T4 Assault 与 Matriarch 制造压力。",tags:["巨兽","后期"],state:{playerDefense:true,landUnits:true,armLand:true,corLand:true,legLand:true,legSlow:true,t3Units:true,armT3:true,corT3:true,legT3:true,bossSupport:true,bossSupportStagger:4.5,bossSupportQueenBonus:1.25,ultimate:true,teamColorFx:true,teamColorMode:"hybrid",armUltRange:6200,armUltDamage:45000,armUltBeam:4,armUltReload:5,armUltAoe:40,corUltRange:6100,corUltDamage:6000,corUltReload:1.05,corUltAoe:260,corUltFireDps:240,corUltFireRange:200,corUltFireTime:9,legUltRange:6100,legUltDamage:2000,legUltBurst:63,legUltBurstRate:.03,legUltBeam:.15,legUltReload:14,legUltAoe:120,elite:true,roles:true,colossus:true,egg:false,intercept:false,boss:true,hp:1.5,damage:1.25,capn:10,roleCount:3,chance:.7,roleWeight:3,giantHp:4,giantCap:2,eggMult:1.25,aggroDist:1800,aggroChance:1,queenHp:1.75,stagger:3,staggerCost:5000}},
  economy:{title:"虫卵经济",desc:"启用战利品经济实验，提高 Raptor metalCost，从而影响蛋资源价值。",tags:["经济","回收"],state:{playerDefense:true,landUnits:true,armLand:true,corLand:true,legLand:true,legSlow:true,t3Units:true,armT3:true,corT3:true,legT3:true,bossSupport:true,bossSupportStagger:4.5,bossSupportQueenBonus:1.25,ultimate:true,teamColorFx:true,teamColorMode:"hybrid",armUltRange:6200,armUltDamage:45000,armUltBeam:4,armUltReload:5,armUltAoe:40,corUltRange:6100,corUltDamage:6000,corUltReload:1.05,corUltAoe:260,corUltFireDps:240,corUltFireRange:200,corUltFireTime:9,legUltRange:6100,legUltDamage:2000,legUltBurst:63,legUltBurstRate:.03,legUltBeam:.15,legUltReload:14,legUltAoe:120,elite:true,roles:true,colossus:true,egg:true,intercept:false,boss:true,hp:1.7,damage:1.3,capn:18,roleCount:4,chance:.75,roleWeight:4,giantHp:2.5,giantCap:3,eggMult:1.75,aggroDist:1800,aggroChance:1,queenHp:1.5,stagger:3,staggerCost:5000}}
};
function resetState(){return {playerDefense:false,defenseUnits:[],landUnits:false,armLand:false,corLand:false,legLand:false,legSlow:false,t3Units:false,armT3:false,corT3:false,legT3:false,bossSupport:false,bossSupportStagger:4.5,bossSupportQueenBonus:1.25,ultimate:false,teamColorFx:false,teamColorMode:"hybrid",armUltRange:6200,armUltDamage:45000,armUltBeam:4,armUltReload:5,armUltAoe:40,corUltRange:6100,corUltDamage:6000,corUltReload:1.05,corUltAoe:260,corUltFireDps:240,corUltFireRange:200,corUltFireTime:9,legUltRange:6100,legUltDamage:2000,legUltBurst:63,legUltBurstRate:.03,legUltBeam:.15,legUltReload:14,legUltAoe:120,elite:false,roles:false,colossus:false,egg:false,intercept:false,boss:false,hp:1,damage:1,capn:20,roleCount:4,chance:.75,roleWeight:4,giantHp:2,giantCap:4,eggMult:1,aggroDist:1800,aggroChance:1,queenHp:1,stagger:1,staggerCost:5000}}

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
    p.push('    if not name:match("^raptor_") and ud.canmove and not ud.canfly and ud.metalcost and ud.metalcost>=costGate then ud.customparams=ud.customparams or {} if not ud.customparams.bossstaggermultiplier and not ud.customparams.bossStaggerMultiplier then ud.customparams.bossstaggermultiplier=tostring(stagger) ud.customparams.bossStaggerMultiplier=tostring(stagger) end end\n');
    p.push('  end\n');
  }
  return wrapModule(p.join(""));
}
function buildEggLua(s){
  if(!s.egg)return "";
  return wrapModule('  local eggCostMult='+s.eggMult+'\n  for name,ud in pairs(UnitDefs) do if name:match("^raptor_") and not name:match("^raptor_queen_") and ud.metalcost then ud.metalcost=math.max(1,math.floor(ud.metalcost*eggCostMult)) end end\n');
}
function landHelpers(){
  return '  local function U(n,t) local d=UnitDefs[n] if not d then return end for k,v in pairs(t) do if k=="customparams" then d.customparams=d.customparams or {} for ck,cv in pairs(v) do d.customparams[ck]=cv end else d[k]=v end end end\n'
    +'  local function W(n,k,t) local d=UnitDefs[n] local w=d and d.weapondefs and d.weapondefs[k] if not w then return end for a,v in pairs(t) do if a=="damage" then w.damage=w.damage or {} for dk,dv in pairs(v) do w.damage[dk]=dv end elseif a=="customparams" then w.customparams=w.customparams or {} for ck,cv in pairs(v) do w.customparams[ck]=cv end else w[a]=v end end end\n';
}
function buildArmLandLua(s){
  if(!s.landUnits||!s.armLand)return "";
  const p=[landHelpers()];
  p.push('  -- ARM: charged single-target energy weapons; strong alpha, long cycles, low splash.\n');

  // Bots
  p.push('  W("armham","arm_ham",{name="Charged T1 Beam",weapontype="BeamLaser",gravityaffected=false,range=440,reloadtime=3.8,beamtime=0.18,areaofeffect=12,energypershot=100,weaponvelocity=1800,thickness=2.2,corethickness=0.24,laserflaresize=5,rgbcolor="0.35 0.7 1",rgbcolor2="0.9 0.98 1",explosiongenerator="custom:laserhit-small-blue",damage={default=260,vtol=20}})\n');
  p.push('  W("armwar","armwar_laser",{name="Dual Charged Combat Laser",range=360,reloadtime=1.2,beamtime=0.18,areaofeffect=8,energypershot=70,thickness=2.2,corethickness=0.2,damage={default=220,vtol=22}})\n');
  p.push('  W("armzeus","lightning",{name="Charged Lightning Lance",range=320,burst=6,burstrate=0.05,reloadtime=3.2,energypershot=22,customparams={spark_maxunits="0",spark_range="0",spark_forkdamage="0"},damage={default=75}})\n');
  p.push('  W("armfido","bfido",{name="Long-range Pulse Laser",weapontype="BeamLaser",gravityaffected=false,range=725,reloadtime=7.5,beamtime=0.16,areaofeffect=16,energypershot=350,weaponvelocity=2400,thickness=2.8,corethickness=0.3,laserflaresize=6,rgbcolor="0.3 0.65 1",rgbcolor2="0.9 0.98 1",explosiongenerator="custom:laserhit-medium-blue",damage={default=700,vtol=60}})\n');
  p.push('  W("armsnipe","armsnipe_weapon",{name="Extreme Charged Sniper Laser",range=1100,reloadtime=14,beamtime=0.12,energypershot=900,damage={default=4200,commanders=1400}})\n');
  p.push('  W("armmav","armmav_weapon",{name="Heavy Pulse Beam",weapontype="BeamLaser",gravityaffected=false,range=430,reloadtime=3.2,beamtime=0.2,areaofeffect=12,energypershot=300,weaponvelocity=2200,thickness=3.2,corethickness=0.32,laserflaresize=6,rgbcolor="0.25 0.6 1",rgbcolor2="0.95 1 1",explosiongenerator="custom:laserhit-medium-blue",impulsefactor=0,damage={default=950,vtol=100}})\n');

  // T1 Vehicles: fast chassis, but fire in deliberate high-energy pulses.
  p.push('  W("armflash","emgx",{name="Pulse EM Cannon",burst=1,reloadtime=0.9,range=220,areaofeffect=8,damage={default=78,vtol=16}})\n');
  p.push('  W("armpincer","arm_pincer_gauss",{name="Charged Amphibious Beam",weapontype="BeamLaser",gravityaffected=false,range=340,reloadtime=3.0,beamtime=0.16,areaofeffect=8,energypershot=90,weaponvelocity=1800,thickness=2.0,corethickness=0.2,rgbcolor="0.3 0.65 1",rgbcolor2="0.9 0.98 1",explosiongenerator="custom:laserhit-small-blue",damage={default=240,vtol=25}})\n');
  p.push('  W("armstump","arm_lightcannon",{name="Medium Pulse Beam",weapontype="BeamLaser",gravityaffected=false,range=390,reloadtime=2.8,beamtime=0.18,areaofeffect=12,energypershot=120,weaponvelocity=1900,thickness=2.4,corethickness=0.24,rgbcolor="0.3 0.65 1",rgbcolor2="0.95 1 1",explosiongenerator="custom:laserhit-small-blue",damage={default=270,vtol=30}})\n');
  p.push('  W("armart","tawf113_weapon",{range=760,reloadtime=6.2,areaofeffect=60,accuracy=120,damage={default=360,vtol=35}})\n');
  p.push('  W("armjanus","janus_rocket",{range=430,reloadtime=10.5,areaofeffect=100,damage={default=700,vtol=90}})\n');

  // T2 Vehicles: expensive shots should remove priority targets, not erase swarms.
  p.push('  W("armcroc","arm_triton",{name="Amphibious Heavy Pulse Beam",weapontype="BeamLaser",gravityaffected=false,range=550,reloadtime=4.5,beamtime=0.22,areaofeffect=20,energypershot=300,weaponvelocity=2200,thickness=3.2,corethickness=0.3,rgbcolor="0.25 0.6 1",rgbcolor2="0.95 1 1",explosiongenerator="custom:laserhit-medium-blue",damage={default=720,vtol=65}})\n');
  p.push('  W("armlatnk","lightning",{range=330,burst=5,burstrate=0.05,reloadtime=3.2,energypershot=30,customparams={spark_maxunits="0",spark_range="0",spark_forkdamage="0"},damage={default=82}})\n');
  p.push('  W("armbull","arm_bull",{name="Heavy Breakthrough Beam",weapontype="BeamLaser",gravityaffected=false,range=500,reloadtime=4.5,beamtime=0.24,areaofeffect=20,energypershot=520,weaponvelocity=2400,thickness=4.0,corethickness=0.4,laserflaresize=7,rgbcolor="0.22 0.58 1",rgbcolor2="0.95 1 1",explosiongenerator="custom:laserhit-large-blue",damage={default=1200,vtol=120}})\n');
  p.push('  W("armgremlin","armgremlin_gauss",{name="Cloaked Assassin Beam",weapontype="BeamLaser",gravityaffected=false,range=320,reloadtime=7.5,beamtime=0.12,areaofeffect=8,energypershot=420,weaponvelocity=2600,thickness=2.6,corethickness=0.25,rgbcolor="0.3 0.7 1",rgbcolor2="1 1 1",explosiongenerator="custom:laserhit-medium-blue",damage={default=850,vtol=80}})\n');
  p.push('  W("armmart","arm_artillery",{range=900,reloadtime=6.5,areaofeffect=100,accuracy=90,damage={default=650,vtol=55}})\n');
  p.push('  W("armmerl","armtruck_rocket",{range=1450,reloadtime=22,areaofeffect=120,damage={default=3000,vtol=250}})\n');
  return wrapModule(p.join(""));
}
function buildCorLandLua(s){
  if(!s.landUnits||!s.corLand)return "";
  const p=[landHelpers()];
  p.push('  -- COR: armor, flame and blast pressure. Strong when committed; deliberately slower to reposition.\n');

  // Bots
  p.push('  U("corthud",{health=1300}) W("corthud","arm_ham",{areaofeffect=48,reloadtime=1.6,damage={default=120,vtol=20}})\n');
  p.push('  U("corpyro",{health=1250}) W("corpyro","flamethrower",{range=220,areaofeffect=64,reloadtime=1.15,burst=16,burstrate=0.05,firestarter=100,damage={default=21,subs=7}})\n');
  p.push('  U("corcan",{health=7500,speed=35}) W("corcan","cor_canlaser",{reloadtime=0.9,damage={default=330,vtol=60}})\n');
  p.push('  U("corsumo",{health=18500,speed=20}) W("corsumo","corsumo_weapon",{reloadtime=0.65,damage={default=360,vtol=75}})\n');
  p.push('  U("cormort",{health=1100}) W("cormort","cor_mort",{range=850,reloadtime=1.8,areaofeffect=72,edgeeffectiveness=0.28,damage={default=150,vtol=15}})\n');

  // T1 Vehicles
  p.push('  U("corgator",{health=950,speed=80}) W("corgator","gator_laserx",{range=225,reloadtime=0.72,beamtime=0.12,damage={default=82,vtol=15}})\n');
  p.push('  U("corgarp",{health=1650,speed=55}) W("corgarp","arm_pincer_gauss",{areaofeffect=20,reloadtime=1.55,damage={default=135,vtol=24}})\n');
  p.push('  U("corraid",{health=2350,speed=66}) W("corraid","arm_lightcannon",{areaofeffect=68,reloadtime=1.25,damage={default=125,vtol=24}})\n');
  p.push('  U("corlevlr",{health=1800,speed=36}) W("corlevlr","corlevlr_weapon",{range=320,reloadtime=2.0,areaofeffect=180,edgeeffectiveness=0.45,impulsefactor=2.8,damage={default=250,vtol=40}})\n');
  p.push('  U("corwolv",{health=900,speed=44}) W("corwolv","corwolv_gun",{range=730,reloadtime=7.5,areaofeffect=155,edgeeffectiveness=0.3,damage={default=430,vtol=45}})\n');

  // T2 Vehicles
  p.push('  U("corsala",{health=2500,speed=65}) W("corsala","cor_heat_laser",{range=350,reloadtime=1.15,burst=10,areaofeffect=56,damage={default=22}})\n');
  p.push('  U("correap",{health=6500,speed=58}) W("correap","cor_reap",{range=420,reloadtime=0.75,areaofeffect=84,damage={default=145,vtol=28}})\n');
  p.push('  U("corparrow",{health=7600,speed=44}) W("corparrow","cor_parrow",{range=590,reloadtime=2.0,areaofeffect=195,edgeeffectiveness=0.4,damage={default=490,vtol=80}})\n');
  p.push('  U("corgol",{health=10500,speed=31}) W("corgol","cor_gol",{range=650,reloadtime=4.0,areaofeffect=340,edgeeffectiveness=0.45,damage={default=1200,vtol=150}})\n');
  p.push('  U("corban",{health=3200,speed=49}) W("corban","banisher",{range=820,reloadtime=8.5,areaofeffect=165,edgeeffectiveness=0.4,damage={default=1250},customparams={area_onhit_ceg="fire-area-150-repeat",area_onhit_damageceg="burnflamel-gen",area_onhit_resistance="fire",area_onhit_damage="120",area_onhit_range="140",area_onhit_time="6"}})\n');
  p.push('  U("cormart",{health=1500,speed=52}) W("cormart","cor_artillery",{range=850,reloadtime=5.5,areaofeffect=190,edgeeffectiveness=0.35,damage={default=560,vtol=60}})\n');
  p.push('  U("corvroc",{health=1650}) W("corvroc","cortruck_rocket",{range=1340,reloadtime=17.5,areaofeffect=190,edgeeffectiveness=0.35,damage={default=2200},customparams={area_onhit_ceg="fire-area-100-repeat",area_onhit_damageceg="burnflamel-gen",area_onhit_resistance="fire",area_onhit_damage="80",area_onhit_range="100",area_onhit_time="5"}})\n');
  p.push('  U("cortrem",{health=3600,speed=34}) W("cortrem","tremor_spread_fire",{range=1470,reloadtime=0.55,areaofeffect=230,edgeeffectiveness=0.3,damage={default=230}})\n');
  return wrapModule(p.join(""));
}
function buildLegLandLua(s){
  if(!s.landUnits||!s.legLand)return "";
  const p=[landHelpers()];
  p.push('  -- LEG: sustained pressure. Frequent fire, heat-ray uptime and selected slowing tools reward continuous contact.\n');

  // Bots
  p.push('  W("leggob","semiauto",{range=280,burst=4,burstrate=0.07,reloadtime=0.55,damage={default=10,vtol=3}})\n');
  p.push('  W("leglob","close_plasma",{range=400,reloadtime=0.75,areaofeffect=24,damage={default=45,vtol=12}})\n');
  p.push('  W("legkark","heat_ray",{range=380,reloadtime=0.45,beamtime=0.35,damage={default=70,vtol=16}})\n');
  p.push('  W("legkark","legion_shotgun",{reloadtime=1.6,burst=2,burstrate=0.3,damage={default=12,vtol=4}})\n');
  p.push('  W("legstr","armmg_weapon",{range=300,burst=18,burstrate=0.045,reloadtime=0.25,damage={default=7,vtol=2}})\n');
  p.push('  W("legshot","legion_riot_cannon_t2",{range=300,reloadtime=1.5,areaofeffect=160,impulsefactor=3,damage={default=240,subs=90,vtol=35}})\n');
  p.push('  W("legsrail","railgunt2",{range=850,reloadtime=1.8,energypershot=180,damage={default=300,commanders=150}})\n');
  p.push('  W("legaheattank","heat_ray",{range=475,energypershot=18,damage={default=36,vtol=10},customparams={sweepfire_firetime="3.2",sweepfire_reloadtime="2.2",turretspeedx="65",turretspeedy="105"}})\n');

  // T1 Vehicles
  p.push('  W("leghades","legion_shotgun",{range=225,reloadtime=1.25,projectiles=5,damage={default=10,vtol=3}})\n');
  p.push('  W("leghades","gauss",{range=225,reloadtime=1.4,damage={default=55,vtol=15}})\n');
  p.push('  W("leghelios","heat_ray",{range=340,reloadtime=0.55,beamtime=0.38,damage={default=78,vtol=18}})\n');
  p.push('  W("leggat","armmg_weapon",{range=380,burst=10,burstrate=0.05,reloadtime=0.35,damage={default=9,vtol=3}})\n');
  p.push('  W("legbar","clusternapalm",{range=550,reloadtime=3.2,areaofeffect=105,damage={default=45,subs=8,vtol=8},customparams={area_onhit_damage="40",area_onhit_range="55",area_onhit_time="5"}})\n');
  p.push('  W("legrail","railgun",{range=680,reloadtime=1.6,energypershot=80,damage={default=85,commanders=45}})\n');
  p.push('  W("legamphtank","leg_amph_gauss",{range=325,reloadtime=0.75,damage={default=80,vtol=18}})\n');

  // T2 Vehicles
  p.push('  W("legmrv","quickshot_cannon",{range=260,burst=4,burstrate=0.12,reloadtime=1.3,areaofeffect=28,damage={default=45}})\n');
  p.push('  W("legaskirmtank","legmgplasma",{range=620,burst=5,burstrate=0.16,reloadtime=1.2,areaofeffect=52,damage={default=55}})\n');
  p.push('  W("legfloat","legfloat_gauss",{range=570,reloadtime=1.0,areaofeffect=24,damage={default=140}})\n');
  p.push('  W("legfloat","legfloat_gatling",{range=420,burst=8,burstrate=0.05,reloadtime=0.3,damage={default=6,vtol=2}})\n');
  p.push('  W("legmed","legmed_missile",{range=1000,burst=6,burstrate=0.25,reloadtime=6,areaofeffect=50,damage={default=320,commanders=160}})\n');
  p.push('  W("legamcluster","cluster_artillery",{range=930,reloadtime=3.2,areaofeffect=115,damage={default=220,subs=55,vtol=55},customparams={cluster_number="4"}})\n');
  p.push('  W("legamcluster","cluster_munition",{areaofeffect=95,damage={default=75,lboats=75,subs=14,vtol=14}})\n');
  p.push('  W("legavroc","armtruck_rocket",{range=1300,reloadtime=5.5,areaofeffect=120,damage={default=700,vtol=80}})\n');
  p.push('  W("leginf","rapidnapalm",{burst=8,burstrate=0.14,reloadtime=4.5,areaofeffect=130,damage={default=50,subs=12,vtol=12},customparams={area_onhit_damage="45",area_onhit_range="65",area_onhit_time="5"}})\n');

  if(s.legSlow){
    p.push('  local opts=(Spring.GetModOptions and Spring.GetModOptions()) or {} local emp=opts.emprework==true or opts.emprework==1 or opts.emprework=="1" or opts.emprework=="true"\n');
    p.push('  if emp then\n');
    p.push('    W("leghades","legion_shotgun",{paralyzer=true,paralyzetime=1,damage={default=14,vtol=4}})\n');
    p.push('    W("legkark","legion_shotgun",{paralyzer=true,paralyzetime=1,damage={default=18,vtol=6}})\n');
    p.push('    W("legshot","legion_riot_cannon_t2",{paralyzer=true,paralyzetime=1,damage={default=280,subs=110,vtol=40}})\n');
    p.push('  end\n');
  }
  return wrapModule(p.join(""));
}
function t3Helpers(withBuild){
  let s=landHelpers();
  if(withBuild){
    s+='  local function B(builder,target) local b=UnitDefs[builder] if not b or not UnitDefs[target] then return end b.buildoptions=b.buildoptions or {} for _,v in ipairs(b.buildoptions) do if v==target then return end end table.insert(b.buildoptions,target) end\n';
  }
  return s;
}
function buildArmT3Lua(s){
  if(!s.t3Units||!s.armT3)return "";
  const p=[t3Helpers(false)];
  p.push('  -- ARM T3: decisive charged volleys and priority-target deletion.\n');
  p.push('  U("armbanth",{health=72000,customparams={bossstaggermultiplier="2.2",bossStaggerMultiplier="2.2"}}) W("armbanth","tehlazerofdewm",{range=900,reloadtime=10,beamtime=0.9,areaofeffect=16,energypershot=2600,damage={default=9000,raptorqueen=10500,commanders=4000}}) W("armbanth","armbantha_fire",{range=520,reloadtime=2.4,areaofeffect=32,damage={default=1150,vtol=100}})\n');
  p.push('  U("armraz",{health=14000}) W("armraz","mech_rapidlaser",{range=520,burst=3,burstrate=0.08,reloadtime=2.6,beamtime=0.09,areaofeffect=16,energypershot=180,damage={default=380,vtol=55}})\n');
  p.push('  U("armmar",{health=5200}) W("armmar","armmech_cannon",{name="T3 Charged Amphibious Beam",weapontype="BeamLaser",gravityaffected=false,range=430,reloadtime=3.2,beamtime=0.18,areaofeffect=12,energypershot=360,weaponvelocity=2400,thickness=3,corethickness=0.3,rgbcolor="0.25 0.65 1",rgbcolor2="0.95 1 1",explosiongenerator="custom:laserhit-medium-blue",damage={default=820,vtol=80}})\n');
  p.push('  W("armvang","shocker_high",{range=1600,reloadtime=12,areaofeffect=160,accuracy=80,damage={default=2400,vtol=150}}) W("armvang","shocker_low",{range=1600,reloadtime=12,areaofeffect=160,accuracy=80,damage={default=2400,vtol=150}})\n');
  p.push('  U("armlun",{health=6000}) W("armlun","cannon",{range=650,reloadtime=4.5,areaofeffect=100,damage={default=900,vtol=80}}) W("armlun","armlun_rocket",{range=650,reloadtime=10,areaofeffect=96,damage={default=900,vtol=100}})\n');
  p.push('  U("armthor",{health=62000,customparams={bossstaggermultiplier="3.5",bossStaggerMultiplier="3.5"}}) W("armthor","thunder",{range=600,burst=6,burstrate=0.06,reloadtime=4.2,energypershot=180,customparams={spark_maxunits="0",spark_range="0",spark_forkdamage="0"},damage={default=180,raptorqueen=220}})\n');
  p.push('  U("armmeatball",{health=9500}) W("armmeatball","armmech_cannon",{range=1050,reloadtime=2.5,areaofeffect=16,damage={default=900,vtol=80}}) W("armmeatball","lrpc",{range=900,reloadtime=1.8,areaofeffect=64,damage={default=500,vtol=40}})\n');
  p.push('  U("armassimilator",{health=9000}) W("armassimilator","machinegun",{range=850,reloadtime=0.8,beamtime=0.12,areaofeffect=12,energypershot=100,damage={default=240,vtol=30}})\n');
  return wrapModule(p.join(""));
}
function buildCorT3Lua(s){
  if(!s.t3Units||!s.corT3)return "";
  const p=[t3Helpers(false)];
  p.push('  -- COR T3: slow moving fortresses, huge blast zones and fire saturation.\n');
  p.push('  U("corkorg",{health=175000,speed=32,customparams={bossstaggermultiplier="1.8",bossStaggerMultiplier="1.8"}}) W("corkorg","corkorg_laser",{range=925,reloadtime=4.5,beamtime=0.7,areaofeffect=80,damage={default=7200,raptorqueen=7600}}) W("corkorg","corkorg_fire",{range=620,reloadtime=1.2,areaofeffect=140,damage={default=240}}) W("corkorg","corkorg_rocket",{range=1000,reloadtime=6,areaofeffect=230,damage={default=1200},customparams={area_onhit_ceg="fire-area-100-repeat",area_onhit_damageceg="burnflamel-gen",area_onhit_resistance="fire",area_onhit_damage="90",area_onhit_range="100",area_onhit_time="5"}})\n');
  p.push('  U("corkarg",{health=16000,speed=40}) W("corkarg","karg_shoulder",{range=740,reloadtime=0.55,areaofeffect=28,damage={default=135}}) W("corkarg","super_missile",{range=640,reloadtime=0.32,areaofeffect=78,damage={default=220}})\n');
  p.push('  U("corjugg",{health=400000,speed=14}) W("corjugg","juggernaut_bottom",{reloadtime=0.28,areaofeffect=24,damage={default=90}}) W("corjugg","juggernaut_top",{reloadtime=0.45,areaofeffect=24,damage={default=185}}) W("corjugg","juggernaut_fire",{range=620,reloadtime=4,areaofeffect=100,damage={default=1600,raptorqueen=1800}})\n');
  p.push('  U("corshiva",{health=12000,speed=43}) W("corshiva","shiva_gun",{range=675,reloadtime=2.1,areaofeffect=210,edgeeffectiveness=0.4,damage={default=780}}) W("corshiva","shiva_rocket",{range=840,reloadtime=7,areaofeffect=90,damage={default=900},customparams={area_onhit_ceg="fire-area-100-repeat",area_onhit_damageceg="burnflamel-gen",area_onhit_resistance="fire",area_onhit_damage="80",area_onhit_range="95",area_onhit_time="5"}})\n');
  p.push('  U("corcat",{health=7200,speed=42}) W("corcat","exp_heavyrocket",{range=1400,burst=20,burstrate=0.12,reloadtime=14,areaofeffect=120,edgeeffectiveness=0.35,damage={default=520}})\n');
  p.push('  U("corsok",{health=5400}) W("corsok","corsok_laser",{range=775,reloadtime=5,areaofeffect=24,damage={default=950}})\n');
  p.push('  U("cordemon",{health=23000,speed=55}) W("cordemon","newdmaw",{range=550,reloadtime=0.36,burst=14,areaofeffect=150,damage={default=58}}) W("cordemon","dmaw",{range=550,reloadtime=0.06,burst=5,areaofeffect=150,damage={default=58}})\n');
  p.push('  U("corves",{health=120000,speed=20,maxthisunit=2,customparams={bossstaggermultiplier="2.2",bossStaggerMultiplier="2.2"}}) W("corves","corlevlr_weapon",{range=1100,reloadtime=5.5,areaofeffect=380,edgeeffectiveness=0.5,damage={default=9000,raptorqueen=9500}}) W("corves","banisher",{range=900,reloadtime=7,areaofeffect=170,damage={default=1300},customparams={area_onhit_ceg="fire-area-150-repeat",area_onhit_damageceg="burnflamel-gen",area_onhit_resistance="fire",area_onhit_damage="120",area_onhit_range="140",area_onhit_time="7"}})\n');
  return wrapModule(p.join(""));
}
function buildLegT3Lua(s){
  if(!s.t3Units||!s.legT3)return "";
  const p=[t3Helpers(false)];
  p.push('  -- LEG T3: continuous beam uptime, short firing cycles and suppression.\n');
  p.push('  U("legeheatraymech",{health=115000,customparams={bossstaggermultiplier="1.8",bossStaggerMultiplier="1.8"}}) W("legeheatraymech","heatray1",{range=850,reloadtime=0.033,beamtime=0.033,areaofeffect=90,damage={default=42,raptorqueen=48}}) W("legeheatraymech","ultraheavyriotcannon",{range=575,burst=3,burstrate=0.12,reloadtime=1.0,areaofeffect=150,damage={default=350}})\n');
  p.push('  U("legeallterrainmech",{health=10500}) W("legeallterrainmech","plasma_low",{range=1125,reloadtime=1.25,areaofeffect=105,damage={default=260}}) W("legeallterrainmech","plasma_high",{range=1125,reloadtime=1.25,areaofeffect=105,damage={default=260}})\n');
  p.push('  U("legjav",{health=8000}) W("legjav","mg_guns",{range=475,burst=18,burstrate=0.04,reloadtime=0.3,damage={default=10}})\n');
  p.push('  U("legelrpcmech",{health=19000}) W("legelrpcmech","shocker_low",{range=3100,burst=4,burstrate=0.18,reloadtime=4.8,areaofeffect=135,damage={default=320}})\n');
  p.push('  U("legehovertank",{health=5600}) W("legehovertank","heat_ray",{range=475,reloadtime=0.42,beamtime=0.28,areaofeffect=48,damage={default=70}})\n');
  p.push('  U("legerailtank",{health=18000}) W("legerailtank","t3_rail_accelerator",{range=1050,reloadtime=0.95,areaofeffect=48,energypershot=150,damage={default=320,raptorqueen=360}})\n');
  p.push('  U("legeshotgunmech",{health=24000}) W("legeshotgunmech","shotgun",{range=450,reloadtime=0.55,damage={default=42}}) W("legeshotgunmech","adv_rocket",{range=750,burst=12,burstrate=0.08,reloadtime=4.5,areaofeffect=82,damage={default=120}})\n');
  p.push('  U("legkeres",{health=23000}) W("legkeres","legkeres_cannon",{range=475,reloadtime=0.9,areaofeffect=165,damage={default=260}}) W("legkeres","legkeres_gatling",{range=510,burst=10,burstrate=0.045,reloadtime=0.28,damage={default=9}})\n');
  p.push('  U("legbunk",{health=10500}) W("legbunk","railgunt2",{range=700,reloadtime=1.25,areaofeffect=24,damage={default=220}})\n');
  p.push('  U("legapollyon",{health=65000,maxthisunit=2,customparams={bossstaggermultiplier="1.7",bossStaggerMultiplier="1.7"}}) W("legapollyon","legapollyon_gatling_big",{range=800,burst=8,burstrate=0.05,reloadtime=0.3,damage={default=48,raptorqueen=55}}) W("legapollyon","legapollyon_gatling_small",{burst=8,burstrate=0.05,reloadtime=0.3,damage={default=19}})\n');
  if(s.legSlow){
    p.push('  local opts=(Spring.GetModOptions and Spring.GetModOptions()) or {} local emp=opts.emprework==true or opts.emprework==1 or opts.emprework=="1" or opts.emprework=="true"\n');
    p.push('  if emp then W("legeshotgunmech","shotgun",{paralyzer=true,paralyzetime=1,damage={default=48}}) end\n');
  }
  return wrapModule(p.join(""));
}
function buildBossSupportLua(s){
  if(!s.t3Units||!s.bossSupport)return "";
  const p=[t3Helpers(true)];
  const stagger=Math.max(1,Number(s.bossSupportStagger)||4.5);
  const qbonus=Math.max(1,Number(s.bossSupportQueenBonus)||1.25);
  p.push('  -- Shared Scavenger boss support. Requires scavunitsforplayers so these UnitDefs are loaded.\n');
  p.push('  B("armshltx","armrattet4") B("corgant","armrattet4") B("leggant","armrattet4")\n');
  p.push('  B("armshltx","legsrailt4") B("corgant","legsrailt4") B("leggant","legsrailt4")\n');
  p.push('  B("armshltx","leggobt3") B("corgant","leggobt3") B("leggant","leggobt3")\n');
  p.push('  U("armrattet4",{health=120000,speed=20,maxthisunit=1,autoheal=30,customparams={bossstaggermultiplier="2",bossStaggerMultiplier="2"}}) W("armrattet4","arm_bosscannon",{range=1050,reloadtime=1.7,areaofeffect=260,damage={default=1100,raptorqueen=1300}})\n');
  p.push('  U("legsrailt4",{health=45000,speed=20,maxthisunit=2,customparams={bossstaggermultiplier="'+stagger+'",bossStaggerMultiplier="'+stagger+'"}}) W("legsrailt4","railgunt2",{range=1650,reloadtime=5.5,areaofeffect=16,energypershot=900,damage={default=6500,raptorqueen='+Math.round(6500*qbonus)+',commanders=2500}})\n');
  p.push('  U("leggobt3",{health=18000,maxthisunit=4,customparams={bossstaggermultiplier="1.5",bossStaggerMultiplier="1.5"}}) W("leggobt3","semiauto",{range=525,burst=4,burstrate=0.07,reloadtime=0.7,damage={default=120,raptorqueen='+Math.round(120*qbonus)+'}})\n');
  return wrapModule(p.join(""));
}

function buildUltimateLua(s){
  if(!s.ultimate)return "";
  const p=[];
  const mode=esc(s.teamColorMode||"hybrid");
  const tag=(kind)=>s.teamColorFx?'{pve_ultimate="1",pve_teamcolor_fx="'+kind+'",pve_teamcolor_fx_mode="'+mode+'"}':'{pve_ultimate="1"}';
  p.push('  local function U(n,t) local d=UnitDefs[n] if not d then return end for k,v in pairs(t) do if k=="customparams" then d.customparams=d.customparams or {} for ck,cv in pairs(v) do d.customparams[ck]=cv end else d[k]=v end end end\n');
  p.push('  local function W(n,k,t) local d=UnitDefs[n] local w=d and d.weapondefs and d.weapondefs[k] if not w then return end for a,v in pairs(t) do if a=="damage" then w.damage=w.damage or {} for dk,dv in pairs(v) do w.damage[dk]=dv end elseif a=="customparams" then w.customparams=w.customparams or {} for ck,cv in pairs(v) do w.customparams[ck]=cv end else w[a]=v end end end\n');
  p.push('  local function T(n) local d=UnitDefs[n] if d and d.weapons and d.weapons[1] then d.weapons[1].badtargetcategory="" end end\n');

  p.push('  U("armvulc",{maxthisunit=1,customparams='+tag("arm_beam")+'})\n');
  p.push('  W("armvulc","rflrpc",{name="PvE Ragnarok Sustained Beam",weapontype="BeamLaser",gravityaffected=false,range='+Math.round(s.armUltRange)+',reloadtime='+s.armUltReload+',beamtime='+s.armUltBeam+',areaofeffect='+Math.round(s.armUltAoe)+',edgeeffectiveness=0.2,energypershot=125000,weaponvelocity=2200,largebeamlaser=true,thickness=8,corethickness=0.5,laserflaresize=10,texture3="largebeam",tilelength=150,scrollspeed=5,rgbcolor="0.25 0.65 1",rgbcolor2="0.85 0.95 1",explosiongenerator="custom:laserhit-large-blue",damage={default='+Math.round(s.armUltDamage)+',shields='+Math.round(s.armUltDamage*.5)+',subs=0},customparams='+tag("arm_beam")+'}) T("armvulc")\n');

  p.push('  U("corbuzz",{maxthisunit=1,customparams='+tag("cor_inferno")+'})\n');
  p.push('  W("corbuzz","rflrpc",{name="PvE Calamity Inferno Cannon",range='+Math.round(s.corUltRange)+',reloadtime='+s.corUltReload+',areaofeffect='+Math.round(s.corUltAoe)+',edgeeffectiveness=0.45,energypershot=25000,rgbcolor="1 0.35 0.05",damage={default='+Math.round(s.corUltDamage)+',shields='+Math.round(s.corUltDamage*.5)+',subs='+Math.round(s.corUltDamage*.3)+'},customparams={pve_ultimate="1",pve_teamcolor_fx="'+(s.teamColorFx?"cor_inferno":"")+'",pve_teamcolor_fx_mode="'+mode+'",area_onhit_ceg="fire-area-150-repeat",area_onhit_damageceg="burnflamexl-gen",area_onhit_resistance="fire",area_onhit_damage="'+Math.round(s.corUltFireDps)+'",area_onhit_range="'+Math.round(s.corUltFireRange)+'",area_onhit_time="'+Math.round(s.corUltFireTime)+'"}}) T("corbuzz")\n');

  p.push('  U("legstarfall",{maxthisunit=1,customparams='+tag("leg_heatray")+'})\n');
  p.push('  W("legstarfall","starfire",{name="PvE Starfall Heat-Ray Array",weapontype="BeamLaser",gravityaffected=false,highTrajectory=0,accuracy=0,range='+Math.round(s.legUltRange)+',burst='+Math.max(1,Math.round(s.legUltBurst))+',burstrate='+s.legUltBurstRate+',reloadtime='+s.legUltReload+',beamtime='+s.legUltBeam+',areaofeffect='+Math.round(s.legUltAoe)+',edgeeffectiveness=0.45,energypershot=360000,weaponvelocity=1800,largebeamlaser=true,thickness=6,corethickness=0.35,laserflaresize=7,texture3="largebeam",tilelength=120,scrollspeed=4,rgbcolor="1 0.55 0.1",rgbcolor2="1 0.92 0.5",explosiongenerator="custom:heatray-huge",damage={default='+Math.round(s.legUltDamage)+',shields='+Math.round(s.legUltDamage*.4)+',subs=0},customparams='+tag("leg_heatray")+'}) T("legstarfall")\n');
  return wrapModule(p.join(""));
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
  push(8,"终极武器 V1",buildUltimateLua(s));
  push(10,"ARM 地面兵种 · 蓄能激光",buildArmLandLua(s));
  push(11,"COR 地面兵种 · 重装火力",buildCorLandLua(s));
  push(12,"LEG 地面兵种 · 持续压制",buildLegLandLua(s));
  push(13,"ARM T3 · 蓄能决战",buildArmT3Lua(s));
  push(14,"COR T3 · 移动要塞",buildCorT3Lua(s));
  push(15,"LEG T3 · 持续压制",buildLegT3Lua(s));
  push(16,"公共 Boss 补位 · Scavenger",buildBossSupportLua(s));
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
  if($("ultimatePreview")){
    const ult=buildUltimateLua(getConfig());
    $("ultimatePreview").textContent=ult||"-- 终极武器模块未启用";
  }
  if($("landPreview")){
    const s=getConfig();
    const parts=[
      ["tweakdefs10 · ARM",buildArmLandLua(s)],
      ["tweakdefs11 · COR",buildCorLandLua(s)],
      ["tweakdefs12 · LEG",buildLegLandLua(s)]
    ].filter(x=>x[1]).map(x=>"-- "+x[0]+"\n"+x[1]);
    $("landPreview").textContent=parts.join("\n\n")||"-- 地面兵种模块未启用";
  }
  if($("t3Preview")){
    const s=getConfig();
    const parts=[
      ["tweakdefs13 · ARM T3",buildArmT3Lua(s)],
      ["tweakdefs14 · COR T3",buildCorT3Lua(s)],
      ["tweakdefs15 · LEG T3",buildLegT3Lua(s)],
      ["tweakdefs16 · Boss 补位",buildBossSupportLua(s)]
    ].filter(x=>x[1]).map(x=>"-- "+x[0]+"\n"+x[1]);
    $("t3Preview").textContent=parts.join("\n\n")||"-- T3 模块未启用";
  }
}
CONFIG_IDS.forEach(id=>$(id)?.addEventListener("input",renderConfig));
$("openPlayerDefense")?.addEventListener("click",()=>switchTab("players"));
$("openUltimate")?.addEventListener("click",()=>switchTab("ultimate"));
$("openLand")?.addEventListener("click",()=>switchTab("land"));
$("openT3")?.addEventListener("click",()=>switchTab("t3"));
$("copyArmT3")?.addEventListener("click",()=>{const lua=buildArmT3Lua(getConfig());copyText(lua?"!bset tweakdefs13 "+encode64(lua):"-- ARM T3 模块未启用",$("copyArmT3"))});
$("copyCorT3")?.addEventListener("click",()=>{const lua=buildCorT3Lua(getConfig());copyText(lua?"!bset tweakdefs14 "+encode64(lua):"-- COR T3 模块未启用",$("copyCorT3"))});
$("copyLegT3")?.addEventListener("click",()=>{const lua=buildLegT3Lua(getConfig());copyText(lua?"!bset tweakdefs15 "+encode64(lua):"-- LEG T3 模块未启用",$("copyLegT3"))});
$("copyBossSupport")?.addEventListener("click",()=>{const lua=buildBossSupportLua(getConfig());copyText(lua?"!bset tweakdefs16 "+encode64(lua):"-- Boss 补位模块未启用",$("copyBossSupport"))});
$("copyArmLand")?.addEventListener("click",()=>{const lua=buildArmLandLua(getConfig());copyText(lua?"!bset tweakdefs10 "+encode64(lua):"-- ARM 地面兵种模块未启用",$("copyArmLand"))});
$("copyCorLand")?.addEventListener("click",()=>{const lua=buildCorLandLua(getConfig());copyText(lua?"!bset tweakdefs11 "+encode64(lua):"-- COR 地面兵种模块未启用",$("copyCorLand"))});
$("copyLegLand")?.addEventListener("click",()=>{const lua=buildLegLandLua(getConfig());copyText(lua?"!bset tweakdefs12 "+encode64(lua):"-- LEG 地面兵种模块未启用",$("copyLegLand"))});
$("copyEmpRework")?.addEventListener("click",()=>copyText("!bset emprework true",$("copyEmpRework")));
$("copyUltimateLua")?.addEventListener("click",()=>copyText(buildUltimateLua(getConfig())||"-- 终极武器模块未启用",$("copyUltimateLua")));
$("copyUltimateCmd")?.addEventListener("click",()=>{const lua=buildUltimateLua(getConfig());copyText(lua?"!bset tweakdefs8 "+encode64(lua):"-- 终极武器模块未启用",$("copyUltimateCmd"))});
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