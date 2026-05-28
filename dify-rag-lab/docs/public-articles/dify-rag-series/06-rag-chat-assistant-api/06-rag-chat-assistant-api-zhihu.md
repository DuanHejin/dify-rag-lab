# 把 Dify 知识库接进 Chat Assistant 后，RAG 才算真正跑通

知识库召回测试通过后，我继续把它接入 Chat Assistant。

因为单独的召回测试只能说明：

```txt
知识库能搜到相关 chunk
```

但真正的应用链路应该是：

```txt
用户提问
↓
Chat Assistant
↓
知识库检索
↓
Rerank
↓
LLM 基于召回内容回答
↓
API 返回 answer 和 retriever_resources
```

这一步跑通后，RAG 才从“知识库可用”变成“应用可用”。

## 1. 绑定知识库到聊天助手

之前已经有一个应用：

```txt
简单的求职聊天助手
```

最开始它只是普通 Chat Assistant。

这次把知识库：

```txt
dify学习知识库
```

绑定到应用中。

同时修改 Prompt，增加规则：

```txt
如果知识库中存在相关内容，优先基于知识库回答。
如果知识库没有相关内容，请明确说明没有找到相关资料，再给出有限的通用建议。
```

这条规则很重要。

因为模型本身有通用知识。

如果不限制，它可能绕过知识库，直接凭模型能力回答。

而这次要验证的是：

```txt
回答是否真的基于知识库
```

## 2. 页面调试预览

绑定知识库后，在调试预览中问了两个知识库相关问题。

结果：

```txt
都正确引用了知识库文章
模型基于引用内容进行了回答
```

页面调试验证的是：

```txt
知识库召回结果是否进入应用回答
```

它和单独召回测试不同。

召回测试只看检索。

Chat Assistant 调试看最终回答。

## 3. Blocking API 验证

接着用 API 调用：

```txt
POST /v1/chat-messages
response_mode = blocking
```

问题：

```txt
Dify 最小镜像升级流程是什么？
```

返回中有：

```json
"metadata": {
  "retriever_resources": [...]
}
```

第一条命中：

```txt
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程...
```

这说明 API 层也拿到了知识库检索结果。

不是只有页面调试里能看到引用。

## 4. retriever_resources 的价值

`retriever_resources` 能看到：

```txt
命中的知识库
命中的文档
命中的 segment
score
content
```

这对 RAG 调试非常关键。

如果只有最终 answer，很难判断：

```txt
模型是否真的用了知识库
引用的是哪段内容
召回是否准确
是否有噪声 chunk
```

有了 `retriever_resources`，就可以检查：

```txt
第一条是不是正确资料
分数是否明显高于后续结果
内容是否足够回答问题
```

## 5. score 可以帮助判断噪声

这次返回 3 条资源。

分数大概是：

```txt
0.6939131
0.2346732
0.00046479
```

第一条明显最相关。

第二、三条相关性弱很多。

这说明当前 Top K=3 时，后面可能已经包含噪声。

后续如果想减少噪声，可以尝试：

```txt
Top K = 1 或 2
开启 score 阈值
优化切片
继续使用 Rerank
```

但当前阶段没有继续调参。

因为主链路已经验证成功。

## 6. 无关问题验证

还测试了无关问题：

```txt
今天北京天气怎么样？
```

返回：

```json
"retriever_resources": []
```

回答也没有强行引用知识库。

而是说明：

```txt
知识库中没有北京天气相关资料
当前助手主要用于求职准备
```

这说明无关问题处理符合预期。

RAG 应用不仅要能回答相关问题。

也要能识别没有资料的问题。

## 7. Streaming API 验证

再测试：

```txt
response_mode = streaming
```

中间会持续返回：

```json
{
  "event": "message",
  "answer": "..."
}
```

这些事件只包含增量回答。

`retriever_resources` 不在普通 message 事件里。

最终 `message_end` 才返回：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [...],
    "usage": {}
  }
}
```

所以前端如果要展示引用来源，需要注意：

```txt
流式回答可以边收边展示
引用来源要等 message_end 后再渲染
```

这是一个很实际的前端实现点。

## 8. 到这里，RAG 主链路闭环

当前已经验证：

```txt
文档导入
切片调优
Embedding
基础召回
Rerank
Chat Assistant 绑定知识库
调试预览引用来源
blocking API retriever_resources
streaming API message_end
无关问题 retriever_resources=[]
```

这说明 Dify 中的 RAG 主链路已经跑通。

它不再只是知识库里能搜到内容。

而是已经能进入实际应用回答。

## 9. 下一步为什么看 Chatflow

Chat Assistant 很方便。

但链路比较黑盒。

知识库如何检索、结果如何给到 LLM、回答如何输出，中间不够可视化。

所以下一步适合看 Chatflow。

因为 Chatflow 可以把：

```txt
用户输入
知识检索
LLM
Answer
```

拆成节点。

这样更适合理解 Dify 的编排方式。

也更容易和自研 SuperAgentConsole 中的：

```txt
Conversation
AgentRun
Retrieval
SkillWorkflow
AgentEvent
```

做对照。

这也是下一阶段要继续看的内容。
