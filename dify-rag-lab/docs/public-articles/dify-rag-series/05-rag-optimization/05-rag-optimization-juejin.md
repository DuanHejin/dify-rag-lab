# Dify RAG 学习实战 05：分段、Top K 和 Rerank 调优记录

前面已经解决了知识库召回测试页面问题。

当前状态：

```txt
全文检索可用
向量检索可用
混合检索可用
Jina Rerank 可用
```

接下来开始调 RAG 效果。

核心问题：

```txt
为什么有些问题能命中，但命中的 chunk 不完整？
```

## 1. 初始问题：命中标题但内容不完整

测试问题：

```txt
分段重叠长度是什么意思？
```

召回结果中出现：

```txt
1.4 分段重叠长度
截图中的分段重叠长度是：
```

这个结果相关，但不完整。

它包含标题和开头。

但没有包含完整解释。

这类问题说明：

```txt
召回命中 != 召回内容适合回答
```

## 2. 根因：分段规则导致语义断裂

一开始使用类似：

```txt
分段标识符：\n\n
最大长度：1024 characters
```

问题不只是 `\n\n` 太碎。

更准确地说，是：

```txt
按段落切分
再按最大长度硬切
```

如果一个 Markdown 小节超过最大长度，会被拆成：

```txt
Chunk 1：标题 + 前半段
Chunk 2：后半段解释 / 注意事项 / 示例
```

用户问题通常更容易命中 Chunk 1。

但真正完整答案可能在 Chunk 2。

这会导致：

```txt
命中标题
但答案不完整
```

## 3. 调整切分规则

调优目标：

```txt
让一个 chunk 尽量保留完整语义单元
```

理想 chunk 包含：

```txt
标题
定义
解释
注意事项
示例
```

不理想 chunk：

```txt
标题
半句话
```

调整后，搜索准确性明显提升。

结论：

```txt
RAG 效果优先从 chunk 质量开始调
```

如果命中标题但答案不完整，优先看切片，不要马上换模型。

## 4. Top K 调优

Top K 控制返回候选数量。

取舍：

```txt
Top K 太小：可能漏召回
Top K 太大：引入噪声，增加 token 成本
```

API 验证中，问题：

```txt
Dify 最小镜像升级流程是什么？
```

返回 3 条：

```txt
1. dify-thread-context.md score=0.6939131
2. knowledge-rag.md score=0.2346732
3. dify-learning-plan.md score=0.00046479
```

第一条已经足够回答。

第三条基本是噪声。

所以后续可以尝试：

```txt
Top K = 1 或 2
```

或者开启 score 阈值。

## 5. Score 阈值

当前调试阶段先关闭 Score 阈值。

原因：

```txt
方便观察完整召回结果
避免提前过滤潜在有用 chunk
```

当多次测试后发现分数分布稳定，可以再开启。

例如：

```txt
score_threshold = 0.2
```

但阈值不建议一开始就开。

否则容易误判：

```txt
到底是召回不到
还是被阈值过滤了
```

## 6. Jina Rerank 效果

接入 Jina Rerank 后，混合检索效果明显提升。

推荐配置：

```txt
检索方式：混合检索
Rerank：Jina reranker-v3
Top K：5 或 7
Score 阈值：先关闭
```

Jina Rerank 对当前中文学习笔记 + 中英术语混排材料表现较好。

## 7. qwen3-rerank 对比

也测试了 qwen3-rerank。

阿里云百炼后台额度发生变化，说明模型确实被调用。

结果顺序也发生变化。

示例：

权重排序：

```txt
36 -> 4 -> 16 -> 9 -> 19 -> 11 -> 45
```

qwen3-rerank：

```txt
36 -> 16 -> 19 -> 11 -> 4 -> 45 -> 9
```

结论：

```txt
qwen3-rerank 调用成功
qwen3-rerank 确实发生重排
但当前测试集上效果不如 Jina 明显
```

## 8. 判断 Rerank 是否生效

不能只看请求体里有没有：

```json
"reranking_model": {}
```

关键字段是：

```json
"reranking_enable": true
```

曾经出现过：

```json
"reranking_enable": false,
"reranking_mode": "reranking_model",
"reranking_model": {
  "reranking_model_name": "jina-reranker-v3"
}
```

原因是复用了历史召回测试。

Dify 召回测试历史会保存当时的 `retrieval_model` 快照。

修改 Rerank 后，建议：

```txt
新建一次召回测试
不要复用旧历史记录
```

## 9. Rerank 的边界

Rerank 能做：

```txt
重排已召回候选 chunk
```

Rerank 不能做：

```txt
找回没有进入候选集的 chunk
修复被切坏的 chunk
自动合并相邻 chunk
```

所以调优顺序应该是：

```txt
先优化切片
再优化检索
最后使用 Rerank
```

不要把所有问题都交给 Rerank。

## 10. 当前推荐配置

当前阶段推荐：

```txt
文档：Markdown 学习笔记
切片：避免 \n\n 过度切碎，尽量按标题层级或完整语义块
Embedding：继续使用已验证可用的豆包 / 火山方舟 embedding
检索方式：混合检索
Rerank：Jina reranker-v3
Top K：3-5
Score 阈值：先关闭，稳定后再试 0.2
```

## 11. 本阶段结论

RAG 调优不是只调模型。

完整顺序应该是：

```txt
文档结构
↓
chunk 切分
↓
Embedding
↓
检索方式
↓
Top K
↓
Rerank
↓
Prompt
```

这次最大的结论：

```txt
chunk 切分质量是 RAG 效果的地基
```

如果切片不合理：

```txt
召回可能命中标题
但 LLM 拿不到完整解释
```

下一步把知识库接入 Chat Assistant。

验证最终 API 中的：

```txt
metadata.retriever_resources
```
