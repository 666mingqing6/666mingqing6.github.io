---
title: "Fastboot 刷机/配置指南：从入门到精通"
date: 2026-03-07 08:59:41
updated: 2026-03-07 08:59:41
categories:
  - [Android, 玩机 , 技术类文档]
tags:
  - Fastboot
  - Android
  - 刷机
  - 教程
  - 技术类文档
description: "Fastboot 刷机完全指南，涵盖模式进入、工具配置、常用命令及安全刷机流程。"
toc: true
comments: true
---

## 什么是 Fastboot？

Fastboot 是 Android 官方提供的一种刷机模式，用于在设备处于 Fastboot 模式时与计算机进行通信。与 9008（Qualcomm）或 BROM（MTK）等底层协议相比，Fastboot 工作在更高的软件层级，主要用于刷写系统分区、恢复出厂设置、解锁 Bootloader 等操作。 但无法像9008类似的深刷模式 可以随意刷写所有底层分区

{% note info %}
**Tips**: 
现代主流安卓设备多使用 super 分区，这个分区里面聚合了所有系统分区(如system vendor product system_ext odm)，而不再像从前一样 每个系统分区独立。  

如果你的刷机包是散包的话（即 你的设备是 super 分区，但是你的刷机包只提供了super分区里面的所有独立的系统分区），则这些独立的分区**不能在 Fastboot 模式下进行刷写**，必须在 Fastboot**d**（Recovery 中的“Enter fastboot”选项）模式下进行刷写。普通 Fastboot 模式下尝试刷写 super 内的独立分区会报错（如 "partition doesn't exist" 或 "dynamic partition not found"）。
{% endnote %}

### Fastboot 的主要用途

- **系统刷写**：刷入新的系统镜像、Recovery、Boot 分区
- **Bootloader 解锁/锁定**：解锁或重新锁定设备的 Bootloader
- **分区操作**：格式化、擦除或写入特定分区
- **设备信息查询**：获取设备状态、分区信息等
- **出厂重置**：恢复设备到出厂状态
- **固件升级**：刷入官方或第三方固件

---

## 第一步：准备工作

Fastboot 工具包含在 Android Platform-Tools 包中，与 ADB 在同一个工具包里。

**详细配置教程请到：[ADB 配置指南](/post/howtouseadb/)**

该教程包含了 Platform-Tools 的完整下载、解压和环境变量配置步骤。

**重要提醒（Windows 用户必看）**  
对于所有安卓设备，进入 Fastboot 模式后与 Windows 电脑连接，并不是只需要配置一下 Google 提供的 Platform-Tools 就行了，而是需要额外打上 USB 驱动，否则 `fastboot devices` 将无法识别设备或命令执行失败。

**Fastboot USB 驱动安装**  
对于连接至 Fastboot，我们只需要打一个驱动就好了：  

