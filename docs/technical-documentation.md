# RootHub 技术文档

> 前端物料管理系统 — 多端统一物料平台

---

## 目录

- [项目概览](#项目概览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [数据库设计](#数据库设计)
- [API 接口文档](#api-接口文档)
- [核心功能说明](#核心功能说明)
- [部署指南](#部署指南)
- [本地开发](#本地开发)

---

## 项目概览

RootHub 是一个**前端物料管理系统**，定位为多端统一物料平台，提供以下核心能力：

- **物料管理**：管理来自 GitHub 的前端物料库（区块、组件等），支持推荐物料与自定义物料
- **物料同步**：通过 git clone / git pull 自动同步远程物料仓库到本地 `.roothub/` 目录
- **区块浏览**：浏览物料库内的区块列表，支持预览截图、源码查看、在线沙箱（StackBlitz）
- **物料搜索**：支持关键词、框架类型、分类多维度检索物料
- **资源管理**：收录常用前端资源链接
- **工具箱**：内置常用前端工具
- **前端资讯**：嵌入 fed.chanceyu.com 前端资讯推送，支持定时/间隔推送配置
- **统计分析**：按类型、分类、框架统计物料分布及使用频次

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js (App Router) | 16.1.6 |
| UI 框架 | React | 19.2.3 |
| 组件库 | Ant Design | 6.3.1 |
| 样式 | Tailwind CSS | 4.x |
| ORM | Prisma | 5.22.0 |
| 数据库 | MySQL | 8.0 |
| 语言 | TypeScript | 5.x |
| 运行时 | Node.js | 20 (Alpine) |
| 容器化 | Docker + Docker Compose | — |

---

## 项目结构

```
roothub/
├── src/
│   ├── app/                        # Next.js App Router 页面及 API
│   │   ├── page.tsx                # 仪表盘（概览 + 前端资讯）
│   │   ├── layout.tsx              # 根布局（Ant Design Registry）
│   │   ├── materials/
│   │   │   ├── page.tsx            # 物料管理页
│   │   │   └── blocks/
│   │   │       └── BlocksView.tsx  # 区块浏览视图
│   │   ├── resource/page.tsx       # 资源页
│   │   ├── toolkit/page.tsx        # 工具箱页
│   │   ├── setting/page.tsx        # 系统设置页
│   │   └── api/                    # API 路由（Route Handlers）
│   │       ├── materials/
│   │       │   ├── route.ts        # GET 获取物料列表 / POST 新建物料
│   │       │   ├── [id]/route.ts   # PUT 更新 / DELETE 删除单条物料
│   │       │   ├── init/route.ts   # POST 初始化推荐物料
│   │       │   ├── sync/route.ts   # GET 同步物料（git pull/clone）
│   │       │   ├── search/route.ts # GET 多条件检索物料
│   │       │   └── stats/route.ts  # GET 物料统计数据
│   │       ├── blocks/
│   │       │   ├── route.ts        # GET 查询区块列表（分页/过滤）
│   │       │   ├── code/route.ts   # GET 读取区块源码文件
│   │       │   └── dependencies/route.ts # GET 解析区块依赖
│   │       ├── news/route.ts       # GET/POST 前端资讯推送配置
│   │       ├── setting/route.ts    # GET/POST 系统配置
│   │       └── stackblitz/
│   │           └── create/route.ts # POST 创建 StackBlitz 在线沙箱
│   ├── components/
│   │   ├── MainLayout.tsx          # 主布局（Sider + Header + Content）
│   │   ├── MaterialSandbox.tsx     # 物料在线预览沙箱
│   │   ├── DependencyAnalysis.tsx  # 区块依赖分析组件
│   │   ├── TextCopyModal.tsx       # 代码复制弹窗
│   │   └── FrameworkIcon.tsx       # 框架图标组件
│   ├── lib/
│   │   └── prisma.ts               # Prisma Client 单例
│   ├── data/
│   │   ├── recommendMaterials.ts   # 推荐物料预设数据 + 分类/框架枚举
│   │   ├── toolkitData.ts          # 工具箱数据
│   │   └── resourceList.ts         # 资源链接数据
│   ├── scripts/
│   │   ├── init-db.ts              # 数据库初始化脚本
│   │   ├── migrate-data.ts         # 数据迁移脚本
│   │   └── update-materials-metadata.ts # 更新物料元数据脚本
│   └── styles/
│       └── antd-theme.ts           # Ant Design 主题配置
├── prisma/
│   ├── schema.prisma               # 数据模型定义
│   └── migrations/                 # 数据库迁移历史
├── public/                         # 静态资源
├── Dockerfile                      # 多阶段构建镜像
├── docker-compose.yml              # 本地开发/生产编排
├── entrypoint.sh                   # 容器启动脚本（自动执行迁移）
├── next.config.ts                  # Next.js 配置
└── package.json
```

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    Browser Client                    │
│         Next.js Pages (React 19, Ant Design 6)      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│              Next.js App Router                      │
│         API Route Handlers (Server-side)             │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Materials  │  │  Blocks  │  │  News/Setting │  │
│  │    APIs     │  │   APIs   │  │     APIs      │  │
│  └──────┬──────┘  └────┬─────┘  └───────┬───────┘  │
│         │              │                │           │
│  ┌──────▼──────────────▼────────────────▼───────┐  │
│  │            Prisma ORM (MySQL)                 │  │
│  └──────────────────────────────────────────────┘  │
│                       │                             │
│  ┌────────────────────▼────────────────────────┐   │
│  │      Local File System (.roothub/)           │   │
│  │    Git Repos: materials-react, materials-vue  │   │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 物料同步机制

物料同步是系统核心流程，通过 Node.js `child_process.exec` 调用 git 命令实现：

```
用户点击「同步物料」
        │
        ▼
GET /api/materials/sync
        │
        ▼
从 DB 读取所有 active=true 的物料
        │
  ┌─────▼─────────────────────┐
  │ 遍历每个物料              │
  │                           │
  │  .roothub/{name} 存在？   │
  │    ├─ 是 git 仓库 → git pull
  │    ├─ 非 git 仓库 → rm -rf + git clone --depth 1
  │    └─ 不存在 → git clone --depth 1
  └───────────────────────────┘
        │
        ▼
返回同步结果（updated/cloned/error/skipped）
```

### 区块读取机制

区块配置文件适配器支持多种物料仓库格式：

| 配置文件 | 数据字段 | 适用场景 |
|---------|---------|---------|
| `materials.json` | `list.blocks` | RootHub 标准格式 |
| `umi-block.json` | `blocks` | UMI Block 格式 |
| `rh-block.json` | `list` | RootHub 自定义格式 |
| `package.json` | `blocks` | npm 包内嵌配置 |

---

## 数据库设计

数据库：**MySQL 8.0**，ORM：**Prisma 5**

### Material（物料）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Int (PK, AutoIncrement) | 主键 |
| `alias` | String (Unique) | 物料唯一标识（英文别名） |
| `name` | String | 物料名称（git 仓库名） |
| `gitPath` | String? | Git 仓库地址 |
| `description` | Text? | 描述 |
| `type` | String? | 框架类型：react / vue / angular 等 |
| `category` | String? | 分类：component / layout / form / chart / table 等 |
| `tags` | Text? | 标签（JSON 数组字符串） |
| `framework` | String? | 具体框架版本：React 18 / Vue 3 等 |
| `uiLibrary` | String? | UI 库：Ant Design / Element UI 等 |
| `active` | Boolean (默认 true) | 是否激活 |
| `isCustom` | Boolean (默认 false) | 是否为用户自定义物料 |
| `usageCount` | Int (默认 0) | 使用次数统计 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

> **注意**：`tags` 字段存储 JSON 数组字符串，读取时需 `JSON.parse()` 解析。

### Project（项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Int (PK) | 主键 |
| `name` | String | 项目名称 |
| `path` | String (Unique) | 项目路径 |
| `description` | Text? | 描述 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

### Resource（资源）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Int (PK) | 主键 |
| `name` | String | 资源名称 |
| `url` | String (Unique) | 资源链接 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

### Setting（配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Int (PK) | 主键 |
| `key` | String (Unique) | 配置键 |
| `value` | Text | 配置值（JSON 字符串） |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

---

## API 接口文档

### 通用响应格式

```typescript
// 成功
{ success: true, data: any, message?: string }

// 失败
{ success: false, message: string }
```

---

### 物料接口

#### `GET /api/materials`
获取所有物料列表，按推荐/自定义分组。

**响应**
```json
{
  "success": true,
  "data": {
    "recommendMaterials": [...],
    "customMaterials": [...]
  }
}
```

---

#### `POST /api/materials`
新增自定义物料。

**请求体**
```json
{
  "alias": "my-components",
  "name": "我的组件库",
  "gitPath": "https://github.com/xxx/xxx.git",
  "type": "react",
  "category": "component",
  "framework": "React 18",
  "uiLibrary": "Ant Design",
  "description": "描述",
  "tags": "[\"表单\",\"布局\"]"
}
```

---

#### `PUT /api/materials/[id]`
更新物料信息。请求体同 POST。

---

#### `DELETE /api/materials/[id]`
删除指定物料。

---

#### `POST /api/materials/init`
初始化推荐物料（将 `src/data/recommendMaterials.ts` 中的预设数据写入数据库）。

---

#### `GET /api/materials/sync`
同步所有激活物料的 Git 仓库到本地 `.roothub/` 目录。

**响应**
```json
{
  "success": true,
  "data": [
    { "name": "materials-react", "alias": "antd-blocks", "status": "updated", "message": "更新成功" }
  ],
  "summary": { "total": 3, "success": 3, "error": 0 }
}
```

`status` 取值：`updated` | `cloned` | `error` | `skipped`

---

#### `GET /api/materials/search`
多条件检索物料。

**Query 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `keyword` | string | 关键词（匹配 name / alias / description / tags） |
| `type` | string | 框架类型 |
| `category` | string | 分类 |
| `framework` | string | 框架版本（模糊匹配） |
| `activeOnly` | boolean | 仅返回已激活物料 |
| `page` | number | 页码（默认 1） |
| `pageSize` | number | 每页数量（默认 20） |

---

#### `GET /api/materials/stats`
获取物料统计信息。

**响应**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "active": 8,
    "custom": 2,
    "byType": { "react": 6, "vue": 4 },
    "byCategory": { "component": 5, "layout": 3 },
    "byFramework": { "React 18": 4 },
    "topUsed": [...]
  }
}
```

---

### 区块接口

#### `GET /api/blocks`
获取指定物料库的区块列表，支持分页与过滤。

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `materialsName` | string | — | 物料库名称（git 仓库目录名） |
| `name` | string | — | 区块名称/描述/标签关键词 |
| `category` | string | `全部` | 区块分类 |
| `tag` | string | — | 标签过滤 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 24 | 每页数量 |

**响应**
```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 24,
    "total": 100,
    "list": [
      {
        "name": "BasicForm",
        "key": "basic-form",
        "description": "基础表单",
        "screenshot": "https://...",
        "previewUrl": "https://...",
        "sourceCode": "https://...",
        "tags": ["表单"],
        "dependencies": [],
        "category": "form",
        "type": "react"
      }
    ]
  }
}
```

---

#### `GET /api/blocks/code`
读取区块源码文件内容。

---

#### `GET /api/blocks/dependencies`
解析并返回区块的依赖信息。

---

### 资讯接口

#### `GET /api/news`
获取前端资讯推送配置。

#### `POST /api/news`
保存推送配置。

**请求体**
```json
{
  "isOpen": true,
  "mode": "timing",
  "value": "09:00",
  "intervalValue": 2
}
```

`mode` 取值：`timing`（定时）| `interval`（时间间隔）

---

### 设置接口

#### `GET /api/setting`
获取系统配置（Key-Value 存储）。

#### `POST /api/setting`
保存系统配置。

---

### StackBlitz 接口

#### `POST /api/stackblitz/create`
基于区块代码创建 StackBlitz 在线沙箱，返回可访问的在线预览链接。

---

## 核心功能说明

### 1. 物料库管理

物料分两类：
- **推荐物料**：由 `src/data/recommendMaterials.ts` 预设，通过 `/api/materials/init` 一键写入数据库
- **自定义物料**：用户手动添加，`isCustom = true`

### 2. 物料同步

同步逻辑位于 `src/app/api/materials/sync/route.ts`：
- 使用 `child_process.exec` 调用系统 git 命令
- 克隆使用 `--depth 1` 浅克隆，加快速度
- 克隆/更新目标目录为 `<cwd>/.roothub/<materialName>/`
- 超时设置：clone 120s，pull 60s

### 3. 区块配置适配

`src/app/api/blocks/route.ts` 中的 `loadMaterialsConfig()` 函数自动识别并适配 4 种物料配置文件格式，最终统一规范化为标准区块数据结构。

### 4. 标签存储

`Material.tags` 字段以 JSON 字符串形式存储标签数组（MySQL Text 类型不支持数组），读取时统一 `JSON.parse()`。

---

## 部署指南

### Docker Compose 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/RootLinkFE/roothub.git
cd roothub

# 启动（含 MySQL 8.0 + Next.js 应用）
docker compose up -d
```

- 应用访问：`http://localhost:3000`
- MySQL 端口：`3307`（宿主机）→ `3306`（容器）
- 容器启动时自动执行 `prisma migrate deploy`（`entrypoint.sh`）

### 环境变量

| 变量 | 默认值（docker-compose） | 说明 |
|------|--------------------------|------|
| `DATABASE_URL` | `mysql://root:root@db:3306/roothub` | MySQL 连接串 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 监听端口 |

### Dockerfile 说明

采用**三阶段构建**优化镜像体积：

| 阶段 | 基础镜像 | 作用 |
|------|---------|------|
| `deps` | node:20-alpine | 安装 npm 依赖 |
| `builder` | node:20-alpine | 生成 Prisma Client + Next.js 构建产物 |
| `runner` | node:20-alpine | 最终运行镜像（非 root 用户 nextjs） |

---

## 本地开发

### 前置条件

- Node.js 20+
- MySQL 8.0（或通过 Docker 启动）
- Git（物料同步需要）

### 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动 MySQL（可用 docker）
docker run -d -p 3307:3306 -e MYSQL_DATABASE=roothub -e MYSQL_ROOT_PASSWORD=root mysql:8.0

# 3. 配置环境变量
echo "DATABASE_URL=mysql://root:root@localhost:3307/roothub" > .env

# 4. 执行数据库迁移
npx prisma migrate deploy

# 5. 生成 Prisma Client
npx prisma generate

# 6. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`

### 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 代码检查
npm run db:init      # 初始化数据库数据
npm run db:migrate   # 数据迁移

npx prisma studio    # 打开数据库可视化管理界面
npx prisma migrate dev --name <name>  # 新建迁移
```

---

*文档生成时间：2026-03-07*
