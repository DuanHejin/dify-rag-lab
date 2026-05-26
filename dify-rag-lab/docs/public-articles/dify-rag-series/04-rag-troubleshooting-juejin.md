# Dify RAG 学习实战 04：排查知识库可用但召回测试无结果的问题

前面已经完成知识库创建和文档导入：

```txt
知识库：dify学习知识库
文档数量：5
状态：全部可用
向量库：Weaviate
Embedding：火山方舟 embeddingversion
```

但开始召回测试时，出现问题：

```txt
召回测试没有结果
文档内分段搜索报 500
全文检索页面渲染异常
```

这篇记录完整排查过程。

## 1. 现象：知识库可用，但召回为空

测试问题：

```txt
Top K 设置为 3 代表什么？
```

预期应该命中：

```txt
knowledge-rag-config-notes.md
```

但页面没有任何召回结果。

继续测试：

```txt
分段重叠长度是什么意思？
Dify 最小镜像升级流程是什么？
```

也没有稳定结果。

初步怀疑方向：

```txt
Embedding 模型错误
向量未写入 Weaviate
segment 状态异常
Dify hit-testing 接口异常
前端页面展示问题
```

## 2. 追加文档时报 enable=null

追加新文档时，接口报错：

```txt
Input tag 'None' found using 'enable' does not match any of the expected tags: False, True
```

Network 请求体中有：

```json
"summary_index_setting": {
  "enable": null,
  "model_name": null,
  "model_provider_name": null,
  "summary_prompt": null
}
```

问题原因：

```txt
后端期望 enable 是 true / false
页面传了 null
```

处理方式：

```txt
进入知识库设置
打开摘要自动生成
再关闭
重新回到文档预览
```

这样请求中会固化为明确的 false。

结论：

```txt
页面默认状态不一定等于后端期望状态
遇到参数校验错误先看 Network 请求体
```

## 3. 文档内分段搜索 500

文档内搜索分段时，接口返回：

```txt
500 Internal Server Error
```

api 日志：

```txt
psycopg2.errors.InvalidParameterValue: cannot extract elements from a scalar
```

SQL 里有：

```txt
jsonb_array_elements_text(CAST(document_segments.keywords AS JSONB))
```

含义：

```txt
代码按 JSON 数组处理 keywords
但实际某些 keywords 可能是标量
```

这个问题属于：

```txt
控制台文档内分段搜索接口异常
```

不等同于：

```txt
知识库 RAG 召回失败
```

需要区分页面功能错误和底层检索错误。

## 4. 全文检索页面渲染失败

切换到全文检索后，页面显示：

```txt
渲染此组件时发生了意外错误
```

浏览器控制台：

```txt
TypeError: Cannot read properties of null (reading 'split')
```

检查 Network 响应，发现接口其实返回了 records。

第一条内容：

```txt
Top K 设置为 3 代表什么？
```

说明：

```txt
后端全文检索成功
前端渲染失败
```

进一步看响应：

```json
"document": {
  "id": null,
  "data_source_type": null,
  "name": null,
  "doc_type": null,
  "doc_metadata": null
}
```

前端代码执行：

```js
f.name.split(".")
```

由于 `name=null`，导致页面崩溃。

## 5. 升级 Dify 到 1.14.2

查看 Dify release 后，发现新版本修复了 knowledge hit-testing rendering 相关问题。

本地从：

```txt
1.14.1
```

升级到：

```txt
1.14.2
```

升级后验证：

```txt
全文检索可展示结果
向量检索可展示结果
```

结论：

```txt
之前页面无结果不等于后端无结果
主要问题是 hit-testing 页面渲染异常
```

## 6. 检查 Weaviate 数据

为了确认是否是向量库问题，继续检查 Weaviate。

已确认：

```txt
Weaviate collection 存在
对象存在
直接 BM25 查询 Top K 能命中
document_segments 中 index_node_id 存在
segment 状态 completed
enabled=true
```

说明：

```txt
文档已写入
向量库不是空的
底层检索不是完全不可用
```

问题进一步缩小到：

```txt
Dify hit-testing 链路
页面展示
混合检索重排逻辑
```

## 7. 混合检索 weighted_score 问题

全文和向量检索正常后，混合检索一开始仍然不稳定。

拆开看，发现加权重排路径可能遇到：

```txt
全文检索候选文档 vector = []
query vector = 2048 维
```

计算相似度时会出现维度不匹配。

这说明：

```txt
混合检索不是简单叠加全文和向量结果
中间还有分数融合和重排逻辑
```

当前阶段没有继续死磕 weighted_score。

后续改为接入真正的 Rerank 模型。

## 8. Jina API Key 添加失败

接 Jina Rerank 时，页面添加 API Key 失败。

错误：

```txt
HTTPSConnectionPool(host='api.jina.ai', port=443)
Failed to establish a new connection
Connection refused
```

先在宿主机测试：

```bash
curl https://api.jina.ai/v1/embeddings
```

返回：

```txt
AUTH_MISSING_API_KEY
```

说明宿主机能访问 Jina。

问题在容器内网络。

给 Dify 容器配置代理：

```env
HTTP_PROXY=http://host.docker.internal:7897
HTTPS_PROXY=http://host.docker.internal:7897
http_proxy=http://host.docker.internal:7897
https_proxy=http://host.docker.internal:7897
```

重建：

```bash
docker-compose up -d --force-recreate api worker worker_beat plugin_daemon
```

之后 Jina API Key 添加成功。

## 9. 排查顺序总结

RAG 召回异常时，可以按这个顺序排查：

```txt
1. 文档状态是否 completed
2. segment 是否 enabled
3. 是否有 index_node_id
4. 向量库 collection 是否存在
5. 向量库对象是否存在
6. 直接查向量库是否命中
7. Dify 后端是否返回 records
8. Network 响应是否有 records
9. 前端是否只是渲染失败
10. API retriever_resources 是否正常
```

模型供应商配置失败时，区分：

```txt
API Key 错误
容器无法访问外部网络
```

## 10. 本阶段结论

这次问题不是单一原因。

而是多层问题叠加：

```txt
追加文档参数 null
文档内搜索 keywords 类型异常
hit-testing 页面渲染 bug
混合检索 weighted_score 不稳定
容器访问 Jina 网络失败
```

最终处理：

```txt
升级 Dify 到 1.14.2
确认 Weaviate 数据存在
使用 Network 判断真实响应
配置 Docker 容器代理
接入 Jina Rerank
```

最大收获：

```txt
RAG 排查不能只看页面
要从页面、Network、API 日志、数据库、向量库、容器网络逐层定位
```

下一篇进入效果优化：

```txt
切片规则
Top K
Score 阈值
Jina Rerank
qwen3-rerank
```
