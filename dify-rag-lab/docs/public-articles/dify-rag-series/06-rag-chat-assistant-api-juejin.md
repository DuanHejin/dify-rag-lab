# Dify RAG 学习实战 06：Chat Assistant 接入知识库并验证 retriever_resources

前面已经完成：

```txt
知识库创建
文档导入
切片调优
全文检索
向量检索
混合检索
Jina Rerank
```

接下来把知识库接入 Chat Assistant。

目标是验证完整链路：

```txt
用户问题
↓
Chat Assistant
↓
知识库检索
↓
Rerank
↓
LLM 生成回答
↓
API 返回 answer + retriever_resources
```

## 1. 绑定知识库

已有应用：

```txt
简单的求职聊天助手
```

绑定知识库：

```txt
dify学习知识库
```

检索配置：

```txt
混合检索
Jina reranker-v3
Top K：3
Score 阈值：关闭
```

Prompt 增加规则：

```txt
如果知识库中存在相关内容，优先基于知识库回答。
如果知识库没有相关内容，请明确说明没有找到相关资料，再给出有限的通用建议。
```

修改后需要：

```txt
发布更新
```

否则 API 仍可能使用旧配置。

## 2. 调试预览验证

在调试预览中测试知识库相关问题。

结果：

```txt
能够正确引用知识库文章
豆包模型基于召回内容生成回答
```

这一步验证：

```txt
知识库检索结果已经进入 Chat Assistant 回答链路
```

## 3. Blocking API 请求

接口：

```txt
POST /v1/chat-messages
```

请求：

```json
{
  "inputs": {
    "job_type": "前端开发"
  },
  "query": "Dify 最小镜像升级流程是什么？",
  "response_mode": "blocking",
  "conversation_id": "",
  "user": "abc-123"
}
```

返回中关键字段：

```txt
answer
metadata.retriever_resources
metadata.usage
conversation_id
message_id
```

## 4. retriever_resources 结果

返回中：

```txt
metadata.retriever_resources 返回 3 条
```

第一条：

```txt
position: 1
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程...
```

第二条：

```txt
document_name: knowledge-rag.md
score: 0.2346732
content: Docker 代理、Jina API Key、Rerank 配置相关记录
```

第三条：

```txt
document_name: dify-learning-plan.md
score: 0.00046479
content: Dify / RAG 学习计划开头
```

结论：

```txt
第一条是主要有效上下文
第二、三条相关性明显较低
```

如果后续希望减少噪声，可以尝试：

```txt
Top K = 1 或 2
score_threshold = 0.2
继续优化切片
```

## 5. answer 与检索内容一致

模型回答中包含：

```txt
进入 Dify docker 目录
备份 docker-compose.yaml
备份 .env
备份 volumes
修改 dify-api / dify-web 镜像版本
docker-compose down
docker-compose pull
docker-compose up -d
```

这些内容来自第一条命中 chunk。

说明：

```txt
answer 基于 retriever_resources 生成
```

这一步证明 RAG 在应用 API 层生效。

## 6. 无关问题测试

测试问题：

```txt
今天北京天气怎么样？
```

返回：

```json
{
  "metadata": {
    "retriever_resources": []
  }
}
```

回答中说明：

```txt
知识库中没有北京天气相关资料
当前助手主要用于求职准备
```

结论：

```txt
无关问题不会强行引用知识库
retriever_resources 为空
```

这是 RAG 边界验证。

## 7. Streaming API

请求参数：

```json
"response_mode": "streaming"
```

流式返回中，普通 message 事件：

```json
{
  "event": "message",
  "answer": "<think>\n我"
}
```

特点：

```txt
message 事件只返回增量 answer
不返回 retriever_resources
```

最终 `message_end`：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [...],
    "usage": {}
  }
}
```

结论：

```txt
Streaming 模式下 RAG 同样生效
retriever_resources 在 message_end 中返回
```

前端实现建议：

```txt
先流式展示 answer
message_end 到达后再展示引用来源
```

## 8. 当前 RAG 主链路

到这里，Dify RAG 主链路已经完成：

```txt
Markdown 文档导入
↓
切片调优
↓
Embedding 索引
↓
知识库召回测试
↓
Jina Rerank
↓
Chat Assistant 绑定知识库
↓
调试预览引用
↓
blocking API 验证 retriever_resources
↓
streaming API 验证 message_end
↓
无关问题验证
```

## 9. 和自研项目的对照

Dify 中：

```txt
retriever_resources
```

可以类比自研项目未来可能需要的：

```txt
RetrievalTrace
Citation
ContextSource
```

Chat Assistant 对 RAG 做了较高层封装。

它适合快速验证应用效果。

但如果要看清楚每个步骤如何编排，下一步更适合进入 Chatflow。

## 10. 下一步

下一阶段学习 Chatflow。

重点看：

```txt
用户输入节点
知识检索节点
LLM 节点
Answer 节点
节点变量传递
API streaming 事件
```

目的：

```txt
把 Chat Assistant 里的黑盒 RAG 链路拆成可视化流程
```
