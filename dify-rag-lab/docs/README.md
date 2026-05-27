# Dify / RAG 学习文档索引

> 目标：把 Dify 学习过程按模块整理，避免计划、实验记录、API 记录和配置说明混在 `docs/` 根目录。

## 文档规则

每个学习模块尽量使用统一文档角色：

```text
plan.md          学习计划、勾选清单、阶段验收
api.md           API 请求、响应字段、curl 示例、事件类型
lab.md           实验过程、排查记录、关键结论
config-notes.md  配置项解释，只有配置复杂的模块才需要
```

跨模块总览放在 `00-overview/`。

公开文章草稿放在 `public-articles/`，不和学习实验文档混放。

## 目录结构

```text
docs/
├── README.md
├── 00-overview/
│   ├── learning-plan.md
│   └── thread-context.md
├── 01-chat-assistant/
│   ├── plan.md
│   └── api.md
├── 02-knowledge-rag/
│   ├── plan.md
│   ├── lab.md
│   └── config-notes.md
├── 03-chatflow/
│   ├── plan.md
│   └── api.md
└── public-articles/
    └── dify-rag-series/
```

## 模块说明

### 00-overview

- `learning-plan.md`：Dify / RAG 总学习计划。
- `thread-context.md`：用于新线程快速恢复项目背景、目录规则、学习进度和关键结论。

### 01-chat-assistant

- `plan.md`：Chat Assistant 阶段回填计划。
- `api.md`：Chat Assistant 页面配置、发布机制、blocking / streaming / 多轮 API 验证记录。

### 02-knowledge-rag

- `plan.md`：Knowledge / RAG 阶段学习计划。
- `lab.md`：文档导入、切片、召回、Rerank、故障排查、Chat Assistant RAG API 验证记录。
- `config-notes.md`：知识库文本分段、清洗、检索设置等配置项说明。

### 03-chatflow

- `plan.md`：Chatflow 阶段学习计划。
- `api.md`：Chatflow blocking、streaming、多轮、RAG、节点事件、日志观测记录。

## 后续扩展建议

后续继续学习 Workflow、Agent / Tool、MCP 时，按同样规则新增：

```text
04-workflow/
├── plan.md
└── api.md

05-agent-tool/
├── plan.md
└── api.md

06-mcp/
├── plan.md
└── lab.md
```
