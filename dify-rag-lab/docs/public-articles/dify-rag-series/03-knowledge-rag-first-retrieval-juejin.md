# Dify RAG 学习实战 03：用自己的 Markdown 笔记搭建知识库

前面已经完成了 Chat Assistant 的基础验证：

```txt
Prompt
变量
调试预览
发布更新
blocking API
streaming API
conversation_id
日志与监测
```

接下来开始验证 Dify Knowledge / RAG。

目标是：

```txt
把自己的 Dify 学习笔记导入知识库
通过检索和 API 验证模型是否能基于这些文档回答问题
```

## 1. 为什么用自己的 Markdown 文档

没有直接导入整个 Dify 源码。

原因是当前目标不是测试大规模知识库能力，而是理解 RAG 链路。

所以选择导入自己熟悉的文档：

```txt
dify-thread-context.md
dify-learning-plan.md
chat-assistant-api.md
knowledge-rag-plan.md
knowledge-rag-config-notes.md
```

这些文档记录了真实学习过程：

```txt
Dify 本地部署
Chat Assistant API
Prompt 发布更新
知识库配置项
RAG 测试记录
镜像升级流程
```

使用熟悉文档的好处是：

```txt
可以判断召回是否正确
可以知道答案应该在哪个文档
可以更容易定位切片问题
```

例如：

```txt
Dify 最小镜像升级流程是什么？
```

预期命中：

```txt
dify-thread-context.md
```

问题：

```txt
分段重叠长度是什么意思？
```

预期命中：

```txt
knowledge-rag-config-notes.md
```

## 2. Embedding 模型准备

知识库不是只需要聊天模型。

RAG 中至少涉及三类模型能力：

```txt
LLM：生成最终回答
Embedding：文本向量化，用于语义检索
Rerank：候选结果重排
```

之前已经接入豆包聊天模型。

但知识库索引需要 Embedding。

最终接入火山方舟可用的 Embedding 模型：

```txt
embeddingversion
```

接入后，Dify 才能对文档进行高质量索引。

## 3. 创建知识库

知识库名称：

```txt
dify学习知识库
```

导入 5 个 Markdown 文档。

最终状态：

```txt
5 个文档全部可用
```

chunk 数量：

```txt
knowledge-rag-config-notes.md：169
chat-assistant-api.md：66
dify-learning-plan.md：47
knowledge-rag-plan.md：40
dify-thread-context.md：104
```

这里要注意：

```txt
文档状态可用 != RAG 效果可用
```

文档可用只能说明：

```txt
导入完成
切片完成
索引流程完成
```

但还需要继续验证：

```txt
是否能召回
是否命中正确文档
chunk 是否完整
是否能进入模型上下文
最终回答是否基于知识库
```

## 4. 文本分段与清洗

导入文档时，需要配置文本分段与清洗。

关键配置包括：

```txt
分段标识符
分段最大长度
分段重叠长度
预处理规则
索引方式
```

第一轮使用通用分段。

重点观察：

```txt
标题是否和正文在同一个 chunk
chunk 是否过短
chunk 是否过长
是否存在语义断裂
代码块是否被切开
```

后续调优时发现：

```txt
chunk 质量对召回效果影响很大
```

如果标题和正文被切开，可能出现：

```txt
召回命中标题
但回答所需解释在另一个 chunk
```

这种情况下，调 Top K 或 Rerank 只能缓解，不能从根源解决。

## 5. 检索方式

Dify 召回测试中主要验证三种检索：

```txt
全文检索
向量检索
混合检索
```

全文检索：

```txt
偏关键词
适合 Top K / docker-compose / retriever_resources 等明确术语
```

向量检索：

```txt
偏语义
适合自然语言问题
```

混合检索：

```txt
结合关键词和语义
后续配合 Rerank 效果更好
```

由于学习笔记里有大量中英混排术语，关键词检索很重要。

所以不能简单认为向量检索一定优于全文检索。

## 6. 召回测试问题

设计了一组固定问题：

```txt
Top K 设置为 3 代表什么？
分段重叠长度是什么意思？
Dify 最小镜像升级流程是什么？
docker compose 和 docker-compose 有什么区别？
summary_index_setting enable 为 null 为什么会报错？
```

这些问题覆盖：

```txt
知识库配置项
部署经验
API 调试问题
平台 bug 记录
```

固定问题的好处是：

```txt
方便对比不同检索方式
方便对比不同切片规则
方便对比不同 Rerank 模型
```

## 7. retriever_resources 字段

Chat Assistant 绑定知识库后，API 返回中可以看到：

```txt
metadata.retriever_resources
```

示例字段：

```txt
dataset_id
dataset_name
document_id
document_name
segment_id
score
content
```

例如：

```txt
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程...
```

这个字段用于判断：

```txt
是否触发知识库检索
命中了哪个知识库
命中了哪篇文档
命中了哪个 chunk
相关性分数是多少
```

对 RAG 调试非常关键。

## 8. 无关问题验证

还需要测试无关问题。

测试问题：

```txt
今天北京天气怎么样？
```

预期：

```txt
不应该强行引用知识库
```

实际结果：

```txt
retriever_resources = []
```

模型回答中说明知识库没有相关资料，并把能力范围引回求职准备助手。

这个结果符合预期。

## 9. 本阶段结论

第一轮 Dify 知识库实验完成后，可以把 RAG 拆成：

```txt
文档导入
↓
文本切片
↓
Embedding
↓
索引
↓
召回
↓
Rerank
↓
上下文构造
↓
LLM 回答
↓
retriever_resources 观察
```

关键结论：

```txt
上传文档只是开始
Embedding 和聊天模型不是一回事
chunk 质量会直接影响召回
全文检索适合明确术语
向量检索适合语义问题
混合检索需要结合实际材料调参
retriever_resources 是判断 RAG 是否生效的重要字段
```

下一阶段进入排查：

```txt
知识库显示可用，但召回测试一开始没有结果
全文检索页面还出现渲染错误
```

这部分会涉及：

```txt
Network 响应
API 日志
Weaviate
Dify 版本升级
```
