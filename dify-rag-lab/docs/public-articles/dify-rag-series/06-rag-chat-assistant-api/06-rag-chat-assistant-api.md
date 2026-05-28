# 把知识库接进聊天助手后，RAG 才从“能搜”变成“能用”

知识库能召回以后，我做的下一件事，是把它接进 Chat Assistant。

这一步很关键。

因为知识库召回测试，只能说明：

```text
知识库自己能搜
```

但真正的应用要验证的是：

```text
用户提问
↓
Chat Assistant 接收问题
↓
知识库检索
↓
Rerank 排序
↓
LLM 基于检索结果回答
↓
API 返回 answer 和 retriever_resources
```

也就是说，RAG 要从“知识库能力”进入“应用能力”。

这个阶段跑通以后，我才觉得 Dify 的 RAG 主链路真正闭环了。

## 把知识库绑定到求职聊天助手

我之前已经创建了一个应用：

```text
简单的求职聊天助手
```

这个应用最开始只是普通 Chat Assistant。

它能根据用户问题给求职建议。

但它没有自己的知识库。

后来我把：

```text
dify学习知识库
```

绑定到这个助手上。

同时修改提示词，让它优先使用知识库内容。

大意是：

```text
如果知识库中存在相关内容，优先基于知识库回答。
如果知识库没有相关内容，请明确说明没有找到相关资料，再给出有限的通用建议。
```

这个提示词很重要。

因为接入知识库后，模型仍然有自己的通用知识。

如果不约束它，它可能会直接凭模型记忆回答。

而我的目标是验证：

它是否真的基于知识库回答。

## 调试预览里，引用来源出现了

绑定知识库后，我在调试预览里问了两个问题。

它们都命中了知识库。

页面里能看到引用来源。

豆包模型也基于召回内容生成了回答。

这一步和单独的召回测试不同。

召回测试只是看：

```text
系统能不能搜到 chunk
```

Chat Assistant 调试预览看的是：

```text
模型能不能拿着这些 chunk 生成回答
```

这已经更接近真实用户使用场景。

一个知识库系统不能只停留在“搜到了”。

最终还是要回答得出来。

## Blocking API 里看 retriever_resources

页面验证后，我继续用 API 调用。

请求还是：

```text
POST /v1/chat-messages
```

这次问：

```text
Dify 最小镜像升级流程是什么？
```

返回里有完整回答。

也有：

```json
"metadata": {
  "retriever_resources": []
}
```

这一次不再是空数组。

里面返回了 3 条知识库命中结果。

第一条非常准确：

```text
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程...
```

这条内容正好就是之前记录的最小镜像升级流程。

包括：

```text
备份 docker-compose.yaml
备份 .env
备份 volumes
修改 dify-api / dify-web 镜像版本
docker-compose down
docker-compose pull
docker-compose up -d
```

模型最后生成的回答，也确实是基于这段资料。

这一步让我确认：

RAG 不只是页面里看起来引用了。

API 层也能拿到检索资源。

这对真实应用很重要。

因为前端如果要展示引用来源，就需要这些字段。

## score 也能帮忙判断噪声

这次返回的 3 条里，分数差距很明显。

第一条：

```text
score = 0.6939131
```

第二条：

```text
score = 0.2346732
```

第三条：

```text
score = 0.00046479
```

第一条是主要有效上下文。

第二、三条明显弱很多。

这说明 Top K 返回 3 条时，后面可能已经是噪声或弱相关内容。

如果后续追求更干净的回答，可以考虑：

```text
Top K 调小
开启 Score 阈值
优化切片
继续依赖 Rerank
```

但在当前学习阶段，我没有马上继续调。

因为主链路已经验证成功。

先把链路跑通，比过早追求最优参数更重要。

## 无关问题也通过了

我又问了一个明显无关的问题：

```text
今天北京天气怎么样？
```

返回里：

```json
"retriever_resources": []
```

回答也没有强行引用知识库。

它说知识库中没有北京今日天气的相关资料，并说明自己主要是求职准备助手，不支持实时天气查询。

这个结果很重要。

RAG 应用不应该只会“有资料时回答”。

它还要知道什么时候没有资料。

如果无关问题也硬召回，或者模型硬编一个答案，那这个知识库助手就不可靠。

所以无关问题测试不是可选项。

它是验证 RAG 边界的一部分。

## Streaming 模式下，引用来源在 message_end 里

接着我测试了 streaming。

流式返回时，会不断返回：

```json
{
  "event": "message",
  "answer": "..."
}
```

这些 message 事件只包含增量回答。

它们不会带 `retriever_resources`。

最终会返回：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [],
    "usage": {}
  }
}
```

也就是说：

Streaming 模式下，引用来源是在最后的 `message_end` 里返回。

这对前端设计很有影响。

如果页面要边流式显示回答，边展示引用来源，就不能指望一开始就拿到引用。

更合理的做法可能是：

回答流式输出时，先显示“正在生成”。

等 `message_end` 到达后，再补充引用来源。

或者在 UI 上把引用区设计成后加载。

这个细节很像我做 SuperAgentConsole 时处理 AgentEvent。

不同事件携带不同信息。

前端不能假设所有数据一开始就有。

## 到这里，RAG 主链路闭环了

这一步完成后，我回头看整个 Dify RAG 学习过程，链路已经比较完整：

```text
文档导入
↓
切片调优
↓
Embedding
↓
全文 / 向量 / 混合检索
↓
Rerank
↓
Chat Assistant 绑定知识库
↓
调试预览引用来源
↓
blocking API retriever_resources
↓
streaming API message_end
↓
无关问题 retriever_resources=[]
```

这已经不是概念上的 RAG。

而是一个实际跑通的应用链路。

我也更清楚 Dify 在这里做了什么。

它把复杂的 RAG 能力产品化：

知识库页面负责文档和索引。

召回测试负责验证检索。

应用编排负责接入知识库。

API 返回 `retriever_resources`。

日志和监测负责后续观察。

而我需要理解的是：

这些页面背后对应的工程概念是什么。

## 下一步为什么要看 Chatflow

Chat Assistant 很方便。

但它有一个特点：

链路比较黑盒。

你能配置知识库。

也能看到引用。

但中间每一步怎么串起来，不够直观。

所以下一步，我准备看 Chatflow。

因为 Chatflow 可以把：

```text
用户输入
知识检索
LLM
Answer
```

拆成可视化节点。

这会更适合和我自己的 SuperAgentConsole 对照。

Chat Assistant 让我知道 Dify 的 RAG 应用可以怎么快速配置。

Chatflow 可能会让我看清楚：

它是如何把一次对话编排成一个流程。

这也是我接下来最想理解的部分。
