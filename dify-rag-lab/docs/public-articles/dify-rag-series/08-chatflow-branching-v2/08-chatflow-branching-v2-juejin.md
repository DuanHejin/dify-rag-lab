# Dify RAG 学习实战 08：用参数提取和 IF/ELSE 给 Chatflow 加确定性分支

上一篇跑通了 Chatflow V1：

```text
用户输入
↓
知识检索
↓
LLM
↓
回复
```

这一篇继续做 V2。

目标是验证：

```text
如何在 Chatflow 里加入参数提取、结构化输出和 IF/ELSE 分支。
```

## 1. V2 要解决什么问题

V1 的问题是所有输入都会进入后续链路。

例如：

```text
我想准备面试
```

信息不完整。

又比如：

```text
北京天气怎么样？
```

问题不在应用支持范围内。

如果这些都进入知识检索和最终 LLM，流程就不够可控。

所以 V2 先做入口判断。

## 2. 参数提取节点

新增参数提取节点。

它的职责不是回答用户，而是输出结构化数据。

示例输出：

```json
{
  "intent": "job_prepare",
  "job_type": "前端开发",
  "days": 3,
  "weak_points": ["算法", "项目表达"],
  "is_complete": true
}
```

字段说明：

```text
intent：用户意图
job_type：岗位方向
days：准备天数
weak_points：薄弱点
is_complete：当前信息是否足够进入后续流程
```

当前意图枚举：

```text
job_prepare
dify_learning
out_of_scope
```

## 3. is_complete 规则

这次调整后，`is_complete` 不是单纯判断字段是否为空。

规则是：

```text
intent = dify_learning
→ is_complete = true

intent = job_prepare 且 job_type / days 足够
→ is_complete = true

intent = job_prepare 但信息不足
→ is_complete = false

intent = out_of_scope
→ is_complete = false
```

原因是 Dify 学习类问题不需要岗位和天数。

例如：

```text
Dify 最小镜像升级流程是什么？
```

这个问题本身就是完整的。

## 4. IF/ELSE 节点配置

参数提取后接 IF/ELSE 节点。

分支配置：

```text
CASE 1:
structured_output.is_complete 是 True
→ 知识检索

CASE 2:
structured_output.intent 包含 job_prepare
→ 补充信息

ELSE:
→ 暂不支持
```

补充信息回复：

```text
信息不够明确，请补充信息，如岗位、计划时间、薄弱项目。
```

暂不支持回复：

```text
暂不支持此类对话，请咨询面试，RAG相关知识。
```

完整链路可以理解成：

```text
用户输入
↓
参数提取
↓
IF/ELSE
├─ 完整问题 → 知识检索 → LLM → 回复
├─ 求职但信息不足 → 补充信息
└─ 无关问题 → 暂不支持
```

## 5. 测试用例

### Case 1：信息不足

输入：

```text
我想准备面试
```

输出：

```text
信息不够明确，请补充信息，如岗位、计划时间、薄弱项目。
```

说明：命中 `job_prepare`，但 `is_complete=false`。

### Case 2：补充完整信息

输入：

```text
前端开发，3 天，算法和项目表达比较弱
```

输出：

```text
【Chatflow-RAG-V2.0】...
```

说明：重新从 Start 节点开始执行，参数提取成功后进入 RAG 分支。

### Case 3：Dify 学习问题

输入：

```text
Dify 最小镜像升级流程是什么？
```

结果：

- `intent=dify_learning`
- `is_complete=true`
- 进入知识检索
- 最终基于知识库回答

### Case 4：无关问题

输入：

```text
北京天气怎么样？
```

输出：

```text
暂不支持此类对话，请咨询面试，RAG相关知识。
```

说明：命中 `out_of_scope`，不进入知识检索和最终 LLM。

## 6. 关于“追问”的理解

这里有一个运行机制需要注意。

补充信息节点后面不需要再连回参数提取节点。

用户再次输入时，会重新从 Start 节点开始。

所以它不是：

```text
补充信息节点
↓
回到参数提取节点
```

而是：

```text
用户下一轮输入
↓
Start
↓
参数提取
```

这也是 Chatflow 作为聊天应用和普通流程图的一个差异。

## 7. 本阶段结论

这次 V2 实验验证了几个点：

```text
参数提取节点可以把自然语言转成 structured_output
IF/ELSE 可以基于 structured_output 做确定性分支
信息不足不必进入 RAG
无关问题不必进入 LLM
完整问题继续进入原有 RAG 链路
```

工程上的理解是：

```text
Prompt 适合表达语义规则。
IF/ELSE 适合表达确定性流程。
RAG 适合处理知识问题。
LLM 适合做最终组织和表达。
```

这一步之后，Chatflow 不再只是“能回答”。

它开始变成一个有入口判断、有业务边界、有兜底逻辑的对话应用。
