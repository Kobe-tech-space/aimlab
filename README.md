# Aim Lab

基于 Three.js 的浏览器 FPS 瞄准训练工具。

## 前置要求

- **Node.js 18+** — [下载安装](https://nodejs.org/)

## 快速开始

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

浏览器会自动打开 `http://localhost:5173/`

## 启动脚本

| 系统 | 方式 |
|------|------|
| Windows | 双击 `start.bat` |
| macOS | 双击 `start.command` |

## 训练模式

| 模式 | 说明 |
|------|------|
| Gridshot | 消除网格中的所有目标，测试快速点击精度 |
| Flicking | 快速甩动鼠标击中随机出现的目标 |
| Tracking | 持续跟随移动目标，测试跟枪能力 |
| Microshot | 击中极小的目标，测试微调瞄准精度 |

## 功能特性

- 三种难度（简单/中等/困难）
- 四种自定义准星样式
- 热身阶段 + 倒计时
- 连击系统 + 音效反馈
- S/A/B/C 评级系统
- 个人最佳追踪
- 成绩历史图表
- 训练播放列表
- 每日挑战
- 灵敏度转换器（CS2/Valorant/OW/Apex/R6）
- 设置导出/导入
- 3D 武器模型 + 后坐力
- PWA 离线支持

## 技术栈

- **Three.js** — 3D 渲染
- **Vite** — 构建工具
- **PWA** — 离线安装

## 构建生产版本

```bash
npm run build
npm run preview
```
