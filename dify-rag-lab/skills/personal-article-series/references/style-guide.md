# Style Guide

## Positioning

The user's current long-form writing is a first-person technical transition record. It often starts from a concrete project milestone, then expands into an engineering lesson.

Important anchors:

- The existing "重新部署自己" series already covers the user's unemployment background and the process of building SuperAgentConsole from zero to one.
- Follow-up series should usually begin after a project milestone, such as "SuperAgentConsole 第一阶段跑通之后", "线上部署完成后", or "接入 Dify 学习时".
- Do not restart every series from "10 年前端失业后". Use that only if the user explicitly asks for the origin story again.

## Prose Rhythm

Use short paragraphs.

Often one sentence per paragraph.

Let the article breathe.

Prefer this rhythm:

```text
到这里，我一度以为线上部署差不多完成了。

域名能访问。

HTTPS 正常。

登录正常。

数据库正常。

但真正开始测试 Agent Run 时，新的问题出现了。
```

Use repeated short lines to show state, not to decorate.

## Common Structure

Use this structure for most narrative technical articles:

```text
1. Current stage or assumption
2. A concrete problem, experiment, or decision
3. Initial misunderstanding or first guess
4. Evidence from logs, requests, screenshots, API responses, commands, or UI behavior
5. Root cause or revised understanding
6. Why this matters beyond the single bug or feature
7. What the user did next
8. A grounded closing reflection
```

## Voice

Use first-person singular:

- "我一开始以为..."
- "后来我发现..."
- "这让我意识到..."
- "这一步不是为了..."
- "从这个角度看..."

Prefer contrast patterns:

- "不是 X，而是 Y。"
- "它没有真正解决问题，但让问题更容易观察。"
- "这不是另起炉灶，而是找一个参照物。"

Prefer concrete nouns:

- `Docker Compose`
- `GHCR`
- `K3S`
- `ConfigMap`
- `Secret`
- `CLS`
- `Agent Run`
- `Tool Router`
- `Skill Workflow`
- `retriever_resources`
- `conversation_id`

Avoid generic motivational language:

- Do not write like a corporate newsletter.
- Avoid "赋能", "拥抱变化", "打造闭环", "降本增效" unless quoting or truly needed.
- Avoid exaggerated clickbait such as "彻底搞懂", "保姆级", "全网最细".
- Avoid pretending certainty where the user only observed behavior.

## Technical Detail

Use code blocks for:

- command sequences
- API paths and payload fragments
- logs
- infrastructure chains
- before/after comparisons

Example:

```txt
model_call_start
↓
大约 60 秒
↓
agent_error
```

Example:

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

Do not turn every article into a tutorial. The user's style is half engineering record, half reflection.

## Ending Style

Close by naming the real lesson.

Good ending pattern:

```text
这一步没有让我把项目做得更炫。

但它让我更接近真实线上系统。

代码只是其中一部分。

剩下的，是工程。
```

Use similar gravity, but avoid repeating the exact same line too often across a series.
