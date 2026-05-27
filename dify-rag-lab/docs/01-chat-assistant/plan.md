# Chat Assistant 学习计划

> 目标：回填 Chat Assistant 阶段已经完成的学习路径，和后续 Knowledge / RAG、Chatflow 阶段保持统一文档结构。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 学习目标

- [x] 理解 Chat Assistant 是 Dify 中最基础的多轮聊天应用形态
- [x] 理解 Prompt、变量、调试预览、发布更新之间的关系
- [x] 验证 Chat Assistant API 的 blocking、streaming 和多轮会话
- [x] 观察日志、标注、监测中的对话记录和 token 指标
- [x] 理解 Chat Assistant 与自研 Conversation / Message / SSE 的对应关系

## 2. 应用信息

- [x] 创建 Chat Assistant 应用
- [x] 应用名称：`简单的求职聊天助手`
- [x] 模型名称：`doubao-seed-2-0-lite-260428`
- [x] API Base URL：`http://localhost:8080/v1`
- [x] 测试用户：`abc-123`

## 3. 编排配置

- [x] 配置 System Prompt
- [x] 配置变量：`job_type`
- [x] 在调试与预览中验证单轮对话
- [x] 在调试与预览中验证多轮对话
- [x] 修改 Prompt 后验证发布更新机制
- [x] 验证不发布时 API 不使用最新配置
- [x] 验证发布后 API 使用最新配置

## 4. API 验证

- [x] 生成 API Key
- [x] blocking 调用 `/v1/chat-messages`
- [x] streaming 调用 `/v1/chat-messages`
- [x] 会话列表接口 `/v1/conversations`
- [x] 消息历史接口 `/v1/messages`
- [x] 使用 `conversation_id` 验证多轮上下文
- [x] 记录 API 请求体和关键响应字段

## 5. 模型参数实验

- [x] 理解 temperature 等模型参数通过页面配置，不通过单次 curl 请求覆盖
- [x] 分别测试温度 `0`、`0.2`、`0.8`
- [x] 使用新会话隔离参数实验，避免历史上下文影响观察

## 6. 日志与监测

- [x] 在日志与标注中查看 API 对话记录
- [x] 在监测中查看会话、活跃用户、token 速度、token 消耗等指标

## 7. 阶段产出

- [x] 完成 `api.md`

## 8. 阶段结论

- Chat Assistant 适合快速配置一个能对话、能发布、能被 API 调用的应用。
- Chat Assistant 的知识库、会话和模型调用被平台封装得比较完整，使用简单，但运行链路相对黑盒。
- 和自研 Super Agent Console 对照时，它更接近 `Conversation + Message + AgentRun + SSE` 的组合能力。
