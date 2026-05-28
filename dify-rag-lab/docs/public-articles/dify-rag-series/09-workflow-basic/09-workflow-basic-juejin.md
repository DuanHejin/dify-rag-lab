# Dify RAG 学习实战 09：用 Workflow 编排两个 LLM 节点生成面试计划

这一篇记录 Dify Workflow 的最小实验。

目标是跑通：

```text
Start 输入变量
↓
LLM 1 提取准备重点
↓
LLM 2 生成准备计划
↓
End 输出结果
```

这次不接知识库。

重点验证 Workflow 的变量传递和节点输出。

## 1. 应用信息

```text
应用名称：求职准备 Workflow
应用类型：Workflow
模型：doubao-seed-2-0-lite-260428
模型供应商：langgenius/volcengine_maas/volcengine_maas
```

节点结构：

```text
开始（用户输入）
-> LLM：提取准备重点
-> LLM 2：生成准备计划
-> 输出
```

## 2. Start 输入字段

Start 节点配置：

```text
job_type：岗位类型，文本，必填
days：天数，数字，必填
weak_points：薄弱项目，文本，非必填
```

测试输入：

```text
job_type = 前端开发
days = 3
weak_points = 算法
```

注意：

Workflow 的入口是 `inputs`。

Chatflow 的入口更偏 `query`。

## 3. LLM 1：提取准备重点

节点名称：

```text
提取准备重点
```

Prompt 结构：

```text
你是一个求职准备分析助手。

请根据用户输入的岗位方向、准备时间和薄弱点，提取本次面试准备的核心重点。

岗位方向：{{job_type}}
准备时间：{{days}}天
薄弱点：{{weak_points}}

请用中文输出，结构如下：

1. 备考优先级
2. 最需要补齐的能力
3. 不建议投入太多时间的内容
```

输出字段：

```text
text
```

测试结果：

```text
节点可以围绕“前端开发 + 3 天 + 算法薄弱”输出准备重点分析。
```

## 4. LLM 2：生成准备计划

节点名称：

```text
生成准备计划
```

关键是引用 LLM 1 的输出：

```text
上一步准备重点：
{{提取准备重点.text}}
```

Prompt 输出要求：

```text
- 中文回答
- 按天拆分
- 每天任务要具体可执行
- 优先围绕上一步准备重点展开
- 不要泛泛而谈
```

测试结果：

```text
LLM 2 能正确拿到 LLM 1 的 text，并生成以算法专项为重点的 3 天前端面试准备计划。
```

## 5. End 输出配置

End 节点配置：

```text
answer = 生成准备计划.text
```

所以 Workflow 最终输出不是自动返回所有节点。

而是只返回 End 节点配置的字段。

这点对 API 调用很重要。

后续要从：

```text
data.outputs.answer
```

取结果。

## 6. 页面调试结果

从 Start 节点开始运行，输入：

```text
job_type = 前端开发
days = 3
weak_points = 算法
```

可以在调试面板里看到：

- Start 节点输出三个输入变量
- LLM 1 接收到变量并输出准备重点
- LLM 2 接收到 LLM 1 的 `text`
- End 节点输出最终 `answer`

这说明变量链路跑通。

## 7. 单节点调试和全链路调试

实验中有一个细节。

单独运行 LLM 节点时，需要手动输入变量。

如果变量手动填错，结果可能看起来异常。

从 Start 节点开始跑全链路时，变量会按实际流程传递。

所以调试建议是：

```text
看节点本身：单节点运行
看变量链路：从 Start 全链路运行
```

## 8. think 标签观察

豆包模型输出中会出现：

```text
<think>...</think>
```

Dify 页面会把这些内容渲染为可折叠的“已深度思考”块。

当一个 `text` 中有多个 `<think>` 片段时，页面可能出现多个折叠块。

当前观察到右侧时间显示为：

```text
0.0s
```

这不影响 End 输出。

但要注意：

```text
如果 LLM 2 引用 LLM 1 的 text，LLM 1 的 think 内容也会进入 LLM 2 上下文。
```

后续优化方向：

```text
1. LLM 1 使用结构化输出
2. 增加代码节点清洗文本
3. LLM 2 Prompt 中明确忽略 think 片段
```

## 9. Workflow 和 Chatflow 的基本区别

本阶段理解：

```text
Workflow：
输入变量驱动，适合一次性任务、批处理、表单生成、结构化流程。

Chatflow：
用户 query 驱动，适合多轮对话、追问、对话式 RAG。
```

## 10. 本阶段结论

这次最小 Workflow 跑通了：

```text
Start 输入字段
LLM 节点变量引用
上游 text 传给下游
End 输出 answer
页面调试查看节点输入输出
```

Workflow 不只是“另一个画布”。

它更适合处理输入明确、输出明确的一次性任务。

下一步可以继续验证 Workflow API 的 blocking / streaming，以及日志追踪。
