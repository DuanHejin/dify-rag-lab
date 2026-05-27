# Chatflow 学习计划

> 目标：用 Dify 创建一个带会话能力的 Chatflow，理解用户输入、知识检索、LLM、Answer 节点如何串起来，并和 Chat Assistant、Workflow、自研 Super Agent Console 做对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 学习目标

- [x] 理解 Chatflow 和 Chat Assistant 的区别
- [x] 理解 Chatflow 和 Workflow 的区别
- [x] 理解 Chatflow 中每个节点的输入、输出和变量引用
- [x] 验证 Chatflow 如何接入知识库做 RAG
- [x] 验证 Chatflow API 的 blocking、streaming 和多轮会话
- [x] 记录 Chatflow 与自研 Conversation + Workflow + RAG 的概念对照

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
- [x] 多轮对话中继续追问
- [x] 观察 Chatflow 是否保留会话上下文

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

## 16. Chatflow V2 进阶计划

目标：在已经跑通的 `求职助手Chatflow RAG` 基础上复制一个 V2 版本，继续学习 Chatflow 的流程控制能力。V2 不再只验证 `Start -> Knowledge Retrieval -> LLM -> Answer` 主干链路，而是重点验证条件分支、变量提取、信息补全、确定性兜底和节点级路由。

建议应用：

```text
原应用：求职助手Chatflow RAG
新应用：求职助手Chatflow RAG V2
模型：doubao-seed-2-0-lite-260428
知识库：dify学习知识库
Rerank：Jina reranker-v3
```

### 16.1 复制 V1 应用

目标：保留 V1 的稳定 RAG 链路，单独用 V2 做进阶节点实验。

- [x] 复制 `求职助手Chatflow RAG` 为 `求职助手Chatflow RAG V2`
- [x] 确认 V2 仍然绑定 `dify学习知识库`
- [x] 确认 V2 仍然使用 `doubao-seed-2-0-lite-260428`
- [x] 确认 V2 仍然使用 Jina Rerank
- [x] 在调试预览中用原问题验证 V2 基础链路仍可用
- [x] 记录 V2 的应用名称和 API Key 占位符

当前记录：

```text
应用名称：求职助手Chatflow RAG V2
回答前缀：Chatflow-RAG-V2.0
验证结果：可以命中知识库并基于召回内容回答
```

建议测试问题：

```text
Dify 最小镜像升级流程是什么？
```

### 16.2 添加用户信息补全分支

目标：验证 Chatflow 可以在信息不足时先追问用户，而不是直接让 LLM 生成不完整答案。

实验场景：

```text
用户：我想准备面试
系统：请补充岗位方向和准备时间，例如“前端开发，3 天”。
```

计划节点：

```text
Start
-> 参数提取 / 判断节点
-> IF/ELSE
   -> 信息不完整：Answer 追问用户
   -> 信息完整：进入后续流程
```

待完成：

- [x] 明确需要收集的字段：`job_type`、`days`
- [x] 设计信息不完整的测试输入
- [x] 添加用于识别字段是否完整的节点
- [x] 添加 IF/ELSE 节点
- [x] 配置信息不完整分支
- [x] 配置追问用户的 Answer 节点
- [x] 测试用户补充信息后的下一轮表现
- [x] 记录多轮信息补全是否符合预期

当前实现：

```text
Start
-> 参数提取 LLM 节点
-> IF/ELSE 判断 `structured_output.is_complete` 是否为 true
   -> true：进入知识检索分支
   -> false：直接回复“信息不够明确”
```

参数提取节点已开启结构化输出，真实输出字段为 `structured_output`，内部字段名使用下划线形式：

```text
Structured Output:
- job_type
- days
- weak_points
- is_complete
```

参数提取节点输出样例：

```json
{
  "text": "<think>...</think>{\"job_type\": \"前端开发\", \"days\": 3, \"weak_points\": [\"算法\", \"项目表达\"], \"is_complete\": true}",
  "reasoning_content": "",
  "structured_output": {
    "job_type": "前端开发",
    "days": 3,
    "weak_points": [
      "算法",
      "项目表达"
    ],
    "is_complete": true
  }
}
```

注意：IF/ELSE 应优先读取 `structured_output.is_complete`，不要从 `text` 中解析 JSON。`text` 里可能包含模型的 `<think>` 内容，不适合作为稳定判断来源。

验证结果：

```text
case1:
输入：我想准备面试
结果：is_complete = false，进入 else 分支，返回“信息不够明确”

case2:
输入：我是前端开发，还有 3 天面试，算法和项目表达比较弱。
结果：is_complete = true，进入知识检索分支，召回知识库内容，LLM 基于知识库内容进一步总结回答

case3:
第一轮输入：我想准备面试
第一轮结果：is_complete = false，进入 else 分支，返回“信息不够明确”
第二轮输入：前端开发，3 天，算法和项目表达比较弱
第二轮结果：流程重新从 Start 开始执行，参数提取节点识别为信息完整，进入知识检索分支，最终输出以【Chatflow-RAG-V2.0】开头的 3 天前端面试准备方案
引用来源：chat-assistant-api.md
```

结论：

- 追问分支本质是一个 Answer 回复节点，本轮到此结束。
- 用户再次输入时，Chatflow 会重新从 Start 开始执行，而不是从追问节点后面继续执行。
- 在第二轮输入已经包含完整字段时，参数提取节点可以重新提取 `job_type`、`days`、`weak_points` 和 `is_complete`，并进入正确分支。

### 16.3 添加无关问题确定性分支

目标：验证无关问题可以由 IF/ELSE 或分类节点直接兜底，不必每次都交给大模型判断。

