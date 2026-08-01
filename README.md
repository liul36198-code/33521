# iOS17 沉浸式聊天室 — 云端部署版

> 🎉 部署到 GitHub Pages（前端）+ PartyKit（WebSocket 后端），完全免费！

---

## 🏗️ 架构

```
用户浏览器
    │
    ├── HTTPS → GitHub Pages（前端静态文件）
    │               └── index.html
    │               └── sw.js（Service Worker）
    │               └── manifest.json
    │
    └── WSS → PartyKit 云端（WebSocket 服务器）
                    └── 消息广播
                    └── 历史记录持久化
                    └── 在线用户管理
```

---

## 🚀 部署步骤（10 分钟完成）

### 第一步：Fork 本仓库

点击右上角 **Fork**，创建你自己的副本

### 第二步：配置 PartyKit（免费）

1. 访问 [partykit.io](https://partykit.io)，用 GitHub 登录
2. 点击 **New Project** → 输入项目名（如 `ios17-chatroom`）
3. 创建后会得到一个地址，例如：
   ```
   https://partykit.io/onboarding
   （记录你的用户名，如 `mychat`）
   ```
4. 进入 [partykit.io/account](https://partykit.io/account) → **Tokens** → **Create Token**
5. 复制 Token

### 第三步：配置 GitHub Secrets

1. 打开你的 Fork 仓库
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. 添加一个 Secret：
   - Name: `PARTYKIT_TOKEN`
   - Secret: 刚才复制的 Token

### 第四步：配置前端 WebSocket 地址

编辑 `party/index.ts` 最后一行的导出：
（PartyKit 自动识别 `party/index.ts`，不需要改）

### 第五步：启用 GitHub Pages

1. 仓库 **Settings** → **Pages**
2. Source: **GitHub Actions**
3. 保存

### 第六步：推送触发部署

```bash
git add .
git commit -m "feat: 初始化聊天室"
git push origin main
```

进入 **Actions** 标签页查看部署进度，等待 2 分钟后：

- 前端地址：`https://你的用户名.github.io/chatroom/`
- WebSocket 地址：`https://你的用户名.partykit.dev/party/chatroom`

### 第七步：修改前端 WebSocket 地址

PartyKit 部署完成后，编辑 `index.html`，找到：

```javascript
const WS_ENDPOINT = "wss://ios17-chatroom.$PARTYKIT_USER.partykit.dev";
```

改成实际的 PartyKit 项目地址，例如：

```javascript
const WS_ENDPOINT = "wss://你的项目名.你的用户名.partykit.dev";
```

再推送一次即可。

---

## 📱 移动端安装 PWA

- **iOS**：Safari 打开 → 分享 → 添加至主屏幕
- **Android**：Chrome 自动弹出安装提示

---

## 🔧 手动本地测试

```bash
# 克隆仓库
git clone https://github.com/你的用户名/chatroom.git
cd chatroom

# 启动 PartyKit 本地开发服务器
cd party
npm install
npx partykit dev

# 另一个终端，用任意 HTTP 服务器打开 index.html
npx serve .
# 或 python -m http.server 8080
```

---

## 💡 常见问题

**Q: 部署后连不上？**
检查 PartyKit 是否部署成功，进入 partykit.io 控制台查看日志

**Q: PartyKit 免费额度够用吗？**
- 10 万连接/天
- 100 万消息/月
个人使用绰绰有余

**Q: 想换域名？**
GitHub Pages 支持自定义域名，Settings → Pages → Custom domain

**Q: 消息会永久保存吗？**
PartyKit 免费版消息存储在内存中，服务器重启会清空。如需持久化，可升级付费版或接入外部数据库

---

## 🛠️ 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS | 零依赖，极速加载 |
| UI | iOS 17 设计规范 | 磨砂玻璃 + 动画 |
| 实时通信 | WebSocket | 全双工消息推送 |
| 后端 | PartyKit | 免服务器 WebSocket |
| 部署 | GitHub Pages + Actions | CDN 全球加速 |
| PWA | Service Worker | 离线可用 |

---

*Made with ❤️ — 移动端开发专家 Agent*
