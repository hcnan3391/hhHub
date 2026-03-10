# OpenClaw 安装 + 飞书接入实施计划

> 更新时间：2026-03-07

## 任务列表

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | 搜索并确认 OpenClaw 的 GitHub 地址和安装方式 | 🔄 进行中 | 飞书文档需登录，微信文章无法访问 |
| 2 | 克隆 OpenClaw 仓库并安装依赖 | ⏳ 待处理 | 依赖 Task 1 完成 |
| 3 | 配置 OpenClaw 基础环境（LLM API Key 等） | ⏳ 待处理 | 依赖 Task 2 完成 |
| 4 | 创建飞书机器人应用并获取凭证 | ⏳ 待处理 | 需要飞书管理员权限 |
| 5 | 开发 OpenClaw 飞书 Tool/Plugin | ⏳ 待处理 | 依赖 Task 3 & 4 完成 |
| 6 | 联调测试：OpenClaw Agent 通过飞书 Tool 发送消息 | ⏳ 待处理 | 依赖 Task 5 完成 |

---

## TODO（待解决阻塞问题）

- [ ] **[BLOCKER] 无法获取 OpenClaw GitHub 地址**
  - 飞书文档 https://bytedance.larkoffice.com/wiki/JDsBwMl6KiANkwkq4fhcBz6Wnpf 需要登录才能访问
  - 微信公众号文章因网络限制无法抓取
  - **解决方式**：需要用户手动打开飞书文档，提供 GitHub 仓库链接

---

## 技术方案（初步）

### OpenClaw 安装
```bash
# 预计流程（待 GitHub 地址确认后补全）
git clone <openclaw-repo-url>
cd openclaw
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config/config.example.toml config/config.toml
```

### 飞书接入方案
1. 在 [飞书开放平台](https://open.feishu.cn) 创建企业自建应用
2. 开通权限：`im:message`（发送消息）
3. 获取 `App ID` 和 `App Secret`
4. 实现飞书 Tool，调用 OpenClaw Tool 接口：

```python
# 示例：飞书消息发送 Tool（伪代码，待 OpenClaw 接口确认后实现）
class FeishuTool(BaseTool):
    name = "feishu_send_message"
    description = "发送消息到飞书"

    async def run(self, chat_id: str, message: str) -> str:
        # 获取 tenant_access_token
        token = await get_tenant_access_token(APP_ID, APP_SECRET)
        # 调用飞书消息 API
        await send_message(token, chat_id, message)
        return "消息发送成功"
```

---

## 参考链接

- OpenClaw 飞书文档：https://bytedance.larkoffice.com/wiki/JDsBwMl6KiANkwkq4fhcBz6Wnpf
- OpenClaw 微信介绍：https://mp.weixin.qq.com/s/0HjXGQjYBH_0g6FeUKAXhA
- 飞书开放平台：https://open.feishu.cn
- 飞书消息 API：https://open.feishu.cn/document/server-docs/im-v1/message/create
