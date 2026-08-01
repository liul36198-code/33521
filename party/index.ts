/**
 * iOS17 聊天室 PartyKit 服务器
 * 
 * PartyKit 特性：
 * - 免服务器，部署到云端
 * - 免费额度：10万连接/天，100万消息/月
 * - 自动 WebSocket 升级
 * - 全球 CDN 加速
 * 
 * 文档：https://docs.partykit.io
 */

import type * as Party from "partykit/server";

// 在线用户
const users = new Map<string, { username: string; joinTime: number }>();

export default class ChatRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // 客户端连接
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const count = this.room.connections.size;
    console.log(`[连接] ${conn.id}，当前 ${count} 人`);
    
    // 发送当前在线用户列表
    const userList = Array.from(users.values()).map(u => u.username);
    conn.send(JSON.stringify({ type: "user_list", users: userList }));
    
    // 发送最近历史（最多50条，从room.storage获取）
    const stored = await this.room.storage.get<string[]>("history");
    if (stored) {
      conn.send(JSON.stringify({ type: "history", msgs: stored.slice(-50) }));
    }
  }

  // 收到消息
  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    let data: any;
    try {
      data = typeof message === "string" ? JSON.parse(message) : JSON.parse(new TextDecoder().decode(message));
    } catch {
      return;
    }

    const senderInfo = users.get(sender.id);
    const username = senderInfo?.username || "访客" + Math.floor(Math.random() * 9000 + 1000);

    switch (data.t) {
      case "join": {
        // 存储用户信息
        const name = (data.u || username).slice(0, 30);
        users.set(sender.id, { username: name, joinTime: Date.now() });
        
        // 广播上线消息给其他人
        this.room.broadcast(JSON.stringify({ type: "u_join", u: name }), [sender]);
        
        // 发送确认给新用户
        sender.send(JSON.stringify({ type: "joined", u: name }));
        
        // 发送公告队列
        const notices = await this.room.storage.get<any[]>("notices");
        if (notices) {
          notices.slice(-10).reverse().forEach(n => {
            sender.send(JSON.stringify({ type: "notice", ...n }));
          });
        }
        
        console.log(`[上线] ${name}，共 ${users.size} 人`);
        break;
      }

      case "chat": {
        if (!data.msg?.c) return;
        const msg = {
          id: data.msg.id || crypto.randomUUID(),
          t: "text",
          u: username,
          c: String(data.msg.c).slice(0, 2000),
          self: true,
          t2: new Date().toLocaleString(),
          r: true,
          _s: true,
        };
        await this.saveHistory(msg);
        // 广播给所有人（含发送者）
        this.room.broadcast(JSON.stringify({ type: "chat", msg }), []);
        break;
      }

      case "img": {
        if (!data.msg?.src) return;
        const msg = {
          id: data.msg.id || crypto.randomUUID(),
          t: "img",
          u: username,
          src: String(data.msg.src).slice(0, 500000),
          self: true,
          t2: new Date().toLocaleString(),
          r: true,
          _s: true,
        };
        await this.saveHistory(msg);
        this.room.broadcast(JSON.stringify({ type: "img", msg }), []);
        break;
      }

      case "file": {
        if (!data.msg?.src) return;
        const msg = {
          id: data.msg.id || crypto.randomUUID(),
          t: "file",
          u: username,
          src: String(data.msg.src).slice(0, 500000),
          fn: String(data.msg.fn || "文件").slice(0, 100),
          self: true,
          t2: new Date().toLocaleString(),
          r: true,
          _s: true,
        };
        await this.saveHistory(msg);
        this.room.broadcast(JSON.stringify({ type: "file", msg }), []);
        break;
      }

      case "revoke": {
        if (!data.id) return;
        // 查找并标记
        const history = await this.room.storage.get<string[]>("history") || [];
        const idx = history.findIndex((m: string) => {
          try {
            const parsed = JSON.parse(m);
            return parsed.id === data.id && parsed.u === username;
          } catch { return false; }
        });
        if (idx !== -1) {
          const parsed = JSON.parse(history[idx]);
          parsed.type = "revoke";
          parsed.c = "【已撤回】";
          history[idx] = JSON.stringify(parsed);
          await this.room.storage.put("history", history);
        }
        this.room.broadcast(JSON.stringify({ type: "revoke", id: data.id }), []);
        break;
      }

      case "del": {
        if (!data.id) return;
        const history = await this.room.storage.get<string[]>("history") || [];
        const idx = history.findIndex((m: string) => {
          try {
            const parsed = JSON.parse(m);
            return parsed.id === data.id && parsed.u === username;
          } catch { return false; }
        });
        if (idx !== -1) {
          history.splice(idx, 1);
          await this.room.storage.put("history", history);
        }
        this.room.broadcast(JSON.stringify({ type: "del", id: data.id }), []);
        break;
      }

      case "typing": {
        this.room.broadcast(JSON.stringify({ type: "typing", u: username }), [sender]);
        break;
      }

      case "stop_typing": {
        this.room.broadcast(JSON.stringify({ type: "stop_typing", u: username }), [sender]);
        break;
      }

      case "notice": {
        if (!data.c) return;
        const notice = { u: username, c: String(data.c).slice(0, 500), t: new Date().toLocaleString() };
        const notices = await this.room.storage.get<any[]>("notices") || [];
        notices.unshift(notice);
        if (notices.length > 50) notices.pop();
        await this.room.storage.put("notices", notices);
        this.room.broadcast(JSON.stringify({ type: "notice", ...notice }), []);
        break;
      }

      case "announce": {
        if (!data.body) return;
        const ann = {
          u: username,
          title: String(data.title || "").slice(0, 50),
          body: String(data.body || "").slice(0, 2000),
          t: new Date().toLocaleString(),
        };
        this.room.broadcast(JSON.stringify({ type: "announce", ...ann }), []);
        break;
      }

      case "ping": {
        sender.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        break;
      }
    }
  }

  // 客户端断开
  async onClose(conn: Party.Connection) {
    const info = users.get(conn.id);
    if (info) {
      users.delete(conn.id);
      this.room.broadcast(JSON.stringify({ type: "u_leave", u: info.username }));
      console.log(`[离线] ${info.username}，剩余 ${users.size} 人`);
    }
  }

  // 存储历史记录（最多500条）
  async saveHistory(msg: object) {
    const history = await this.room.storage.get<string[]>("history") || [];
    history.push(JSON.stringify(msg));
    while (history.length > 500) history.shift();
    await this.room.storage.put("history", history);
  }
}

// PartyKit 需要这个导出
export const onFetch = () =>
  new Response("iOS17 聊天室 PartyKit 服务器运行中", { status: 200 });
