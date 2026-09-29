---
title: BAR Tweak 能力清单
icon: gamepad
order: 1
---

# BAR 仅 TweakDefs / TweakUnits 能力清单

本页以 **Beyond All Reason 官方 master** 为主要参考，个人分支仅用于兼容性核对。记录当前低单位数 PVE 方案在 **不新增、不修改 Gadget / LuaRules** 前提下，可依靠房间 `tweakdefs` / `tweakunits` 完成的能力与边界。

## 已确认可利用的能力

- **精英化**：修改生命、伤害、射程、速度和武器参数，并通过 `maxThisUnit` 限制某个 UnitDef 的实际场上存量。
- **职业虫族**：Raptor Custom Squads 支持 `raider`、`berserk`、`skirmisher`、`healer`、`artillery`、`kamikaze`。
- **职业拾荒者**：Scavenger 侧也提供 Custom Squads 与对应行为参数。
- **巨兽化**：T4 Raptor 和 Matriarch 可直接重做为少量高威胁单位。
- **虫卵经济**：Raptor Egg 本身可回收，死亡虫子的 `metalCost` 会影响掉落资源价值。
- **机动迎击**：Berserk 行为被攻击后存在追击攻击者位置的响应，可形成弱仇恨/拉怪玩法。
- **Queen Boss 分工**：玩家单位可以通过 `bossStaggerMultiplier` 改变对 Queen 硬直条的贡献。

## 硬限制

1. 原版 `raptor_spawn_defs.lua` 的 Squad `count` 不属于 UnitDef，纯 tweak 无法逐波精确重写，因此低单位数方案主要通过 `maxThisUnit` 压制实际存量。
2. 纯 tweak 无法可靠实现“Boss A 被击杀后立即生成 Boss B”的事件触发链。
3. UnitDef 修改是全局的，同一个 UnitDef 不能天然只强化某一个任意玩家。
4. Custom Squad 更适合定义“某个 UnitDef × N”的刷怪项；复杂混编主要复用原版已有 Squad。
5. Raptor Egg 的掉落概率和衰减算法仍位于 Gadget，纯 tweak 更适合调整其经济价值，而不是彻底重写掉落机制。

## 在线配置器

打开 [BAR PVE Tweak Configurator](/bar-mod/)。

第一版提供精英化、职业虫族、巨兽、虫卵经济、机动迎击和 Queen Boss 参数，并生成可复制的 `!bset tweakdefs0 ...` 命令。

## 参考代码

- [Beyond All Reason 官方仓库](https://github.com/beyond-all-reason/Beyond-All-Reason)
- [GodAlone945/Beyond-All-Reason（兼容性核对）](https://github.com/GodAlone945/Beyond-All-Reason)
- [Community NuttyB](https://github.com/nuttyb-community/nuttyb)

后续每增加一种玩法，只把已经在 BAR 当前代码里验证过的 UnitDef / CustomParams / WeaponDef 能力加入本表。
