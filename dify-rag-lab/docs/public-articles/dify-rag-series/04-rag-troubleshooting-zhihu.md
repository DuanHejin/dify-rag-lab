# Dify 知识库显示可用，但召回测试一开始就是搜不出来

Dify 知识库导入完成后，页面显示：

```txt
5 个文档全部可用
```

chunk 数量也正常。

Embedding 模型也配置好了。

从页面上看，知识库应该已经可以用了。

但我开始做召回测试时，遇到的问题是：

```txt
没有任何召回结果
```

输入：

```txt
Top K 设置为 3 代表什么？
```

没有结果。

换自然语言问题。

没有结果。

直接搜关键词。

还是没有结果。

这就很容易让人怀疑：

```txt
是不是向量没写进去？
是不是 Embedding 模型错了？
是不是 Weaviate 没数据？
是不是 Dify 版本有 bug？
```

最后这段排查从页面、Network、api 日志，一直查到 Weaviate。

## 1. 追加文档时报 enable=null

第一次导入四个文件时正常。

后来追加第五个文件时，页面报错。

Network 请求体里有：

```json
"summary_index_setting": {
  "enable": null
}
```

后端报错：

```txt
Input tag 'None' found using 'enable' does not match any of the expected tags: False, True
```

原因很明确：

后端期望：

```txt
true / false
```

但页面传了：

```txt
null
```

后来在知识库设置里把“摘要自动生成”开关打开一次，再关闭一次。

再回到文档预览，就正常了。

这个问题说明：

```txt
页面默认状态不一定等于后端期望状态
```

遇到这种问题，直接看 Network 请求体很有效。

## 2. 文档内分段搜索 500

后来我在文档内搜索分段，也报错。

接口返回：

```txt
500 Internal Server Error
```

api 日志里有：

```txt
psycopg2.errors.InvalidParameterValue: cannot extract elements from a scalar
```

对应 SQL 里有：

```txt
jsonb_array_elements_text(CAST(document_segments.keywords AS JSONB))
```

也就是代码把 `keywords` 当 JSON 数组处理。

但实际某些值可能是标量。

这个问题本身不是 RAG 召回失败。

它是控制台“文档内分段搜索”接口的问题。

但如果只看页面，很容易误判为：

```txt
知识库整体不可用
```

所以这里要区分：

```txt
控制台某个页面接口异常
和
底层知识库检索不可用
```

不是一回事。

## 3. 全文检索其实有结果，但页面崩了

真正关键的一次排查，是全文检索。

我切到全文检索后，页面显示：

```txt
渲染此组件时发生了意外错误
```

看起来像全文检索失败。

但打开 Network 后发现：

接口返回里有 records。

第一条还正好命中：

```txt
Top K 设置为 3 代表什么？
```

也就是说：

```txt
后端检索成功
前端展示失败
```

浏览器控制台报：

```txt
TypeError: Cannot read properties of null (reading 'split')
```

对应逻辑大概是：

```js
f.name.split(".")
```

但接口返回的 `segment.document` 是：

```json
{
  "id": null,
  "name": null,
  "data_source_type": null
}
```

所以 `name` 为 null。

前端直接 split，就崩了。

这一步把问题定位清楚了：

```txt
不是全文检索没有结果
而是页面渲染结果时崩了
```

## 4. 升级到 1.14.2 后修复

后来我看了 Dify 官方 release。

新版本提到了修复 knowledge hit-testing rendering 相关问题。

于是把本地 Dify 从：

```txt
1.14.1
```

升级到：

```txt
1.14.2
```

升级后：

```txt
全文检索能正常展示
向量检索能正常展示
```

这说明之前的问题确实和版本 bug 有关。

也再次证明：

```txt
页面看不到结果 != 后端没有结果
```

需要看 Network 和日志。

## 5. 直接查 Weaviate

为了确认向量库里是否真的有数据，我还查了 Weaviate。

当时数据库里显示：

```txt
document_segments completed
enabled = true
index_node_id 存在
```

但页面召回不正常。

所以继续确认：

```txt
Weaviate collection 是否存在
对象是否存在
直接 BM25 是否能命中 Top K
```

结果确认：

```txt
Weaviate 有对象
直接查 Weaviate 能命中正确内容
```

这说明：

```txt
不是文档没写入
不是向量库空
不是底层完全不可检索
```

问题继续缩小到 Dify hit-testing 和前端展示。

## 6. 混合检索一开始仍然不稳定

升级后，全文检索和向量检索都能正常展示。

但混合检索一开始效果仍然不稳定。

拆开看后发现，加权路径可能遇到一个问题：

全文检索返回的某些候选文档，vector 是空数组。

但加权计算时会拿 query vector 和 document vector 算相似度。

如果一个是 2048 维，一个是空数组，就会出问题。

所以我后来没有继续死磕“混合检索 + 权重设置”。

而是接入真正的 Rerank 模型。

Jina Rerank 接入后，混合检索结果明显更稳定。

## 7. Jina API Key 添加失败不是 Key 错

接 Jina Rerank 时，又遇到一个问题。

Dify 页面添加 Jina API Key 失败。

错误是：

```txt
Failed to establish a new connection: [Errno 111] Connection refused
```

这不是典型 API Key 错误。

如果 Key 错，一般是：

```txt
401
invalid key
```

而这里是连接失败。

宿主机直接 curl：

```bash
curl https://api.jina.ai/v1/embeddings
```

返回：

```txt
AUTH_MISSING_API_KEY
```

说明宿主机能访问 Jina。

只是没有带 Key。

问题就变成：

```txt
宿主机能访问
Dify 容器不能访问
```

最后给容器配置代理：

```env
HTTP_PROXY=http://host.docker.internal:7897
HTTPS_PROXY=http://host.docker.internal:7897
```

重建相关容器后，Jina API Key 添加成功。

## 8. 这次排查的核心经验

RAG 搜不出来时，不要只盯着页面。

可以按这个顺序拆：

```txt
1. 文档状态是否 completed
2. segment 是否 enabled
3. index_node_id 是否存在
4. 向量库里是否有对象
5. 直接查向量库是否命中
6. Dify 后端接口是否返回 records
7. Network 响应是否有数据
8. 页面是否只是渲染失败
9. API 的 retriever_resources 是否正常
```

模型供应商配置失败时，也要区分：

```txt
API Key 错
还是容器访问外网失败
```

这次排查让我更明确地感受到：

AI 应用的问题不只在代码里。

还会出现在：

```txt
版本兼容
前端渲染
后端接口
数据库字段
向量库
容器网络
模型供应商
代理配置
```

代码只是其中一部分。

剩下的，仍然是工程。

下一步就是从“能召回”进入“召回得更准”。

也就是分段、Top K、Rerank 的调优。
