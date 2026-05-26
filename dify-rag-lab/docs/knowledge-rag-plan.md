# Knowledge / RAG 学习计划

> 目标：用 Dify 完成一个最小可验证的知识库问答流程，理解文档导入、切片、索引、检索、引用来源、API 调用和日志观测，并和 Super Agent Console 未来 RAG 模块做概念对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 0. 前置状态

- [x] Dify 本地服务已启动：`http://localhost:8080`
- [x] 已完成管理员账号初始化
- [x] 已接入豆包聊天模型
- [x] 已完成 Chat Assistant 阶段验证
- [x] 确认 Dify 中可用 Embedding 模型：已接入火山方舟 `embeddingversion`
- [x] 确认知识库默认向量库可用，当前 Docker 默认是 Weaviate

## 1. 准备实验材料

目标：直接使用 `dify-rag-lab/docs/` 下的真实学习文档作为知识库材料，让 RAG 检索能够服务后续学习复盘，而不是只验证临时样例文本。

- [x] 创建导入清单：`dify-rag-lab/experiments/rag-documents/import-manifest.md`
- [x] 导入真实文档 1：`dify-rag-lab/docs/chat-assistant-api.md`
- [x] 导入真实文档 2：`dify-rag-lab/docs/dify-learning-plan.md`
- [x] 导入真实文档 3：`dify-rag-lab/docs/dify-thread-context.md`
- [x] 导入真实文档 4：`dify-rag-lab/docs/knowledge-rag-plan.md`
- [x] 导入真实文档 5：`dify-rag-lab/docs/knowledge-rag-config-notes.md`
- [ ] 可选导入 Prompt 实验文档：`dify-rag-lab/experiments/prompts/chat-assistant-prompts.md`
- [x] 记录每个导入文档的主题、chunk 数量和索引状态

建议产出：

- [x] `dify-rag-lab/experiments/rag-documents/import-manifest.md`

## 2. 创建知识库

目标：熟悉 Dify 知识库创建流程和基础配置。

- [x] 在 Dify 控制台创建知识库
- [x] 记录知识库名称：`dify学习知识库`
- [x] 选择文档导入方式：上传 Markdown 文件
- [x] 上传 Markdown 文档
- [x] 选择或确认 Embedding 模型：火山方舟 `embeddingversion`
- [x] 观察索引创建过程是否成功
- [x] 记录索引耗时和状态：5 个文档全部可用

建议记录：

```text
知识库名称：
Embedding 模型：
向量库：
导入文档：
索引状态：
```

当前记录：

```text
知识库名称：dify学习知识库
Embedding 模型：火山方舟 embeddingversion
向量库：Weaviate
导入文档：5 个 Markdown 文档
索引状态：全部可用
```

## 3. 观察切片与索引

目标：理解文档如何被切成 chunk，以及这些 chunk 如何影响召回。

- [x] 查看每篇文档的分段 / 切片结果
- [ ] 记录默认切片策略
- [x] 记录 chunk 数量
- [ ] 观察 chunk 是否保留标题层级
- [ ] 观察是否存在切片过短、过长、语义断裂的问题
- [ ] 修改一次切片配置并重新导入或重建索引
- [ ] 对比修改前后的 chunk 效果

重点问题：

- Dify 的 chunk 更像按标题切，还是按长度切？
- 标题和正文是否会一起进入检索内容？
- 一个答案通常会命中几个 chunk？

## 4. 检索测试

目标：先不接 Chat Assistant，只验证知识库自身的检索效果。

- [x] 在知识库检索测试里输入一个明确问题
- [x] 验证能命中正确文档
- [x] 验证能命中正确 chunk
- [x] 记录命中文档标题
- [x] 记录命中片段内容摘要
- [x] 调整 top_k 或召回参数
- [x] 对比召回数量和准确性变化：升级到 Dify 1.14.2 后，全文检索、向量检索、混合检索均可展示结果；混合检索开启 Jina Rerank 后可命中更准确段落
- [x] 记录召回测试历史可能保留旧 `retrieval_model` 快照，修改 Rerank 后建议新建测试

建议测试问题：

```text
3 天准备前端面试时，第一天应该优先复习哪些内容？
```

```text
项目表达应该按什么结构组织？
```

```text
知识库里提到的专有测试信息是什么？
```

## 5. 绑定到 Chat Assistant

