---
title: "ADB 终极指南：从环境配置到进阶命令" 
# 相比“如何正确使用ADB？”，这个标题更具吸引力和技术张力。如果你更喜欢原标题，直接改回去即可。
date: 2026-03-06 17:41:32
updated: 2026-03-06 17:41:32
categories:
  - [Android, 玩机]  # 采用多级分类：主分类 Android，子分类 玩机，结构更清晰
tags:
  - ADB
  - Android
  - 教程
# 将“技术类文档”改为“教程”，标签尽量简短干练，方便日后检索
description: "一篇 ADB 避坑指南，涵盖基础环境配置、常用命令速查及设备调试进阶技巧。"
# 添加 description 会在博客首页作为文章摘要显示，而不用显示正文开头那一堆杂乱的文字
toc: true       # 明确开启侧边栏目录 (技术长文必备)
comments: true  # 明确开启评论区
---

## 什么是 ADB？

ADB (Android Debug Bridge) 是 Android Google官方提供的一款命令行工具，用于与 Android 设备建立通信连接。它是 Android SDK 的一部分，允许开发者和进阶用户通过计算机与手机进行数据交互，执行调试、应用安装、文件传输等操作。

### ADB 的主要作用

- **应用安装与管理**：直接安装 APK 文件，卸载应用，获取已安装应用列表
- **文件传输**：在电脑和手机之间进行文件的上传和下载
- **日志调试**：查看系统日志和应用崩溃信息，便于问题诊断
- **Shell 命令执行**：在手机上执行 Shell 命令，进行系统操作
- **屏幕投屏与控制**：将手机屏幕镜像到电脑
- **设备信息获取**：查询设备属性、系统版本、序列号等信息
- **无线调试**：通过 WiFi 无线连接手机进行开发测试

---

## 第一步：下载 Platform-Tools

Platform-Tools 是包含 ADB 的官方工具包。

### 方法一：从 Google 官方下载（推荐）

#### 直接下载链接

虽然这些链接不会发生变化，但它们始终指向最新版本的工具。

**官方直链：**

