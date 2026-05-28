# Dify 知识库明明导入成功了，为什么一开始就是搜不出来？

做 RAG 最容易产生的错觉，是看到文档状态“可用”以后，就以为知识库已经能用了。

我一开始也是这么想的。

5 个 Markdown 文档全部导入成功。

状态全部可用。

chunk 数量也能看到。

Embedding 模型也配置好了。

从页面上看，这个知识库应该已经准备好了。

但真正开始召回测试时，问题来了。

我输入：

```text
Top K 设置为 3 代表什么？
```

页面没有任何召回结果。

再换几个问题。

还是没有。

直接搜关键词。

还是不行。

那一刻我有点怀疑：

是不是文档只是显示导入成功，但实际上向量没有写入？

是不是 Embedding 模型配置错了？

是不是 Weaviate 里没有数据？

是不是 Dify 这个版本的知识库有 bug？

后来这段排查，变成了我学习 Dify RAG 过程中最有价值的一段。

因为它让我意识到，RAG 出问题时，不能只看页面。

要一层一层拆。

## 第一个坑：追加文档时报 summary_index_setting.enable 为 null

第一次导入四个文件时，一切正常。

但后来我往同一个知识库里追加第五个文件时，页面报错了。

Network 里能看到请求体里有：

```json
"summary_index_setting": {
  "enable": null,
  "model_name": null,
  "model_provider_name": null,
  "summary_prompt": null
}
```

后端返回：

```text
Input tag 'None' found using 'enable' does not match any of the expected tags: False, True
```

这个错误很直观：

后端期望 `enable` 是 `true` 或 `false`。

但页面传了 `null`。

后来我在知识库设置里把“摘要自动生成”开关打开一次，再关闭一次。

再次预览 chunk，就正常了。

这个问题说明一件事：

页面默认状态不一定等于后端期望状态。

有些开关如果没有显式保存，可能会传出 `null`。

解决方法不复杂。

但如果不看 Network，请求体里这个细节根本发现不了。

## 第二个坑：文档内搜索直接 500

后来我在某个文档里搜索分段。

结果接口返回 500。

api 日志里出现：

```text
psycopg2.errors.InvalidParameterValue: cannot extract elements from a scalar
```

对应 SQL 里有一段：

```text
jsonb_array_elements_text(CAST(document_segments.keywords AS JSONB))
```

大概意思是：

代码把 `keywords` 当作 JSON 数组处理。

但实际某些数据可能是标量。

所以 PostgreSQL 无法从标量里提取数组元素。

这个问题和 RAG 召回不是一回事。

它是控制台“文档内分段搜索”接口的问题。

但它会干扰判断。

因为页面报错以后，很容易误以为知识库整体坏了。

这也是我后来反复提醒自己的：

页面功能报错，不等于底层检索不可用。

## 第三个坑：全文检索有结果，但页面崩了

最关键的一次排查，是全文检索。

我在召回测试里切换到全文检索。

页面显示：

```text
渲染此组件时发生了意外错误
```

一开始看起来像是全文检索失败。

但我打开 Network，看接口返回，发现不是这样。

接口其实返回了 records。

第一条就是：

```text
Top K 设置为 3 代表什么？
```

也就是说：

后端检索成功了。

页面展示失败了。

浏览器控制台报错：

```text
TypeError: Cannot read properties of null (reading 'split')
```

对应代码类似：

```js
const y = f.name.split(".").slice(-1)[0]
```

这里的 `f` 是：

```js
segment.document
```

但接口返回里的 `segment.document` 是：

```json
{
  "id": null,
  "data_source_type": null,
  "name": null,
  "doc_type": null,
  "doc_metadata": null
}
```

所以 `f.name` 是 `null`。

再调用 `split()`，页面直接崩。

这个问题让我很确定：

不是全文检索没结果。

是结果返回后，前端渲染时因为空值保护不足崩了。

## 升级到 1.14.2 后，页面问题解决

当时我看了 Dify 官方 release。

发现新版本里提到修复了 Knowledge hit-testing rendering 相关问题。

于是把本地 Dify 从 1.14.1 升级到 1.14.2。

升级后再测：

全文检索能正常展示。

向量检索也能正常展示。

这说明之前页面问题确实和版本 bug 有关。