实验场景：

```text
用户：今天北京天气怎么样？
系统：这个应用只回答 Dify / RAG 学习和求职准备相关问题。
```

计划节点：

```text
Start
-> 问题分类 / 关键词判断
-> IF/ELSE
   -> 无关问题：Answer 直接兜底
   -> 相关问题：继续知识检索或 LLM
```

待完成：

- [x] 明确哪些问题属于无关问题
- [x] 选择判断方式：关键词规则 / 分类节点 / LLM 分类节点
- [x] 添加无关问题判断节点
- [x] 添加 IF/ELSE 分支
- [x] 配置无关问题直接回复
- [x] 验证无关问题不进入知识检索节点
- [x] 验证相关问题仍能正常进入 RAG 链路

当前实现：

```text
参数提取节点新增结构化字段：intent

intent 可选值：
- job_prepare
- dify_learning
- out_of_scope
```

`is_complete` 的含义调整为“当前 intent 对应的必要信息是否完整”：

```text
intent = dify_learning -> is_complete = true
intent = job_prepare 且 job_type 不为空且 days 不为 null -> is_complete = true
intent = job_prepare 但缺少 job_type 或 days -> is_complete = false
intent = out_of_scope -> is_complete = false
```

IF/ELSE 节点当前配置：

```text
IF:
  structured_output.is_complete 是 True
  -> 知识检索分支

ELIF:
  structured_output.intent 包含 job_prepare
  -> 补充信息回复节点
  -> 固定回复：信息不够明确，请补充信息，如岗位、计划时间、薄弱项目。

ELSE:
  -> 暂不支持回复节点
  -> 固定回复：暂不支持此类对话，请咨询面试，RAG相关知识。
```

说明：

- `dify_learning` 和信息完整的 `job_prepare` 都会因为 `is_complete=true` 进入知识检索分支。
- 信息不完整的 `job_prepare` 会进入补充信息分支。
- `out_of_scope` 会进入暂不支持分支。
- 如果 `intent` 是枚举值，IF/ELSE 中用“等于 job_prepare”会比“包含 job_prepare”更严格；当前用“包含”也能工作，但后续可视情况改成“等于”。

验证结果：

```text
case1:
输入：我想准备面试
结果：进入补充信息分支，回复“信息不够明确，请补充信息，如岗位、计划时间、薄弱项目。”

case2:
输入：Dify 最小镜像升级流程是什么？
结果：进入知识检索分支，从知识库召回内容并回答。

case3:
输入：北京天气怎么样？
结果：进入暂不支持分支，回复“暂不支持此类对话，请咨询面试，RAG相关知识。”
```

### 16.4 添加知识检索结果为空分支

状态：暂缓。当前先进入 Workflow 阶段，后续需要继续强化 Chatflow 时再补。

目标：让“知识库无结果”和“知识库有结果”走不同分支，减少 LLM 对空上下文的误判。

计划节点：

```text
Knowledge Retrieval
-> IF/ELSE 判断 result 是否为空
   -> 空：Answer 说明知识库中没有找到相关资料
   -> 非空：LLM 基于知识库回答
```

待完成：

- [ ] 确认知识检索节点输出变量名称：`result`
- [ ] 确认 `result=[]` 时的判断条件写法
- [ ] 添加 IF/ELSE 节点判断检索结果是否为空
- [ ] 配置空结果分支的 Answer
- [ ] 配置非空结果分支进入 LLM
- [ ] 用天气问题验证空结果分支
- [ ] 用 Dify 升级问题验证非空结果分支

### 16.5 添加变量提取与结构化输出

状态：暂缓。当前先进入 Workflow 阶段，后续需要继续强化 Chatflow 时再补。

目标：验证 Chatflow 中可以先把用户输入提取成结构化变量，再把变量传给后续节点。

实验输入：

```text
我是前端开发，还有 3 天面试，算法和项目表达比较弱。
```

期望变量：

```text
job_type: 前端开发
days: 3
weak_points: 算法、项目表达
```

待完成：

- [ ] 添加变量提取节点或 LLM 提取节点
- [ ] 设计结构化输出格式
- [ ] 将提取结果传给后续 IF/ELSE 或 LLM 节点
- [ ] 验证完整输入可以直接生成计划
- [ ] 验证缺字段输入会进入信息补全分支
- [ ] 记录变量在节点间的传递方式

### 16.6 API 验证 V2

状态：暂缓。当前先进入 Workflow 阶段，后续需要继续强化 Chatflow 时再补。

目标：确认 V2 的流程分支不仅在页面调试中生效，也能通过 API 生效。

- [ ] 发布 V2 应用
- [ ] 生成或确认 V2 API Key
- [ ] blocking 调用完整信息问题
- [ ] blocking 调用信息不完整问题
- [ ] blocking 调用无关问题
- [ ] streaming 调用知识库相关问题
- [ ] 观察 streaming 中分支节点事件
- [ ] 记录 V2 与 V1 的响应差异
- [ ] 更新 `dify-rag-lab/docs/03-chatflow/api.md`

### 16.7 阶段完成标准

- [x] V2 应用复制完成，并保留 V1 基础 RAG 能力
- [x] 能用节点判断信息是否完整
- [x] 能在信息不足时追问用户
- [x] 能用节点处理无关问题兜底
- [ ] 能根据知识检索结果是否为空走不同分支
- [x] 能提取用户输入中的结构化变量
- [ ] API 能验证至少 3 条分支路径
- [x] 能说清哪些判断适合节点确定性处理，哪些判断适合交给 LLM
