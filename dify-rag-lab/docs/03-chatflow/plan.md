# Chatflow 学习计划

> 目标：用 Dify 创建一个带会话能力的 Chatflow，理解用户输入、知识检索、LLM、Answer 节点如何串起来，并和 Chat Assistant、Workflow、自研 Super Agent Console 做对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 学习目标

- [x] 理解 Chatflow 和 Chat Assistant 的区别
- [ ] 理解 Chatflow 和 Workflow 的区别
- [x] 理解 Chatflow 中每个节点的输入、输出和变量引用
- [x] 验证 Chatflow 如何接入知识库做 RAG
- [x] 验证 Chatflow API 的 blocking、streaming 和多轮会话
- [ ] 记录 Chatflow 与自研 Conversation + Workflow + RAG 的概念对照

## 2. 准备工作

已有基础：

- [x] 本地 Dify 已启动：`http://localhost:8080`
- [x] 已接入豆包聊天模型
- [x] 已接入 Embedding 模型
- [x] 已接入 Jina Rerank
- [x] 已创建知识库：`dify学习知识库`
- [x] Chat Assistant 已完成 RAG 验证
- [x] `/v1/chat-messages` blocking 和 streaming 已验证 `retriever_resources`

本阶段复用：

```text
知识库：dify学习知识库
LLM：豆包模型
Rerank：Jina reranker-v3
测试主题：Dify / RAG 学习记录问答
```

## 3. 创建 Chatflow 应用

目标：创建一个最小可运行的 Chatflow。

- [x] 在 Dify 控制台创建 Chatflow 应用
- [x] 应用命名，例如：`RAG 学习记录 Chatflow`
- [x] 选择或配置豆包模型
- [x] 进入 Chatflow 编排画布
- [x] 观察默认节点结构
- [x] 记录 Chatflow 默认入口节点和结束节点

记录项：

```text
应用名称：
应用类型：
模型供应商：
模型名称：
```

## 4. 最小聊天链路

目标：先不接知识库，只跑通用户输入到 LLM 再到 Answer 的基础链路。

- [x] 确认 Start / 用户输入节点
- [x] 添加或确认 LLM 节点
- [x] 在 LLM 节点中引用用户输入变量
- [x] 添加或确认 Answer 节点
- [x] 将 LLM 输出连接到 Answer
- [x] 在调试预览中提问一个普通问题
- [x] 验证 Chatflow 能正常回答

建议测试问题：

```text
请用一句话介绍 Dify Chatflow 是什么。
```

记录项：

```text
用户输入变量名：
LLM 输入变量：
Answer 输出变量：
```

## 5. 接入知识库检索节点

目标：把 RAG 从 Chat Assistant 的黑盒配置拆成可视化节点。

- [x] 添加知识检索 / Knowledge Retrieval 节点
- [x] 绑定知识库：`dify学习知识库`
- [x] 配置检索方式：混合检索
- [x] 配置 Rerank：Jina reranker-v3
- [x] 配置 Top K
- [x] 配置 Score 阈值：先关闭
- [x] 确认检索节点输入来自用户问题
- [x] 确认检索节点输出变量名称

建议配置：

```text
检索方式：混合检索
Rerank：Jina reranker-v3
Top K：3 或 5
Score 阈值：关闭
```

重点观察：

- 知识检索节点输出的数据结构是什么
- 是否能看到命中文档、片段内容和分数
- 是否有元数据过滤入口

## 6. LLM 节点使用检索结果

目标：让 LLM 基于知识检索结果回答，而不是只靠模型自身知识。

- [x] 修改 LLM Prompt
- [x] 引用用户问题变量
- [x] 引用知识检索节点输出
- [x] 要求优先基于知识库回答
- [x] 要求知识库无关时明确说明未找到相关资料
- [x] 调试知识库相关问题
- [x] 调试知识库无关问题

建议 Prompt 规则：

```text
你是一个 Dify / RAG 学习助手。
请优先根据知识库检索结果回答用户问题。
如果知识库检索结果为空或明显无关，请说明知识库中没有找到相关资料，再给出有限的通用建议。
回答使用中文，结构清晰，避免编造。
```

建议测试问题：

```text
Dify 最小镜像升级流程是什么？
```

```text
分段重叠长度是什么意思？
```