但这次也让我学到一个排查方法：

不要只看页面结论。

要看：

```text
Network 响应有没有 records
api 日志有没有异常
数据库里 segment 是否正常
向量库里对象是否存在
```

页面显示失败，只能说明页面失败。

不能直接等同于 RAG 失败。

## 我还直接查了 Weaviate

为了确认是不是向量库没有数据，我继续查 Weaviate。

当时的疑问是：

文档状态 completed。

segment 也有 `index_node_id`。

但召回测试没结果。

那向量库里到底有没有对象？

后来通过 Weaviate REST / GraphQL 查，确认 collection 存在，对象也存在，直接 BM25 查询 `Top K` 能命中正确片段。

这说明：

```text
文档不是没写入
Weaviate 里也不是空的
底层全文检索可以命中
```

问题继续收窄。

很多时候，排查就是把“不可能”一个个排除。

不是向量库空。

不是文档没导入。

不是所有检索都失败。

那就继续看 Dify hit-testing 链路和前端展示。

## 混合检索的问题更隐蔽

全文和向量检索恢复后，混合检索一开始仍然不稳定。

后来拆开看，发现混合检索加权路径里可能出现一个问题：

全文检索返回的某些文档，`vector` 是空列表。

但加权重排时会拿 query vector 和 document vector 算相似度。

如果一个是 2048 维向量，一个是空数组，就会出问题。

这也是为什么我后来没有一直死磕“混合检索 + 权重设置”。

而是接入真正的 Rerank 模型。

接入 Jina Rerank 后，混合检索的效果明显改善。

这件事让我对 RAG 又多了一层理解：

混合检索不是简单地把全文和向量加起来。

中间还涉及结果融合、分数计算和重排。

任何一步有空值或维度问题，都可能影响最终结果。

## Jina API Key 添加失败，其实是容器网络问题

接 Jina Rerank 时，又遇到一个问题。

在 Dify 页面添加 Jina API Key 失败。

报错大概是：

```text
Failed to establish a new connection: [Errno 111] Connection refused
```

一开始看起来像 API Key 有问题。

但如果是 Key 错，应该是 401 或 invalid key。

这个错误发生在建立连接阶段。

于是我在宿主机上 curl：

```bash
curl https://api.jina.ai/v1/embeddings
```

返回：

```json
{
  "code": "AUTH_MISSING_API_KEY"
}
```

这说明宿主机网络是通的。

只是没带 API Key。

问题就变成：

宿主机能访问 Jina。

Dify 容器访问不了。

后来给 Docker 容器配置宿主机代理：

```env
HTTP_PROXY=http://host.docker.internal:7897
HTTPS_PROXY=http://host.docker.internal:7897
```

并重建 api、worker、plugin_daemon 后，Jina API Key 就能正常添加了。

这个坑很像我之前线上 SuperAgentConsole 遇到的模型网络问题。

AI 应用的问题，不总是代码。

很多时候是网络链路。

## 这次排查真正学到什么

这段过程最重要的收获，不是修好了哪个 bug。

而是形成了一个排查顺序。

RAG 没结果时，不要马上换模型。

也不要马上重建知识库。

应该一层一层看：

```text
文档状态是否 completed
segment 是否 enabled
是否有 index_node_id
向量库里是否有对象
直接查向量库是否能命中
Dify 后端检索是否返回 records
Network 响应是否有数据
页面是不是渲染失败
retriever_resources 是否进入 API 返回
```

如果模型供应商配置失败，也要区分：

```text
API Key 错误
还是容器访问外网失败
```

这对我来说很像之前做线上部署时的感受。

当系统越来越接近真实运行环境时，问题会跨过代码边界。

它会进入：

```text
数据库
向量库
容器网络
版本兼容
前端渲染
模型供应商
代理配置
```

代码只是其中一部分。

剩下的，还是工程。

## 下一步，开始调 RAG 效果

排查完这些问题以后，知识库终于可以正常召回了。

但“能召回”和“召回得好”，又是两回事。

接下来我开始看：

为什么有些问题只命中标题。

为什么 chunk 内容不完整。

为什么 `\n\n` 分段会让内容太碎。

为什么 Rerank 有时明显有效，有时效果不大。

也就是从“能用”，进入“好用”。