[安卓 Fastboot USB 驱动下载指引](https://lsdy.top/azqddownload)  
![image](https://tu.646474.xyz/1772848361961.png)

**小米设备专属操作：安装小米 Fastboot 3.0 补丁**  
安装完上述驱动后，对于小米设备还需另外操作，我们需要打上小米 Fastboot 3.0 补丁。

**安装小米 USB 3.0 补丁**（以管理员身份运行 CMD 窗口，执行以下命令）：
```cmd
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "osvc" /t REG_BINARY /d "0000" /f && reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "SkipContainerIdQuery" /t REG_BINARY /d "01000000" /f && reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "SkipBOSDescriptorQuery" /t REG_BINARY /d "01000000" /f
```

**卸载小米 USB 3.0 补丁**（如需还原，以管理员身份运行 CMD 窗口，执行以下命令）：
```cmd
reg delete "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "osvc" /f && reg delete "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "SkipContainerIdQuery" /f && reg delete "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100" /v "SkipBOSDescriptorQuery" /f
```

{% note info %}
**Tips**: 安装完驱动 或者 打完USB3.0补丁之后 务必重启电脑并重新插拔 USB 数据线 这样才能生效
{% endnote %}

---

## 第二步：进入 Fastboot 模式

### 方法一：通过 ADB 命令进入

ADB配置详情请参见：[ADB 配置指南](/post/howtouseadb/)

将设备与电脑通过ADB连接后 打开 CMD, 执行：

```cmd
adb reboot bootloader
```

设备会自动重启并进入 Fastboot 模式

### 方法二：物理按键组合进入

- 绝大多数 Android 设备：**关机后**/**开机时** 同时按住 音量**上** + 电源键

{% note info %}
**Tip**: 使用硬件组合进入FB，在设备跳出FB界面后 应**先松开**电源键**后松开**音量**上**。因为默认选项是“Start”(启动) 进入FB模式后 如果再按一次电源键 则会选择这个选项  导致设备进入FB后又直接重启至系统  
{% endnote %}

### 确认进入成功

成功进入 Fastboot 模式后：

- 屏幕会显示的 Fastboot 界面
![image](https://tu.646474.xyz/1772849296931.png)
![image](https://tu.646474.xyz/1772848459377.jpg)

**快速验证：**  
- 电脑会识别到设备（设备管理器显示 "Android Bootloader Interface" 或 "Android ADB Interface"）
```cmd
fastboot devices
```
如果显示设备信息，说明配置成功 设备已在fastboot模式下正常连接到电脑！

![image](https://tu.646474.xyz/1772850850481.png)

---

## 常用 Fastboot 命令详解

### 设备状态查询

#### 1. 查看设备信息

```cmd
fastboot devices
```

显示已连接的 Fastboot 设备

#### 2. 获取设备变量

```cmd
fastboot getvar all
```

显示设备的所有信息（版本、解锁状态等）

```cmd
fastboot getvar version-bootloader
```

获取 Bootloader 版本

```cmd
fastboot getvar unlocked
```

检查 Bootloader 是否已解锁

### Bootloader 操作

#### 3. 解锁 Bootloader

**⚠️ 警告：解锁 Bootloader 会清除所有数据，请先备份！**

```cmd
fastboot flashing unlock
```

或

```cmd
fastboot oem unlock
```

设备屏幕会显示确认提示，需要用音量键选择 **YES**

![image](https://tu.646474.xyz/1772851340985.webp)

#### 4. 锁定 Bootloader

```cmd
fastboot flashing lock
```

或

```cmd
fastboot oem lock
```

### 分区操作

#### 5. 刷写系统镜像

```cmd
fastboot flash boot boot.img
```

刷写 Boot 分区

```cmd
fastboot flash system system.img
```

刷写 System 分区
{% note info %}
**Tips**: 
现代主流安卓设备多使用 super 分区，这个分区里面聚合了所有系统分区(如system vendor product system_ext odm)，而不再像从前一样 每个系统分区独立。  

如果你的刷机包是散包的话（即 你的设备是 super 分区，但是你的刷机包只提供了super分区里面的所有独立的系统分区），则这些独立的分区**不能在 Fastboot 模式下进行刷写**，必须在 Fastboot**d**（Recovery 中的“Enter fastboot”选项）模式下进行刷写。普通 Fastboot 模式下尝试刷写 super 内的独立分区会报错（如 "partition doesn't exist" 或 "dynamic partition not found"）。
{% endnote %}


```cmd
fastboot flash recovery recovery.img
```

刷写 Recovery 分区

#### 6. 擦除分区

```cmd
fastboot erase system
```

擦除 System 分区

```cmd
fastboot erase userdata
```

擦除用户数据分区（恢复出厂设置）

```cmd
fastboot erase cache
```

擦除缓存分区

#### 7. 格式化分区

```cmd
fastboot format system
```

格式化 System 分区

```cmd
fastboot format userdata
```

格式化用户数据分区

### 设备控制

#### 8. 重启设备

```cmd
fastboot reboot
```

重启到正常系统

```cmd
fastboot reboot-bootloader
```

重启回到 Fastboot 模式 (重启fastboot)

#### 9. 继续引导

```cmd
fastboot continue
```

继续正常启动过程

---

## 完整刷机流程示例

### 刷写第三方 Recovery（TWRP）

1. 下载对应设备的 TWRP 镜像文件（.img 格式）

2. 进入 Fastboot 模式

3. 刷写 Recovery：

```cmd
fastboot flash recovery twrp.img
```

4. 重启到 Recovery：

```cmd
fastboot boot twrp.img
```

### 刷写完整 ROM

1. 下载完整的 ROM 包（通常包含多个 .img 文件）

2. 解锁 Bootloader（如果需要）

3. 依次刷写各个分区：

```cmd
fastboot flash boot boot.img
fastboot flash system system.img
fastboot flash vendor vendor.img
fastboot flash dtbo dtbo.img
...
```

4. 擦除数据分区（可选）：

```cmd
fastboot erase userdata
fastboot erase cache
```

5. 重启设备：

```cmd
fastboot reboot
```

---

## 高级用法

### 批量刷写

创建批处理文件 `flash.bat`（Windows）：

```batch
@echo off
echo 正在刷写 Boot 分区...
fastboot flash boot boot.img
echo 正在刷写 System 分区...
fastboot flash system system.img
echo 正在刷写 Vendor 分区...
fastboot flash vendor vendor.img
echo 刷写完成，重启设备...
fastboot reboot
pause
```

### 条件判断

```cmd
fastboot getvar unlocked 2>&1 | findstr "yes" >nul
if %errorlevel%==0 (
    echo Bootloader 已解锁
) else (
    echo Bootloader 未解锁
)
```

---

## Q&A 常见问题排查

**问：fastboot devices 显示设备但无法操作**

答：可能是驱动问题。确保安装了正确的 USB 驱动，或使用 Android SDK 的驱动包。

**问：fastboot flash 提示 "FAILED (remote: partition table doesn't exist)"**

答：分区表不存在，可能需要先解锁 Bootloader 或刷入正确的分区表。

**问：设备卡在 Fastboot 模式**

答：尝试 `fastboot reboot` 或长按电源键强制重启。如果无效，可能需要电池断电重启。

**问：刷机后设备无法开机**

答：可能是镜像文件损坏或不兼容。尝试刷回官方固件，或进入 Recovery 模式检查。

**问：解锁 Bootloader 失败**

答：某些设备（如华为、小米）需要先获取解锁码。访问设备官网申请解锁权限。

---

## 安全提醒

1. **备份数据**：刷机前务必备份重要数据
2. **选择正确镜像**：确保下载的 ROM 与你的设备型号完全匹配
3. **官方优先**：优先使用官方固件，第三方固件存在风险
4. **充电充足**：刷机过程中确保设备电量充足（>50%）
5. **网络备份**：准备好恢复出厂设置的途径

---

## 总结

Fastboot 是 Android 刷机的重要工具，相比底层协议更加安全易用。掌握以上内容，你就能：

✓ 安全进入和退出 Fastboot 模式  
✓ 进行基本的刷机操作  
✓ 解锁和锁定 Bootloader  
✓ 处理常见的刷机问题  

Fastboot 为 Android 玩机提供了无限可能，但也伴随着风险。谨慎操作，所以我仍建议你在正式开始操作前，提前备份数据、系统分区。如果遇到问题，请在论坛求助具体机型指南。享受刷机乐趣！

---

## 参考资料

<a class="custom-link-card" href="https://lsdy.top/" target="_blank">
  <img src="https://lsdy.top/images/lsdy.ico" alt="lsdy">
  <div class="custom-link-info">
    <span class="custom-link-title">流水断崖</span>
    <span class="custom-link-desc">简洁、实用、易用、无广告，为中国软件生态尽一份绵薄之力</span>
  </div>
</a>

<a class="custom-link-card" href="https://blog.csdn.net/qq_35606400/article/details/138213650" target="_blank">
  <img src="https://blog.csdn.net/favicon.ico" alt="lsdy">
  <div class="custom-link-info">
    <span class="custom-link-title">CSDN</span>
    <span class="custom-link-desc">小米线刷USB3.0问题|小米线刷USB3.0补丁</span>
  </div>
</a>

<a class="custom-link-card" href="https://source.android.com/docs/setup/test/running?hl=zh-cn" target="_blank">
  <img src="https://www.faviconextractor.com/favicon/developer.android.com?larger=true" alt="Google">
  <div class="custom-link-info">
    <span class="custom-link-title">Google-Android-Source</span>
    <span class="custom-link-desc">使用 fastboot 刷写</span>
  </div>
</a>

<a class="custom-link-card" href="https://android.gadgethacks.com/how-to/complete-guide-flashing-factory-images-android-using-fastboot-0175277/" target="_blank">
  <img src="https://www.faviconextractor.com/favicon/android.gadgethacks.com?larger=true" alt="Gadget">
  <div class="custom-link-info">
    <span class="custom-link-title">Gadget-Hacks</span>
    <span class="custom-link-desc">"The Complete Guide to Flashing Factory Images on Android Using Fastboot"</span>
  </div>
</a>