- **Windows**：[下载适用于 Windows 的 SDK Platform-Tools](https://dl.google.com/android/repository/platform-tools-latest-windows.zip)
- **Mac**：[下载适用于 Mac 的 SDK Platform-Tools](https://dl.google.com/android/repository/platform-tools-latest-darwin.zip)
- **Linux**：[下载适用于 Linux 的 SDK Platform-Tools](https://dl.google.com/android/repository/platform-tools-latest-linux.zip)

**中国用户反代链接：**（如果无法访问 Google 服务器）

- **Windows**：[下载适用于 Windows 的 SDK Platform-Tools](https://proxy.646474.xyz/https://dl.google.com/android/repository/platform-tools-latest-windows.zip)
- **Mac**：[下载适用于 Mac 的 SDK Platform-Tools](https://proxy.646474.xyz/https://dl.google.com/android/repository/platform-tools-latest-darwin.zip)
- **Linux**：[下载适用于 Linux 的 SDK Platform-Tools](https://proxy.646474.xyz/https://dl.google.com/android/repository/platform-tools-latest-linux.zip)

**从Google官贴下载**

<a class="custom-link-card" href="https://developer.android.com/tools/releases/platform-tools" target="_blank">
  <img src="https://www.faviconextractor.com/favicon/developer.android.com?larger=true" alt="Android">
  <div class="custom-link-info">
    <span class="custom-link-title">Google-Android-Developers</span>
    <span class="custom-link-desc">Android-SDK-Platform-Tools</span>
  </div>
</a>

#### 下载和解压步骤

1. 选择上面的合适链接，点击下载 `platform-tools-latest.zip`

2. 下载完成后，将压缩包解压到你想要放置的位置（例如：`C:\android-tools\` 或 `D:\platform-tools\`）

3. 解压后会得到 `platform-tools` 文件夹，其中包含：
   - `adb.exe` - ADB 可执行程序
   - `fastboot.exe` - Fastboot 工具
   - 其他支持文件

{% darkimg https://tu.646474.xyz/1772808913505.png https://tu.646474.xyz/1772808932803.png 示例文件 %}


### 方法二：通过 Android Studio（备选）

如果你已经安装了 Android Studio，可以通过以下方式获取 Platform-Tools：

1. 打开 Android Studio，点击 **Tools** → **SDK Manager**
2. 选择 **SDK Tools** 选项卡
3. 勾选 **Android SDK Platform-Tools**，点击 **Apply**
4. Android Studio 会自动下载并安装到：`C:\Users\[用户名]\AppData\Local\Android\Sdk\platform-tools`

---

## 第二步：配置 Windows 系统环境变量

配置环境变量后，你就能在任何位置打开 CMD 窗口直接使用 `adb` 命令，无需每次都进入工具的完整路径。

### 详细配置步骤

**1. 打开环境变量设置**

- 打开**Windows设置**, 点击系统。
{% darkimg https://tu.646474.xyz/1772812680220.png https://tu.646474.xyz/1772812715676.png 截图示例 %}

- **下拉**侧边栏，找到系统信息。
{% darkimg https://tu.646474.xyz/1772813059195.png https://tu.646474.xyz/1772813084519.png 截图示例 %}

- 在**右侧**找到高级系统设置。
{% darkimg https://tu.646474.xyz/1772813177755.png https://tu.646474.xyz/1772813196469.png 截图示例 %}

- 点击环境变量。
![截图示例](https://tu.646474.xyz/1772813220762.png)

**2. 编辑 Path 环境变量**

- 在 **系统变量** 栏找到 **Path**，点击选中，然后点击 **编辑**

![截图示例](https://tu.646474.xyz/1772813323173.png)

**3. 添加 ADB 路径**

- 点击 **新建**，输入你的 Platform-Tools 路径，并将其移到**第一位**

例如：
```
C:\android-tools\platform-tools
```

![截图示例](https://tu.646474.xyz/1772813457743.png)

**4. 保存并生效**

- 点击 **确定** 保存所有更改
- **关闭并重新打开 CMD 窗口**（必须重启 CMD 才能生效）

**5. 验证配置成功**

在 CMD 中输入：

```cmd
adb version
```

如果显示 ADB 版本信息，说明配置成功！

![截图示例](https://tu.646474.xyz/1772813600975.png)

---

## 第三步：准备 Android 设备

在使用 ADB 之前，需要在手机上启用开发者模式和 USB 调试。

### 启用开发者模式

1. 打开手机 **设置** → **关于手机**
2. 连续点击 **版本号** 7-8 次，直到提示"你已进入开发者模式"

**Tip**: 不同手机进入开发者模式的方法不同，请自行搜索。

![image](https://tu.646474.xyz/1772813743593.png)

### 启用 USB 调试

1. 返回设置，找到 **系统** 或 **高级** 选项，进入 **开发者选项**
2. 搜索或上下滑动找到 **USB 调试**，打开开关

![image](https://tu.646474.xyz/1772813943409.png)

3. 首次通过 USB 连接计算机时，手机会弹出"允许 USB 调试"提示，点击 **确认** 并且强烈建议勾选“一律允许使用此台计算机进行调试”
![image](https://tu.646474.xyz/1772814036743.png)

---

## 常用 ADB 命令详解

以下是你需要掌握的基础命令：

### 连接与设备状态

#### 1. 查看已连接的设备

```cmd
adb devices
```

输出示例：
```
List of attached devices
emulator-5554          device
192.168.1.100:5555    device
```
![image](https://tu.646474.xyz/1772814228358.png)

- `device` 表示设备已连接且就绪
- `offline` 表示连接异常
- `unauthorized` 表示需要确认 USB 调试授权

#### 2. 获取设备信息

```cmd
adb shell getprop ro.build.version.release
```

获取 Android 系统版本

```cmd
adb shell getprop ro.serialno
```

获取设备序列号

```cmd
adb shell getprop ro.product.model
```

获取设备型号

#### 3. 查看连接信息

```cmd
adb shell ip addr show wlan0
```

查看设备 IP 地址

### 应用管理

#### 4. 安装应用

```cmd
adb install path\to\app.apk
```

安装 APK 文件

```cmd
adb install -r path\to\app.apk
```

覆盖安装（保留原应用数据）

#### 5. 卸载应用

```cmd
adb uninstall com.example.app
```

卸载指定包名的应用

#### 6. 查看已安装应用

```cmd
adb shell pm list packages
```

列出所有已安装的应用包名

```cmd
adb shell pm list packages | findstr /I "com.android"
```

搜索包含关键字的应用（Windows 使用 `findstr`）

#### 7. 启动应用

```cmd
adb shell am start -n com.example.app/.MainActivity
```

启动指定的应用（需要包名和 Activity 名）

### 文件传输

#### 8. 上传文件到手机

```cmd
adb push D:\test.txt /data/local/tmp/
```

将电脑文件上传到手机

#### 9. 下载文件到电脑

```cmd
adb pull /sdcard/DCIM/Camera/photo.jpg D:\downloads\
```

将手机文件下载到电脑

### 系统操作

#### 10. 运行 Shell 命令

```cmd
adb shell
```

进入手机的 Shell 交互模式，可以直接输入 Linux 命令

```cmd
exit
```

退出 Shell 模式

#### 11. 重启设备

```cmd
adb reboot
```

正常重启

```cmd
adb reboot bootloader
```

重启到 Bootloader（Fastboot）

```cmd
adb reboot recovery
```

重启到 Recovery 模式

#### 12. 查看日志

```cmd
adb logcat
```

实时查看系统日志

```cmd
adb logcat | findstr "搜索关键词"
```

筛选包含关键词的日志

#### 13. 截屏

```cmd
adb shell screencap -p /sdcard/screenshot.png
```

截屏并保存到手机

```cmd
adb pull /sdcard/screenshot.png D:\
```

下载截图到电脑

---

## 无线调试（WiFi 调试）

使用无线调试，你可以不接 USB 线就能通过 WiFi 进行 ADB 调试。

### Android 11+ 原生无线调试（推荐）

**在手机上操作：**

1. 进入 **设置** → **开发者选项**
2. 找到 **无线调试** 或 **Wireless Debugging**，打开开关, 打开开关后 直接点击文字“无线调试”即可进入二级页面
3. 选择使用配对码进行配对。

**在电脑上操作（CMD）：**

```cmd
adb pair ip:port
```

用手机显示的 IP 地址和端口替换 `ip:port`
![image](https://tu.646474.xyz/1772815061716.png)


连接成功后，会输出以下信息：
![image](https://tu.646474.xyz/1772819647637.png)

如果看到设备已连接，就可以像使用有线 ADB 一样使用所有命令了

### 断开无线连接

```cmd
adb disconnect ip:port
```

### Android 10 及以下 只建议有线连接

---

## Q&A 常见问题排查

**问：连接设备显示 "unauthorized"**

答：手机没有授予 USB 调试权限。用 USB 线重新连接，确认手机上的"允许调试"提示。

**问：`adb` 不是内部命令**

答：说明环境变量配置失败。重新检查 Path 环境变量是否正确添加了 Platform-Tools 路径，记得重启 CMD 窗口。

**问：无线调试无法连接**

答：检查手机和电脑是否连接到同一个 WiFi 网络，防火墙可能阻止了连接。

**问：设备显示 "offline"**

答：重新插拔 USB 线，或重启手机和电脑。

---

## 总结

ADB 是 Android 开发和进阶玩机的必备工具。掌握以上内容，你就能：

✓ 正确安装和配置 ADB  
✓ 在任何位置快速使用 ADB 命令  
✓ 进行应用和文件管理  
✓ 进行无线调试  

希望这篇指南对你有帮助！如有问题，欢迎在评论区留言。