目标：让已有的“简单的求职聊天助手”使用知识库回答问题。

- [ ] 打开 Chat Assistant 编排页面
- [x] 绑定新建知识库
- [x] 配置检索参数
- [ ] 发布更新
- [x] 在调试预览中提问
- [x] 验证回答内容来自知识库
- [x] 验证回答中是否展示引用来源
- [ ] 验证无关问题时是否不会强行引用知识库

注意：

- 修改知识库绑定或检索配置后，需要发布更新，API 才会使用新配置。
- 为了避免多轮上下文干扰，RAG 验证建议新开 `conversation_id`。

## 6. API 验证 RAG 回答

目标：用 `/chat-messages` 验证知识库检索结果，并观察 `retriever_resources` 字段。

- [ ] 使用 blocking 调用知识库问题
- [ ] 使用 streaming 调用知识库问题
- [ ] 记录 `metadata.retriever_resources`
- [ ] 记录命中文档 `dataset_name`
- [ ] 记录命中文档 `document_name`
- [ ] 记录命中片段内容摘要
- [ ] 记录 score 或相似度字段
- [ ] 验证无关问题时 `retriever_resources` 的表现

blocking 请求模板：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "根据知识库，3 天准备前端面试时第一天应该做什么？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "rag-test-001"
  }'
```

## 7. 元数据过滤

目标：理解 Dify 知识库元数据过滤如何影响召回范围。

- [ ] 为文档或片段配置元数据
- [ ] 设计元数据字段，例如 `doc_type`、`role`、`stage`
- [ ] 创建至少两类文档元数据
- [ ] 在检索配置中启用元数据过滤
- [ ] 用相同问题测试不过滤和过滤后的召回差异
- [ ] 记录元数据过滤是否影响 `retriever_resources`

建议元数据：

```text
doc_type: interview_guide
doc_type: project_story
role: frontend
stage: job_prepare
```

## 8. 日志与监测

目标：观察 RAG 调用在日志、标注和监测里的表现。

- [ ] 在日志与标注中查看 RAG 对话
- [ ] 确认能看到用户问题和模型回答
- [ ] 确认能看到知识库引用或检索资源
- [ ] 记录 token 用量
- [ ] 记录延迟
- [ ] 和无知识库调用对比 token / 延迟差异
- [ ] 在监测页面观察会话数、活跃用户、token 消耗变化

## 9. 错误与边界实验

目标：知道 RAG 不命中、命中错误或配置错误时表现如何。

- [ ] 提问知识库完全无关的问题
- [ ] 提问模糊问题，观察是否会错误召回
- [ ] 暂时解绑知识库后再次 API 调用
- [ ] 删除或禁用文档后再次检索
- [ ] 记录错误响应或降级表现

## 10. 和 Super Agent Console 对照

目标：把 Dify Knowledge 翻译成自研 RAG 模块的工程概念。

- [ ] 对照 Dify Knowledge 与 `KnowledgeBase`
- [ ] 对照 Dify Document 与 `Document`
- [ ] 对照 Dify Segment / Chunk 与 `Chunk`
- [ ] 对照 Embedding 模型与 `EmbeddingProvider`
- [ ] 对照向量库与 `VectorStore`
- [ ] 对照检索配置与 `Retriever`
- [ ] 对照 `retriever_resources` 与 `RetrievalTrace`
- [ ] 对照引用来源与 `Citation`
- [ ] 总结哪些能力可以由 Dify 快速完成
- [ ] 总结哪些能力适合未来在 Super Agent Console 自研

## 11. 阶段产出

- [ ] 完成 `dify-rag-lab/docs/knowledge-rag.md`
- [ ] 保存 RAG API curl 示例
- [ ] 保存检索命中样例
- [ ] 保存元数据过滤实验结果
- [ ] 更新 `dify-rag-lab/docs/dify-learning-plan.md`

## 12. 阶段完成标准

- [ ] 至少 1 个知识库创建成功
- [ ] 至少 2 篇 Markdown 文档导入成功
- [ ] 能看到文档切片结果
- [ ] 能在知识库内检索命中正确 chunk
- [ ] Chat Assistant 能基于知识库回答
- [ ] API 响应中能看到 `retriever_resources`
- [ ] 完成一次元数据过滤实验
- [ ] 完成一次无命中或错误边界实验
- [ ] 完成 Dify Knowledge 与自研 RAG 模块对照
