# RAG Import Manifest

> 用途：记录 Knowledge / RAG 阶段计划导入 Dify 知识库的真实学习文档。

## 导入原则

- 优先导入 `dify-rag-lab/docs/` 下的真实学习记录。
- 不导入整个 Dify 源码，避免噪声过大。
- 不优先使用临时编造的样例文档，RAG 结果要能反映真实探索经验。
- 后续每新增一个阶段总结文档，都可以继续加入知识库。

## 第一批建议导入文档

| 文件 | 主题 | 用途 |
| --- | --- | --- |
| `dify-rag-lab/docs/01-chat-assistant/api.md` | Chat Assistant 阶段实验记录 | 检索 API、streaming、多轮、发布机制、模型参数实验 |
| `dify-rag-lab/docs/00-overview/learning-plan.md` | 总学习计划 | 检索阶段路线、完成状态和后续计划 |
| `dify-rag-lab/docs/00-overview/thread-context.md` | 线程上下文 | 检索项目背景、环境状态、和 Super Agent Console 的对照目标 |
| `dify-rag-lab/docs/02-knowledge-rag/plan.md` | RAG 学习计划 | 检索知识库阶段的执行步骤和验收标准 |
| `dify-rag-lab/docs/02-knowledge-rag/config-notes.md` | RAG 配置项说明 | 检索分段、清洗、索引方式、检索方式、Top K、Score 阈值等配置解释 |

## 可选导入文档

| 文件 | 主题 | 用途 |
| --- | --- | --- |
| `dify-rag-lab/experiments/prompts/chat-assistant-prompts.md` | Prompt 实验记录 | 检索提示词版本、发布机制和 Prompt 设计意图 |

## 推荐知识库名称

```text
Dify RAG Lab 学习知识库
```

## 推荐测试问题

```text
Chat Assistant 阶段验证了哪些 API 能力？
```

```text
Dify API 的 streaming 模式有哪些事件？
```

```text
为什么修改提示词后需要发布更新？
```

```text
Dify 和 Super Agent Console 的对照目标是什么？
```

```text
Knowledge / RAG 阶段下一步应该做什么？
```

```text
混合检索和向量检索有什么区别？
```

```text
Top K 设置为 3 代表什么？
```
