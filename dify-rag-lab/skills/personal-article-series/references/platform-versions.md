# Platform Versions

Generate three distinct versions for each article.

## Base / WeChat Official Account

Goal: narrative continuity and reader identification.

Use:

- Title without heavy numbering unless the user wants it.
- First-person opening.
- Short paragraphs.
- A clear emotional or cognitive arc.
- Technical detail appears as evidence inside the story.

Typical title:

```text
做完自己的 Agent 项目后，我为什么开始学习 Dify？
```

Typical opening:

```text
SuperAgentConsole 跑通之后，我有一种很微妙的感觉。

一方面，我确实完成了一个阶段。

但另一方面，项目越往后做，我越能感觉到一件事：

自己从 0 搭一套东西，很容易陷入自己的视角。
```

## Zhihu

Goal: explain the reasoning clearly for readers who want the "why".

Use:

- Same article title or a slightly more question-like title.
- More explicit headings.
- More causal explanation.
- Keep first person, but reduce overly literary transitions.
- Explain tradeoffs and concepts more patiently.

Good headings:

```text
## 为什么在这个阶段学习 Dify
## 先把 Dify 在本地跑起来
## 源码和镜像不是一回事
## 这一阶段真正让我补上的认知
```

Avoid making it too dry. It should still feel like the user's learning record.

## Juejin

Goal: practical technical record.

Use:

- Title format with series and number when appropriate.
- Numbered headings.
- More commands, API paths, response fields, config names, and debugging steps.
- Short summary at the end.

Typical title:

```text
Dify RAG 学习实战 01：做完自己的 Agent 项目后，我为什么开始学习 Dify？
```

Typical structure:

```text
## 1. 背景
## 2. 本地启动 Dify
## 3. Docker Compose 里的服务
## 4. 接入模型供应商
## 5. 源码和镜像的区别
## 6. 本阶段总结
```

Juejin version should be useful to engineers who may copy commands or compare implementation details.

## Shared Rules

- Keep all versions factually aligned.
- Do not make the three versions identical.
- If one version includes commands, ensure the other versions still mention the same key engineering fact.
- Keep code fences closed.
- Prefer Chinese punctuation and Chinese prose, while preserving technical terms in English when they are standard.
