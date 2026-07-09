---
title: "LSPosed 停更后，如何选择衍生分支版本？"
date: 2025-12-05 20:41:37
updated: 2026-02-22 06:45:00
tags:
  - LSPosed
  - 玩机指南
categories:
  - [Android, 玩机 , 指南类文档]
keywords:
  - LSPosed
  - Xposed
  - LSPosed 衍生分支
  - LSPosed 停更
  - 玩机指南
  - Android 模块
description: "LSPosed 官方停更后，如何选择可靠的衍生分支？详细对比各主流分支的优缺点、安装方法及注意事项，帮助你安全玩机"
comments: true
toc:
  enable: true
  number: true
sidebar: true
copyright: true
# mathjax: true  # 已移除 — 文章无数学公式，避免无效加载
---

![LSPosed 停更后，如何选择衍生分支版本？](https://tu.646474.xyz/1765609810321.jpeg)

<!-- more -->

# LSPosed 停更后，如何选择衍生分支版本？
2024年，手机极客圈著名工具程序LSPosed的开发组宣布，由于受到PixelProps开发组一位作者的谣言、诽谤、种族主义辱骂和诅咒，导致心累而停更。同组旗下工具如Shamiko、Zygisk Next和LSPatch也一并停更。这如同多米诺骨牌效应，直接导致依赖LSPosed框架的许多模块作者停更，甚至于一些 XP模块 StatusBarLyric、BootloaderSpoofer等 也停更了。甚至一些非依赖项目，如搞机助手R、KernelSU和Mrepo，也选择了停更。
![LSP作者遭受辱骂的图片](https://tu.646474.xyz/1766065476548.jpg "LSP作者遭受辱骂的图片")
本篇文章重点讨论LSPosed官方版停更后衍生出的分支版本：LSPosed-Irena、LSPosed-JingMatrix和LSPosed-IT。我们该如何选择？
## 推荐版本：LSPosed-Irena
我个人最推荐LSPosed-Irena。它是目前社区最受欢迎的分支，优点是稳定性极高，几乎没有问题。缺点是更新速度较慢，通常间隔几个月，在测试稳定后才发布。
**下载链接**：  
[LSPosed-Irena GitHub](https://github.com/re-zero001/LSPosed-Irena)  [LSPosed-Irena Telegram](https://t.me/lsposed_irena)
**提示**：对于Git获取方式 请登录你的GitHub账号后，在链接中的“Actions”栏中下载。
## LSPosed-IT（官方内测版）
LSPosed-IT是官方维护的内部测试版。尽管官方宣布停更，但内测版仍在更新。它功能最新、隐藏性最佳，但作为内测版，稳定性有待考证。有些版本曾出现功能不稳定问题，不过大多数版本表现良好。
**下载提示**：LSPosed-IT是官方内测版本，只有拥有内测账号的人员才有下载链接。如果内测人员未经授权泄露，将被永久拉黑群组。网上看到的IT版本通常是泄露的，泄露者可能被封禁。因此，这里不贴官方下载链接。如果你想加入内测群组，请自行上网搜索加入方法（名额有限，条件严苛）。
然后的话 如果你想要加入内部测试群组   请自行上网搜索 加入方法    本文仅探讨 “如何选择LSP”
内部测试 名额有限  并且加入条件非常严苛 所以呢 如果你有那个时间去 研究怎么 加入内部测试群组的话 不如，建议看看这个Telegram频道：  
[LSPosed IT Leaks](https://t.me/LSP_Leaks)  
这是一个第三方爱好者创建的频道，搜集并聚合网上所有IT泄露版本。渠道多样，纯公益性质，许多人从这里获取版本。

2026.01.21 更新
![LSP作者通知加入时间验证](https://tu.646474.xyz/1771954387685.png "LSP作者通知加入时间验证")
如图所示，LSP官方在7470及以后版本 加入了联网时间验证 这导致了我们无法再获取更新的泄露版本 所以最新的泄露版本停留在 7467。
**Tips**：如果你使用IT泄露版本，安装模块后会提示更新——千万不要更新！否则会覆盖成已停更的旧Release版本。
## LSPosed-JingMatrix
JM版本早期有诸多槽点，被社区吐槽严重，常出现大小问题。例如，西米露模块作者曾因JM版问题而排查良久，最终发现是LSP-JM导致的，并发通知：  
![西米露模块作者通知图片](https://tu.646474.xyz/1766065558737.jpg "西米露模块作者通知图片")
不过，JM作者听劝，被骂惨后积极修复，仿照LSPosed-Irena进行了优化。目前最新版本暂无明显槽点。
**Tips**：你可以批评JM的代码（如“屎山”），但 请不要人身攻击他——JM本人比较听劝，只是代码技术有待提升。由于历史事件，我个人不敢用JM版，如果你想试试，我也不建议。
**下载链接**：  
[LSPosed-JingMatrix GitHub](https://github.com/JingMatrix/LSPosed)  
**提示**：可直接从Releases处下载。
## 总结与选择建议
- **追求最新功能和折腾**：如果你有官方内测账号，且接受稳定性风险，选择LSPosed-IT。
- **追求稳定性**：推荐LSPosed-Irena。
- **总体排序**：LSPosed-IT > LSPosed-Irena > LSPosed-JingMatrix。