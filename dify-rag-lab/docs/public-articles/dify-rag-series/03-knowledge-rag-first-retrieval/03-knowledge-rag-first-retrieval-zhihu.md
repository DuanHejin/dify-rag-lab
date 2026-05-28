# 用 Dify 做知识库 RAG 后，我发现上传文档只是开始

Chat Assistant 跑通之后，我开始测试 Dify 的知识库，也就是 RAG。

在概念上，RAG 很容易理解：

```txt
用户提问
↓
检索知识库
↓
把相关内容交给大模型
↓
模型基于资料回答
```

但真正做了一遍之后，我发现问题没这么简单。

RAG 不是“上传文档，然后问问题”。

中间至少还有：

```txt
文档选择
文本分段
清洗规则
Embedding 模型
向量库
全文检索
向量检索
混合检索
Rerank
引用来源
无关问题兜底
```

这篇先记录第一轮知识库实验。

重点是：

```txt
我为什么用自己的学习文档做知识库
文档导入后发生了什么
RAG API 里 retriever_resources 有什么用
```

## 1. 为什么不用整个 Dify 源码做知识库

一开始我想过，直接把整个 Dify 源码或官方文档导入知识库。

但后来没有这么做。

原因很简单：

我不是要测试 Dify 能不能处理大规模资料。

我是要理解 RAG 链路。

所以更适合用自己熟悉的文档。

我导入的是这段学习过程里的 Markdown：

```txt
dify-thread-context.md
dify-learning-plan.md
chat-assistant-api.md
knowledge-rag-plan.md
knowledge-rag-config-notes.md
```

这些文档记录了：

```txt
Dify 本地部署
Chat Assistant API
提示词发布更新
知识库配置项
RAG 召回测试
Docker 镜像升级
Jina Rerank
```

这样做有一个好处：

我知道正确答案大概在哪个文档里。

例如：

```txt
Dify 最小镜像升级流程是什么？
```

应该命中：

```txt
dify-thread-context.md
```

再比如：

```txt
分段重叠长度是什么意思？
```

应该命中：

```txt
knowledge-rag-config-notes.md
```

用自己熟悉的材料做知识库，能更准确判断召回质量。

## 2. Embedding 不是聊天模型

做知识库之前，需要先配置 Embedding 模型。

这也是我一开始容易混淆的地方。

我已经接入了豆包聊天模型。

但知识库向量化需要的是 Embedding。

两者作用不同：

```txt
聊天模型：生成回答
Embedding 模型：把文本转成向量，用于语义检索
Rerank 模型：对候选检索结果重新排序
```

所以 RAG 里不是一个模型解决所有问题。

我最终接入了火山方舟可用的 Embedding 模型：

```txt
embeddingversion
```

接入后，Dify 才能对知识库做高质量索引。

## 3. 创建知识库并导入文档

我创建的知识库名称是：

```txt
dify学习知识库
```

导入了 5 个 Markdown 文档。

导入完成后，文档状态全部可用。

chunk 数量大概是：

```txt
knowledge-rag-config-notes.md：169
chat-assistant-api.md：66
dify-learning-plan.md：47
knowledge-rag-plan.md：40
dify-thread-context.md：104
```

这里有一个重要结论：

```txt
文档状态可用，不等于 RAG 效果可用。
```

“可用”只能说明：

```txt
文档导入完成
切片完成
索引流程完成
```

但它不保证：

```txt
问题一定能召回
召回 chunk 一定完整
页面一定能正常展示
模型回答一定基于资料
```

这些都需要继续验证。

## 4. 文本分段决定了很多事情

Dify 导入文档时，会进入“文本分段与清洗”。

这里有几个关键配置：

```txt
分段标识符
分段最大长度
分段重叠长度
预处理规则
索引方式
检索方式
Top K
Score 阈值
Rerank
```

一开始这些配置看起来只是参数。

但真正看 chunk 预览后，会发现它们直接影响召回效果。

如果 chunk 太碎：

```txt
可能只召回标题
没有完整解释
```

如果 chunk 太长：

```txt
可能带入太多无关内容
增加噪声和 token 成本
```

如果标题和正文被切到不同 chunk：

```txt
模型可能只拿到半段上下文
```

所以 RAG 效果不是只靠模型。

chunk 切得好不好，影响非常大。

## 5. 三种检索方式

Dify 里常见的检索方式包括：

```txt
全文检索
向量检索
混合检索
```

全文检索偏关键词。

适合：

```txt
Top K
docker-compose
retriever_resources
reranking_enable
```

这种明确术语。

向量检索偏语义。

适合自然语言问题。

混合检索结合两者。

但混合检索不一定天然效果最好。

我的学习笔记里有很多中英混排术语和命令。

这种情况下，关键词非常重要。

后面我接入 Jina Rerank 后，混合检索效果才明显变好。

## 6. retriever_resources 是判断 RAG 是否生效的关键

在普通 Chat Assistant 阶段，API 返回里：

```txt
metadata.retriever_resources = []
```

接入知识库后，问知识库相关问题，会返回命中片段。

例如问：

```txt
Dify 最小镜像升级流程是什么？
```

返回里能看到：

```txt
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程...
```

这个字段很重要。

因为它能告诉你：

```txt
这次有没有真的检索知识库
命中了哪个知识库
命中了哪篇文档
命中了哪段内容
分数是多少
```

如果只有 answer，没有 `retriever_resources`，就很难判断回答到底是不是基于知识库。

## 7. 无关问题也要测试

RAG 不只要测相关问题。

还要测无关问题。

我问：

```txt
今天北京天气怎么样？
```

返回：

```txt
retriever_resources = []
```

回答也没有硬引用知识库。

而是说明：

```txt
知识库中没有北京天气相关资料
当前助手主要用于求职准备
```

这是符合预期的。

一个知识库助手，不能什么问题都硬套知识库。

该说没有资料时，就应该说没有。

## 8. 本阶段结论

这一轮做完后，我对 RAG 的理解从：

```txt
上传文档让模型回答
```

变成了：

```txt
文档整理
↓
切片
↓
Embedding
↓
索引
↓
检索
↓
Rerank
↓
上下文构造
↓
LLM 回答
↓
引用来源观察
```

上传文档只是开始。

后面每一步都会影响效果。

尤其是：

```txt
chunk 是否完整
检索方式是否适合文档类型
retriever_resources 是否命中正确内容
无关问题是否能正确兜底
```

下一步，我遇到了一个更真实的问题：

知识库显示可用。

但召回测试一开始就是搜不出来。

甚至全文检索页面还报错。

这部分排查从页面错误、Network 请求，一直查到 Dify 后端和 Weaviate。