```text
今天北京天气怎么样？
```

## 7. 调试预览验证

目标：在页面中验证 Chatflow 的节点执行过程。

- [x] 单轮提问知识库相关问题
- [x] 验证知识检索节点命中正确文档
- [x] 验证 LLM 节点使用了检索结果
- [x] 验证 Answer 节点输出最终回答
- [x] 单轮提问无关问题
- [x] 验证无关问题不会强行引用知识库
- [ ] 多轮对话中继续追问
- [ ] 观察 Chatflow 是否保留会话上下文

记录项：

```text
问题：
命中文档：
命中片段：
最终回答：
是否符合预期：
```

## 8. 发布与 API Key

目标：让 Chatflow 可以通过 API 调用。

- [x] 发布 Chatflow 应用
- [x] 生成 API Key
- [x] 记录 API Base URL
- [x] 记录应用访问方式
- [x] 确认发布后配置生效

记录项：

```text
API Base URL：
API Key 名称：
测试用户 ID：
```

## 9. Blocking API 验证

目标：用 API 验证 Chatflow 的同步返回。

- [x] 使用 `/v1/chat-messages` blocking 调用问题
- [x] 验证返回 answer
- [x] 观察 `metadata.retriever_resources`
- [x] 记录命中文档和片段
- [x] 调用无关问题
- [x] 验证无关问题的 `retriever_resources` 表现

请求模板：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "Dify 最小镜像升级流程是什么？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "chatflow-rag-test-001"
  }'
```

## 10. Streaming API 验证

目标：验证 Chatflow 流式事件。

- [x] 使用 `/v1/chat-messages` streaming 调用问题
- [x] 记录 `event=message`
- [x] 记录 `event=message_end`
- [x] 验证 `retriever_resources` 出现在哪个事件中
- [x] 记录 usage 字段

重点观察：

```text
message 事件是否只返回增量 answer？
message_end 是否返回 retriever_resources？
Chatflow 是否有节点级事件？
```

## 11. 多轮会话验证

目标：验证 Chatflow 的 `conversation_id` 多轮上下文。

- [x] 第一次请求不传 `conversation_id`
- [x] 从响应中记录 `conversation_id`
- [x] 第二次请求带上同一个 `conversation_id`
- [x] 追问上一轮回答中的局部内容
- [x] 验证是否能结合上一轮问题继续回答

## 12. 日志与监测

目标：观察 Chatflow 的运行记录。

- [x] 在日志与标注中查看 Chatflow 对话
- [x] 查看节点执行过程或 trace
- [x] 查看知识库引用
- [x] 查看 token 用量
- [x] 查看延迟
- [ ] 在监测页面观察调用数据

## 13. 和其他应用形态对照

目标：明确 Chatflow 的定位。

- [x] 对照 Chat Assistant：配置简单，但链路较黑盒
- [x] 对照 Workflow：可视化编排，但 Workflow 偏一次性流程
- [x] 对照 Chatflow：可视化编排 + 会话能力 + 可接知识库
- [x] 对照自研 Super Agent Console：Conversation + AgentRun + Retrieval + Workflow

对照记录：

```text
Chat Assistant：适合快速配置一个聊天助手
Workflow：适合一次性任务编排
Chatflow：适合可控、可解释的多轮聊天编排
自研项目：更关注工程可控性、事件流、工具路由和运行详情
```

## 14. 阶段产出

- [x] 完成 `dify-rag-lab/docs/03-chatflow/api.md`
- [x] 保存 Chatflow blocking curl 示例
- [x] 保存 Chatflow streaming curl 示例
- [x] 保存 Chatflow 多轮会话示例
- [x] 保存 Chatflow RAG 命中样例
- [x] 更新 `dify-rag-lab/docs/00-overview/learning-plan.md`

## 15. 阶段完成标准

- [x] 至少创建 1 个 Chatflow 应用
- [x] 至少包含用户输入、知识检索、LLM、Answer 节点
- [x] 页面调试能回答知识库相关问题
- [x] 页面调试能处理无关问题
- [x] API blocking 调用成功
- [x] API streaming 调用成功
- [x] 多轮 `conversation_id` 验证成功
- [x] 能说清 Chatflow 与 Chat Assistant / Workflow 的区别
