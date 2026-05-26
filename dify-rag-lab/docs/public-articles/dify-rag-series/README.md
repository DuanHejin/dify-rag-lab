# Dify / RAG 学习系列

> 系列定位：承接“重新部署自己”系列中 SuperAgentConsole 从 0 到 1 的实践，在自研 Agent 项目完成第一阶段后，反过来学习成熟 AI 应用平台 Dify，用它校准自己对 Chat Assistant、Workflow、Chatflow、Agent、Knowledge / RAG、API 和部署形态的理解。

## 系列文章规划

### 1. 做完自己的 Agent 项目后，我为什么开始学习 Dify？

核心内容：

- SuperAgentConsole 第一阶段完成后的新问题
- 为什么需要找一个成熟平台做参照
- 本地 clone Dify 与 Docker Compose 启动
- 管理员账号初始化
- 接入豆包模型
- 源码和 Docker 镜像的区别
- 最小镜像升级流程
- `docker-compose` 与 `docker compose` 的差异
- `volumes` 为什么不能乱删

文件：

- `01-dify-local-deploy.md`
- `01-dify-local-deploy-zhihu.md`
- `01-dify-local-deploy-juejin.md`

### 2. Dify Chat Assistant 入门：从页面调试到 API 调用

核心内容：

- 创建“简单的求职聊天助手”
- 配置提示词与变量
- 调试与预览
- 单轮与多轮对话
- blocking / streaming API
- `conversation_id`
- 发布更新机制
- 日志、标注、监测
- 温度参数实验

文件：

- `02-chat-assistant.md`
- `02-chat-assistant-zhihu.md`
- `02-chat-assistant-juejin.md`

### 3. Dify 知识库 RAG 实战：从 Markdown 导入到第一次召回

核心内容：

- 为什么用自己的学习文档做知识库
- Embedding 模型接入
- 知识库创建
- 文档导入
- 文本分段与清洗
- 向量检索、全文检索、混合检索
- `retriever_resources`

文件：

- `03-knowledge-rag-first-retrieval.md`
- `03-knowledge-rag-first-retrieval-zhihu.md`
- `03-knowledge-rag-first-retrieval-juejin.md`

### 4. Dify RAG 踩坑实录：为什么我的知识库明明可用，却搜不出来

核心内容：

- Dify 1.14.1 hit-testing 页面渲染失败
- Network 里有 records，但页面报错
- `document.name = null` 导致前端 split 崩溃
- 升级到 1.14.2
- Weaviate / document_segments / index_node_id 排查
- `summary_index_setting.enable = null`
- Jina API Key 添加失败与 Docker 代理

文件：

- `04-rag-troubleshooting.md`
- `04-rag-troubleshooting-zhihu.md`
- `04-rag-troubleshooting-juejin.md`

### 5. RAG 效果优化：分段、Top K、Rerank 到底怎么调

核心内容：

- 为什么 `\n\n` 分段导致 chunk 太碎
- 最大长度 1024 如何把语义单元硬切开
- 为什么命中标题但没有完整答案
- 按标题层级切分后的效果提升
- Top K、Score 阈值、混合检索权重
- Jina Rerank vs qwen3-rerank
- `reranking_enable=true` 才算真正启用
- 召回测试历史保留 `retrieval_model` 快照

文件：

- `05-rag-optimization.md`
- `05-rag-optimization-zhihu.md`
- `05-rag-optimization-juejin.md`

### 6. 把 RAG 接进应用：Chat Assistant + 知识库 + API 完整验证

核心内容：

- 把知识库绑定到聊天助手
- 修改提示词，让模型优先基于知识库回答
- 调试预览引用来源
- blocking API 中的 `retriever_resources`
- streaming API 中 `message_end` 才带 `retriever_resources`
- 无关问题 `retriever_resources=[]`
- 为什么下一步要学 Chatflow

文件：

- `06-rag-chat-assistant-api.md`
- `06-rag-chat-assistant-api-zhihu.md`
- `06-rag-chat-assistant-api-juejin.md`
