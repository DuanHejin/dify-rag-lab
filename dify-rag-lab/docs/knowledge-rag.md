# Knowledge / RAG 验证记录

> 目标：记录 Dify 知识库从文档导入、切片、索引、检索测试到 Chat Assistant 绑定和 API 验证的全过程。

## 1. 知识库信息

- 知识库名称：dify学习知识库
- Embedding 模型：火山方舟 `embeddingversion`
- 向量库：Weaviate
- 文档数量：5
- 文档状态：全部可用

## 2. 导入文档

| 文件 | chunk 数 | 状态 |
| --- | ---: | --- |
| `dify-rag-lab/docs/knowledge-rag-config-notes.md` | 169 | 可用 |
| `dify-rag-lab/docs/chat-assistant-api.md` | 66 | 可用 |
| `dify-rag-lab/docs/dify-learning-plan.md` | 47 | 可用 |
| `dify-rag-lab/docs/knowledge-rag-plan.md` | 40 | 可用 |
| `dify-rag-lab/docs/dify-thread-context.md` | 104 | 可用 |

## 3. 初步观察

- 5 个真实学习文档均已导入成功。
- 文档状态全部可用，说明 Embedding 模型和向量库链路可用。
- `knowledge-rag-config-notes.md` chunk 数最多，达到 169，符合该文档配置解释内容较长、标题层级较多的特点。
- `knowledge-rag-plan.md` chunk 数最少，为 40，适合作为结构化计划类文档检索样本。
- 后续需要继续观察是否存在过多短 chunk、标题和正文分离、代码块被切碎等问题。

## 4. 待检索问题

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
混合检索和向量检索有什么区别？
```

```text
Top K 设置为 3 代表什么？
```

## 5. 召回测试记录

### 5.1 原文问题无召回

测试问题：

```text
Top K 设置为 3 代表什么？
```

预期：

- 命中 `dify-rag-lab/docs/knowledge-rag-config-notes.md`
- 命中关于 `Top K = 3` 的配置说明

实际结果：

- Dify 平台召回测试中没有展示任何召回结果。

初步判断：

- 文档已导入且状态可用，但该问题没有召回结果，说明需要继续排查检索配置、文档分段、索引状态、关键词权重或阈值等因素。
- 该问题包含英文短词 `Top K` 和数字 `3`，可能受分词、关键词索引或混合检索权重影响。

下一步排查：

- 改用更短关键词：`Top K`
- 改用原文解释：`最多返回 3 个最相关的 chunk`
- 改用中文自然语言：`知识库最多返回几个相关片段？`
- 将检索方式切换为全文检索，测试精确关键词是否可命中。
- 将混合检索权重临时改为关键词更高，观察是否可命中。
- 将 Top K 从 3 临时提高到 10，观察是否只是排序靠后。
- 确认 Score 阈值未开启。

### 5.2 文档内分段搜索接口 500

在文档详情页直接搜索分段时，请求：

```text
GET /console/api/datasets/{dataset_id}/documents/{document_id}/segments?page=1&limit=10&keyword=Top+K+设置为+3+代表什么？&enabled=all
```

响应：

```json
{
  "message": "Internal Server Error",
  "code": "unknown",
  "status": 500
}
```

判断：

- 这是控制台“文档内分段搜索”接口异常，不等同于知识库 RAG 召回失败。
- 该接口是对 `DocumentSegment.content` 和 `DocumentSegment.keywords` 做关键词包含搜索，不是语义向量检索。
- 需要查看 api 容器日志确认具体 Python traceback。

API 容器日志：

```text
psycopg2.errors.InvalidParameterValue: cannot extract elements from a scalar
```

触发 SQL 片段：

```sql
jsonb_array_elements_text(CAST(document_segments.keywords AS JSONB))
```

实际含义：

- 控制台分段搜索接口会同时搜索 `document_segments.content` 和 `document_segments.keywords`。
- PostgreSQL 分支会把 `keywords` 当成 JSONB 数组，并调用 `jsonb_array_elements_text()` 展开数组。
- 当前某些 segment 的 `keywords` 字段不是数组，而是 scalar 标量或非数组 JSON 值。
- PostgreSQL 无法从 scalar 中提取数组元素，因此抛出 `cannot extract elements from a scalar`。

结论：

- 这是 Dify 控制台“文档内分段搜索”接口对 `keywords` 字段类型处理不够健壮导致的 500。
- 该问题不代表知识库导入失败，也不代表向量检索不可用。
- 不带 `keyword` 参数浏览分段列表，或使用知识库召回测试，应继续可用。

后续排查：

```bash
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
docker-compose logs --tail=200 api
```

如果日志太长，可以重点搜索：

```text
Traceback
segments
jsonb_array_elements_text
Internal Server Error
```

可选修复思路：

- 查询 `keywords` 前先判断 JSON 类型是否为数组。
- 如果不是数组，则按空数组处理，避免 `jsonb_array_elements_text()` 直接作用于 scalar。
- 伪 SQL 思路：

```sql
CASE
  WHEN jsonb_typeof(CAST(document_segments.keywords AS JSONB)) = 'array'
  THEN CAST(document_segments.keywords AS JSONB)
  ELSE '[]'::jsonb
END
```

### 5.3 召回测试持续无结果

测试现象：

- 使用多个召回测试问题，没有任何内容被检索出来。
- 直接使用关键词测试，也没有检索结果。
- 调整 Top K 后仍然没有结果。
- Score 阈值处于关闭状态。

已排除：

- 文档未导入：5 个文档均已导入。
- 文档不可用：5 个文档状态均为可用。
- Score 阈值过滤：当前阈值关闭。
- Top K 过小：调整 Top K 后仍无结果。

待确认：

- Embedding 是否真正写入向量库。
- 每个 segment 是否处于 enabled 状态。
- 文档 segment 的 `keywords` 字段异常是否也影响召回测试返回结构。
- 当前召回测试请求的后端响应是否为 200 但 `records=[]`，还是 500 / 400。
- 切换全文检索后页面组件崩溃的 Network 响应和 api 日志。

### 5.4 全文检索页面组件崩溃

测试现象：

- 将检索方式切换为全文搜索后，页面显示：

```text
渲染此组件时发生了意外错误。
```

判断：

- 这是前端组件渲染异常，不一定等同于后端检索失败。
- 需要查看浏览器 Network 中 hit-testing 请求的响应体，或查看 api 容器日志。
- 结合前面的分段搜索 500，怀疑部分 segment 的 `keywords` 字段不是数组，可能导致搜索或结果渲染链路处理异常。

下一步最小排查：

1. 打开浏览器 DevTools Network。
2. 在召回测试里重新提交一次问题。
3. 找到类似接口：

```text
POST /console/api/datasets/{dataset_id}/hit-testing
```

4. 记录 Status Code 和 Response。
5. 同时查看 API 容器日志：

```bash
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
docker-compose logs --tail=200 api
```

需要区分：

```text
200 + records=[]        检索正常执行但没有召回
400/500                 后端检索异常
前端组件错误但接口 200   前端渲染响应结构时异常
```

### 5.5 Hit-testing 请求体检查

召回测试请求：

```text
POST /console/api/datasets/df0fe83a-6dac-4c5f-bcdc-f912ef4f065b/hit-testing
```

请求体核心字段：

```json
{
  "query": "Top K",
  "attachment_ids": [],
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": false,
    "reranking_mode": "weighted_score",
    "weights": {
      "weight_type": "customized",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7,
        "embedding_model_name": "豆包-embedding-vision",
        "embedding_provider_name": "langgenius/volcengine_maas/volcengine_maas"
      }
    },
    "top_k": 3,
    "score_threshold_enabled": false,
    "score_threshold": 0
  }
}
```

可疑点：

- 前面记录的 Embedding 模型是火山方舟 `embeddingversion`。
- 但 hit-testing 请求体里的 `vector_setting.embedding_model_name` 是 `豆包-embedding-vision`。
- 如果文档索引时使用的 Embedding 模型和召回查询时使用的 Embedding 模型不一致，可能导致召回为空、向量维度不匹配或模型调用异常。

下一步需要确认：

- 知识库详情页显示的实际 Embedding 模型名称是什么。
- 召回测试请求的 Response status 和 body。
- 是否在检索设置里残留了错误的 `豆包-embedding-vision`。
- 是否需要将检索设置中的向量模型改回和知识库索引一致的 `embeddingversion`。

补充确认：

- 已人工确认 Dify 模型供应商和知识库模型设置是正确的。
- 因此后续排查重点从“模型选错”转为“检索方式、关键词索引、向量索引和 hit-testing 接口响应”。

下一步建议：

- 先单独测试“向量检索”，绕开全文/关键词检索链路。
- 如果向量检索可召回，而全文检索/混合检索异常，重点排查 `keywords` 字段和全文检索链路。
- 如果向量检索也无法召回，重点排查向量是否成功写入 Weaviate、segment 是否 enabled、hit-testing 后端响应是否异常。

### 5.6 向量检索也无法召回

测试现象：

- 切换为向量检索后，仍然无法召回任何内容。
- 页面显示 5 个文档均已解析成功，文档状态均为可用。
- 但召回测试、关键词测试、向量检索均无正常结果。

当前判断：

- 问题已经不太像查询表达、Top K、Score 阈值或混合检索权重问题。
- 更可能是“文档状态已完成，但向量数据没有正确写入向量数据库”，或 hit-testing 检索链路后端异常。

下一步重点排查：

- `document_segments` 是否存在且为 enabled。
- `document_segments.index_node_id` 是否存在。
- segment 状态是否为 completed。
- worker 在文档索引时是否报错。
- Weaviate 是否创建了对应 class / collection。
- hit-testing 接口返回是 `200 + records=[]`，还是 4xx / 5xx。

已确认结果：

hit-testing 接口返回：

```json
{
  "query": "Top K",
  "records": []
}
```

说明：

- hit-testing 后端接口状态正常。
- 当前不是接口 500，也不是前端组件单独渲染失败导致的假象。
- 检索链路执行完成，但没有召回任何记录。

数据库中 `document_segments` 状态统计：

```text
  status   | enabled | count
-----------+---------+-------
 completed | t       |   426
```

说明：

- 该知识库下共有 426 个 segment。
- 所有 segment 都是 `completed`。
- 所有 segment 都是启用状态。

`index_node_id` 统计：

```text
 total | with_index_node_id
-------+--------------------
   426 |                426
```

说明：

- 所有 segment 都有 `index_node_id`。
- 关系型数据库侧的文档分段、索引节点 ID、启用状态看起来是完整的。

当前排查结论：

- 数据库中的 segment 元数据基本正常。
- hit-testing 后端请求能正常返回空结果。
- 问题进一步收窄到向量库数据是否真实存在、向量库 class / collection 是否正确、检索时使用的索引名是否一致、或者 query embedding / vector retrieval 链路是否没有命中。

下一步重点：

- 检查 worker 日志中是否有 Weaviate 写入失败、embedding 失败或维度错误。
- 检查 Weaviate 中是否存在对应对象。
- 检查 Dify 当前 `VECTOR_STORE` 和实际向量库配置。
- 检查向量索引名称前缀和 dataset / segment 对应关系。

### 5.7 直接排查 Weaviate / Dify 检索链路

排查目标：

- 不再只看 Dify 页面状态，而是直接确认 Weaviate 是否真实有数据。
- 分别验证全文检索、向量检索、混合检索三条路径。
- 判断 `records=[]` 是“没有写入索引”，还是“召回后处理阶段丢失结果”。

环境配置确认：

```text
VECTOR_STORE=weaviate
VECTOR_INDEX_NAME_PREFIX=Vector_index
WEAVIATE_ENDPOINT=http://weaviate:8080
WEAVIATE_GRPC_ENDPOINT=grpc://weaviate:50051
```

Dify 根据 dataset id 生成的 Weaviate collection 名称：

```text
Vector_index_df0fe83a_6dac_4c5f_bcdc_f912ef4f065b_Node
```

宿主机挂载目录中已存在对应 Weaviate 数据：

```text
volumes/weaviate/vector_index_df0fe83a_6dac_4c5f_bcdc_f912ef4f065b_node
```

Weaviate schema 查询结果确认：

- collection 存在。
- `text`、`document_id`、`doc_id`、`doc_type`、`doc_hash`、`dataset_id` 等字段存在。
- `vectorizer` 是 `none`，说明向量由 Dify 自己生成后写入。
- 向量索引类型是 `hnsw`。

直接查询 Weaviate 对象，能看到真实文档内容：

```text
text: 1. 准备实验材料
doc_id: 2d4bffef-d66f-41bc-87f9-767353e154cc
document_id: 7c01f682-51d0-4f74-b0d4-e3c081ded2af
```

直接对 Weaviate 做 BM25 全文检索 `Top K`，可以命中正确片段：

```text
3.6 Top K
截图中 Top K 是：
```

也能命中原始测试问题所在片段：

```text
Top K 设置为 3 代表什么？
```

并且这些 `doc_id` 在 PostgreSQL 的 `document_segments` 中均能找到，状态都是：

```text
status=completed
enabled=true
```

关键结论：

- Weaviate 不是空的。
- 文档内容确实写入了 Weaviate。
- Weaviate 全文检索可以命中正确内容。
- Weaviate 返回的 `doc_id` 可以映射回 Dify 的 `document_segments`。
- 因此问题不是“文档没有导入”或“向量库完全没有写入”。

Dify 内部全文检索验证：

```text
RetrievalService.retrieve(FULL_TEXT_SEARCH, "Top K") => 5 条结果
```

命中片段包括：

```text
3.6 Top K
截图中 Top K 是：
```

```text
Top K 设置为 3 代表什么？
```

Dify 内部向量检索验证：

```text
RetrievalService.retrieve(SEMANTIC_SEARCH, "Top K") => 5 条结果
```

说明：

- Dify 后端直接调用向量检索时也能返回结果。
- 召回测试页面显示 `records=[]` 不是因为基础检索完全不可用。

真正异常点：

```text
RetrievalService.retrieve(HYBRID_SEARCH, reranking_mode="weighted_score") => 0 条结果
```

进一步拆开看，混合检索未加权前实际有结果：

```text
HYBRID_SEARCH + reranking_mode="reranking_model" + weights=None => 6 条结果
```

但进入 `weighted_score` 后，全文检索返回的文档 `vector` 是空列表：

```text
vector=[]
```

随后 `WeightRerankRunner` 计算余弦相似度时出现维度不匹配：

```text
ValueError: shapes (2048,) and (0,) not aligned: 2048 (dim 0) != 0 (dim 0)
```

源码位置：

```text
api/core/rag/rerank/weight_rerank.py
```

触发逻辑：

```python
dot_product = np.dot(vec1, vec2)
```

这里 `vec1` 是查询向量，维度为 2048；`vec2` 是全文检索文档返回的向量，但实际为空列表。

为什么页面最终是 `records=[]`：

- `weighted_score` 阶段抛出异常。
- 该异常发生在 `_retrieve` 的 Future 内。
- 外层 `RetrievalService.retrieve()` 没有把这个 Future 异常正确抛出或加入 `exceptions`。
- 最终表现为没有召回记录，而不是页面直接展示后端异常。

当前结论：

- 根因不是知识库没索引成功。
- 根因是当前 Dify 版本中 `hybrid_search + weighted_score + Weaviate full_text result vector=[]` 组合存在问题。
- 该问题会导致本来已经召回的结果在后处理阶段丢失，最终 `records=[]`。

临时绕过方案：

1. 在当前学习阶段，先不要用“混合检索 + 权重设置”做验证。
2. 优先切到“全文检索”单独测试，验证精确关键词是否能命中。
3. 再切到“向量检索”单独测试，验证语义召回是否能命中。
4. 如果必须用混合检索，先不要使用 `weighted_score`，或者接入真正的 Rerank 模型后再测试。
5. 当前 RAG 学习继续推进，不要被这个平台 bug 卡住。

后续如果要二开修复，可以考虑：

- `search_by_full_text()` 返回空向量时，不进入 weighted cosine 计算。
- `WeightRerankRunner._calculate_cosine()` 对空向量做保护。
- `RetrievalService.retrieve()` 外层检查 Future exception，避免内部异常被吞掉后返回空结果。

### 5.8 页面仍显示全文 / 向量无结果时的复测

新现象：

- 页面中切换到全文检索，仍然看不到召回结果。
- 页面中切换到向量检索，也看不到召回结果。

重新从 Dify 后端直接复测：

```text
RetrievalService.retrieve(FULL_TEXT_SEARCH, "Top K 设置为 3 代表什么？") => 5 条结果
RetrievalService.retrieve(SEMANTIC_SEARCH, "Top K 设置为 3 代表什么？") => 5 条结果
RetrievalService.retrieve(HYBRID_SEARCH, reranking_mode="reranking_model", weights=None) => 10 条结果
```

全文检索命中的第一条：

```text
Top K 设置为 3 代表什么？
```

服务层复测：

```text
HitTestingService.retrieve(full_text_search, "Top K 设置为 3 代表什么？") => 5 条 records
HitTestingService.retrieve(semantic_search, "Top K 设置为 3 代表什么？") => 5 条 records
```

控制台响应模型包装复测：

```text
HitTestingResponse.model_validate(...) => records=5
```

因此新的判断是：

- 后端基础检索可用。
- HitTestingService 也能返回 records。
- 控制台响应模型也能正常包装 records。
- 页面看不到结果，不等同于全文检索或向量检索后端不可用。

当前最可能的原因：

1. 页面实际发出的请求体仍然不是纯 `full_text_search` 或纯 `semantic_search`。
2. 请求体中仍残留 `reranking_mode: weighted_score` 和 `weights`。
3. Score 阈值或元数据过滤条件在页面状态中被意外带上。
4. 前端组件渲染异常，导致后端有 records 但页面没有展示。
5. 页面状态没有刷新，仍沿用之前混合检索配置。

下一步只需要确认 Network 里的实际请求体：

```text
POST /console/api/datasets/{dataset_id}/hit-testing
```

如果是全文检索，请求体应当包含：

```json
{
  "retrieval_model": {
    "search_method": "full_text_search",
    "reranking_enable": false,
    "top_k": 5,
    "score_threshold_enabled": false
  }
}
```

如果是向量检索，请求体应当包含：

```json
{
  "retrieval_model": {
    "search_method": "semantic_search",
    "reranking_enable": false,
    "top_k": 5,
    "score_threshold_enabled": false
  }
}
```

只要请求体中仍出现下面字段，就说明页面仍走了容易出问题的混合权重路径：

```text
search_method: hybrid_search
reranking_mode: weighted_score
weights
```

### 5.9 Network 确认全文检索可用，但页面渲染失败

Network 中全文检索请求体：

```json
{
  "query": "Top K",
  "attachment_ids": [],
  "retrieval_model": {
    "search_method": "full_text_search",
    "reranking_enable": false,
    "reranking_mode": "weighted_score",
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "customized",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7,
        "embedding_model_name": "豆包-embedding-vision",
        "embedding_provider_name": "langgenius/volcengine_maas/volcengine_maas"
      }
    },
    "top_k": 3,
    "score_threshold_enabled": false,
    "score_threshold": 0
  }
}
```

Network 返回结果：

- `records` 有 3 条。
- 第一条命中原始问题片段：

```text
Top K 设置为 3 代表什么？
```

- 第二条命中 Top K 大小的解释。
- 第三条命中 `3.6 Top K` 标题片段。

结论：

- 全文检索后端已经正常命中。
- 当前页面看不到结果，不是全文检索失败。
- 这是前端渲染召回结果时崩溃。

浏览器控制台报错：

```text
TypeError: Cannot read properties of null (reading 'split')
```

触发代码逻辑：

```js
const y = f.name.split(".").slice(-1)[0]
```

其中：

```js
const { document: f } = segment
```

但接口返回中的 `segment.document` 是：

```json
{
  "id": null,
  "data_source_type": null,
  "name": null,
  "doc_type": null,
  "doc_metadata": null
}
```

因此 `f.name` 是 `null`，前端直接调用 `split()` 导致组件崩溃。

数据库复查：

```sql
select id, name, data_source_type, doc_type
from documents
where id = '33b1c518-a802-49a4-9c8d-f163d960d5a9';
```

结果：

```text
id: 33b1c518-a802-49a4-9c8d-f163d960d5a9
name: knowledge-rag-config-notes.md
data_source_type: upload_file
```

说明：

- `documents` 表里文档记录真实存在。
- 文档名称也存在。
- 但 hit-testing 接口返回时，嵌套的 `segment.document` 没有带出真实文档信息，而是被序列化成了空字段对象。

当前准确结论：

- RAG 文档导入成功。
- Weaviate 索引存在。
- 全文检索可命中。
- 向量检索后端也可命中。
- 控制台页面展示失败是前端空值保护问题，直接原因是 `segment.document.name` 为 `null`。

临时学习绕过：

- 以 Network 返回的 `records` 为准判断召回是否成功。
- 继续用全文检索或向量检索验证知识库效果。
- 暂时不要把页面组件错误误判为 RAG 失败。

如果后续做二开修复：

- 前端应改成空值保护，例如：

```js
const filename = f?.name || ""
const ext = filename.includes(".") ? filename.split(".").slice(-1)[0] : ""
```

- 后端也应尽量保证 hit-testing records 中的 `segment.document` 返回真实文档信息，避免空对象进入前端。

### 5.10 添加 Jina API Key 失败：容器未走宿主机代理

目标：

- 在 Dify 模型供应商中添加 Jina API Key。
- 后续用于接入 Jina Rerank，验证 RAG 召回后的二次排序效果。

页面报错：

```json
{
  "code": "invalid_param",
  "message": "Credentials validation failed: HTTPSConnectionPool(host='api.jina.ai', port=443): Max retries exceeded with url: /v1/embeddings (Caused by NewConnectionError(\"HTTPSConnection(host='api.jina.ai', port=443): Failed to establish a new connection: [Errno 111] Connection refused\"))",
  "status": 400
}
```

触发接口：

```text
POST /console/api/workspaces/current/model-providers/langgenius/jina/jina/credentials
```

请求体：

```json
{
  "credentials": {
    "api_key": "jina_xxxx"
  }
}
```

初步判断：

- 该错误不是 API Key 格式错误。
- 如果 API Key 错误，通常会返回 `401 Unauthorized` 或 invalid key 类错误。
- 当前错误发生在建立 HTTPS 连接阶段，说明 Dify 后端容器访问 `api.jina.ai` 失败。

先在宿主机验证 Jina 网络连通性：

```bash
curl https://api.jina.ai/v1/embeddings
```

实际返回：

```json
{
  "detail": "Authentication required. Provide your API key via the Authorization header: 'Authorization: Bearer <api-key>'. Get your API key at https://jina.ai/api-dashboard/key-manager.",
  "code": "AUTH_MISSING_API_KEY"
}
```

结论：

- 宿主机可以访问 Jina。
- `AUTH_MISSING_API_KEY` 是正常响应，说明网络已通，只是没有带 API Key。
- 问题缩小为：宿主机能访问外部模型服务，但 Dify 容器不能访问。

进一步验证容器内网络：

```bash
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
docker-compose exec api curl -I https://api.jina.ai/v1/embeddings
```

如果容器内返回连接失败，而宿主机可以访问，说明需要给 Dify 容器配置宿主机代理。

解决方式：

在 `docker/.env` 中追加 Docker 容器可访问的代理配置。假设宿主机代理端口为 `7897`：

```env
HTTP_PROXY=http://host.docker.internal:7897
HTTPS_PROXY=http://host.docker.internal:7897
http_proxy=http://host.docker.internal:7897
https_proxy=http://host.docker.internal:7897
NO_PROXY=localhost,127.0.0.1,api,worker,web,nginx,db_postgres,redis,weaviate,ssrf_proxy,sandbox,plugin_daemon
no_proxy=localhost,127.0.0.1,api,worker,web,nginx,db_postgres,redis,weaviate,ssrf_proxy,sandbox,plugin_daemon
```

注意：

- 容器里不能使用 `127.0.0.1:7897` 访问宿主机代理。
- 容器里的 `127.0.0.1` 指向容器自身。
- 在 Docker Desktop / Colima 环境中，应优先使用 `host.docker.internal:7897` 访问宿主机代理。
- Dify 的 `SSRF_PROXY_HTTP_URL=http://ssrf_proxy:3128` 是内部 SSRF 保护代理，不等同于宿主机外网代理。

重建相关容器：

```bash
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
docker-compose up -d --force-recreate api worker worker_beat plugin_daemon
```

再次回到 Dify 页面添加 Jina API Key。

实际结果：

- 配置 Docker 代理后，Jina API Key 可以正确添加。
- 说明 Jina API Key 本身没问题。
- Dify 模型供应商配置流程也没问题。
- 根因是 Dify 后端容器没有走宿主机代理，导致无法访问 `api.jina.ai`。

后续接入 Jina Rerank 的建议：

```text
检索方式：混合检索
Rerank 模型：Jina Reranker
Top K：8 或 10
Score 阈值：先关闭
```

用同一组问题复测：

```text
Top K 设置为 3 代表什么？
分段重叠长度是什么意思？
Dify 最小镜像升级流程是什么？
docker compose 和 docker-compose 有什么区别？
summary_index_setting enable 为 null 为什么会报错？
```

### 5.11 Rerank 生效判断与召回测试历史缓存

现象：

- 页面已选择 Jina Rerank 模型：`jina-reranker-v3`。
- 但在旧的召回测试历史记录中继续点击“测试”，Network 请求体里仍然出现：

```json
{
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": false,
    "reranking_mode": "reranking_model",
    "reranking_model": {
      "reranking_provider_name": "langgenius/jina/jina",
      "reranking_model_name": "jina-reranker-v3"
    }
  }
}
```

关键判断：

- 是否真正启用 Rerank，不能只看 `reranking_model` 字段是否存在。
- 应以 `reranking_enable` 是否为 `true` 作为判断依据。
- `reranking_model` 存在但 `reranking_enable=false` 时，说明请求携带了模型配置，但本次检索不会实际执行 Rerank。

原因推断：

- Dify 召回测试历史会保留当次测试的 `retrieval_model` 配置快照。
- 从历史记录中选择某一项继续测试时，可能会沿用当时的检索方式、Top K、权重、Rerank 开关等参数。
- 修改知识库检索设置后，如果继续复用旧历史测试项，可能看不到新配置生效。

正确做法：

- 修改 Rerank、Top K、权重或检索方式后，重新新建一次召回测试。
- 重新测试时检查请求体，确认：

```json
{
  "reranking_enable": true,
  "reranking_mode": "reranking_model",
  "reranking_model": {
    "reranking_provider_name": "langgenius/jina/jina",
    "reranking_model_name": "jina-reranker-v3"
  }
}
```

实际结果：

- 新建召回测试后，Rerank 正常启用。
- 混合检索 + Jina Rerank 能拿到最符合问题的召回段落。
- 说明当前 RAG 链路已经验证到：基础召回 + Rerank 二次排序。

后续进入下一项：

- 将 `dify学习知识库` 绑定到已有应用 `简单的求职聊天助手`。
- 在调试预览中验证回答是否使用知识库内容。
- 再用 `/v1/chat-messages` 验证响应中的 `metadata.retriever_resources`。

## 6. Chat Assistant 绑定知识库验证

应用信息：

- 应用名称：简单的求职聊天助手
- 已绑定知识库：dify学习知识库
- LLM：豆包模型
- 检索链路：知识库召回后，由豆包模型基于召回内容生成回答

已完成操作：

- 在聊天助手中接入 `dify学习知识库`。
- 修改提示词，使应用在有知识库相关内容时优先基于知识库回答。
- 在“调试与预览”中提问两个知识库相关问题。

实际结果：

- 两个问题都正确引用了知识库中的文章。
- Dify 调试预览页面能展示知识库引用来源。
- 豆包模型基于召回内容生成了回答。

阶段结论：

- 知识库自身召回链路已验证可用。
- Chat Assistant 已经能够使用知识库内容回答问题。
- RAG 链路已从“知识库检索测试”推进到“应用内知识库问答”。

下一步：

- 使用 `/v1/chat-messages` 调用同样的问题。
- 观察响应中的 `metadata.retriever_resources`。
- 记录命中的 `dataset_name`、`document_name`、`content`、`score` 等字段。
- 验证无关问题时是否不会强行引用知识库。

## 7. Chat Assistant RAG API 验证

### 7.1 知识库相关问题

请求方式：

```text
POST http://localhost:8080/v1/chat-messages
response_mode: blocking
conversation_id: de19b43f-59f5-4d07-a5ad-7cd8da3b7404
```

问题：

```text
Dify 最小镜像升级流程是什么？
```

返回结果摘要：

- `metadata.retriever_resources` 返回 3 条知识库命中结果。
- 第一条命中分数明显最高，是主要有效上下文。
- 豆包模型基于召回内容生成了“Dify 最小镜像升级流程”的结构化回答。

第一条命中：

```text
dataset_name: dify学习知识库
document_name: dify-thread-context.md
score: 0.6939131
content: 4.4 Dify 最小镜像升级流程
```

第一条命中内容包含：

```text
- 当前本地 Dify 运行方式是 Docker Compose 拉取并启动官方镜像。
- 实际运行代码来自 Docker 镜像，而不是本地 api/、web/ 目录源码。
- 最小升级流程包括备份 docker-compose.yaml、.env、volumes，修改镜像版本，执行 docker-compose down/pull/up。
- 升级后需要验证 Web 控制台、管理员账号、应用配置、模型供应商、知识库、API 调用。
```

第二条命中：

```text
dataset_name: dify学习知识库
document_name: knowledge-rag.md
score: 0.2346732
content: Docker 代理、Jina API Key、Rerank 配置相关记录
```

第三条命中：

```text
dataset_name: dify学习知识库
document_name: dify-learning-plan.md
score: 0.00046479
content: Dify / RAG 学习计划开头
```

观察：

- 第一条命中高度相关。
- 第二、三条相关性明显较低，属于补充或噪声。
- 当前 Top K 返回 3 条时可正常回答，但后续如果想减少噪声，可以尝试 Top K=1/2 或开启 score 阈值。

阶段结论：

- Chat Assistant API blocking 调用已验证 RAG 生效。
- `metadata.retriever_resources` 可以用于观察实际命中的知识库、文档、片段和分数。
- 回答内容不是纯模型记忆，而是基于召回片段生成。

### 7.2 无关问题

问题：

```text
今天北京天气怎么样？
```

返回结果摘要：

```text
知识库中没有找到北京今日天气的相关资料，我作为 RAG 方向的求职准备助手，核心服务内容是为你提供求职相关的技能准备、面试指导、项目优化等求职类相关支持，暂时不支持实时天气信息的查询。
```

关键字段：

```json
{
  "metadata": {
    "retriever_resources": []
  }
}
```

观察：

- 无关问题没有命中知识库，`retriever_resources` 为空数组。
- 回答没有强行引用知识库。
- 模型明确说明知识库中没有相关资料，并把用户引导回求职准备助手的能力范围。

阶段结论：

- 相关问题可以触发知识库召回。
- 无关问题不会强行引用知识库。
- Chat Assistant 的 RAG API 主链路验证完成。

### 7.3 Streaming 模式

请求方式：

```text
POST http://localhost:8080/v1/chat-messages
response_mode: streaming
conversation_id: dd1a6cd8-46b1-4454-9028-aab0fec339f5
```

问题仍然是知识库相关问题：

```text
Dify 最小镜像升级流程是什么？
```

流式返回观察：

- 中间会持续返回多个 `event=message` 事件。
- 每个 `message` 事件只包含增量 `answer` 片段。
- 这些增量片段共享同一个 `conversation_id`、`message_id`、`task_id`。
- `metadata.retriever_resources` 不在普通 `message` 事件中返回。
- 最终 `event=message_end` 中返回完整 `metadata`，包括 `retriever_resources` 和 `usage`。

普通 `message` 事件示例：

```json
{
  "event": "message",
  "conversation_id": "dd1a6cd8-46b1-4454-9028-aab0fec339f5",
  "message_id": "bee629bb-22fe-4770-aaf5-a29f5441e64f",
  "answer": "<think>\n我"
}
```

最终 `message_end` 事件关键字段：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [
      {
        "position": 1,
        "dataset_name": "dify学习知识库",
        "document_name": "dify-thread-context.md",
        "score": 0.6939131,
        "content": "4.4 Dify 最小镜像升级流程..."
      }
    ],
    "usage": {
      "total_tokens": 2417,
      "total_price": "0.0044502",
      "currency": "RMB"
    }
  }
}
```

阶段结论：

- Streaming 模式下 RAG 同样生效。
- 前端如果要边流式展示回答、边展示引用来源，需要等到 `message_end` 后再读取 `metadata.retriever_resources`。
- 如果业务上希望更早展示引用，可以先在 UI 中显示“正在检索/生成”，等 `message_end` 到达后补充引用来源。

## 8. 元数据过滤当前结论

概念理解：

- 元数据过滤是在知识库检索前，先按文档或片段标签缩小检索范围。
- 它适合用于文档类型隔离、部门隔离、权限隔离、版本隔离和业务范围控制。
- 典型字段包括 `doc_type`、`stage`、`role`、`version`、`department` 等。

当前实操检查：

- 已检查知识库设置页面。
- 已检查召回测试页面的检索设置。
- 当前 Dify 1.14.2 的知识库设置和召回测试页面未找到元数据过滤入口。

阶段判断：

- 本阶段不强行做元数据过滤实验。
- 元数据过滤先作为概念掌握，不作为当前 Knowledge 页面必须完成项。
- 后续学习 Chatflow 或 Workflow 时，再检查知识检索节点中是否支持元数据过滤配置。

记录原因：

- 当前 RAG 主链路已经完成验证：文档导入、切片调优、Embedding、基础召回、Rerank、Chat Assistant 绑定、blocking API、streaming API、无关问题边界。
- 元数据过滤属于范围控制能力，不影响当前 RAG 主链路成立。

## 9. 切片调优最终结论

初始问题：

- 早期使用按 Markdown 段落分段的方式，分段标识符类似 `\n\n`。
- 同时设置了单段最大长度，例如 1024 characters。
- 实测发现：一个原本完整的语义段落如果超过最大长度，会被继续硬切成两段。
- 第一段通常包含标题和关键词，更容易被召回。
- 第二段可能包含真正完整的解释或补充信息，但因为关键词较少，容易漏召回。

典型表现：

```text
用户问：分段重叠长度是什么意思？

召回结果命中：
1.4 分段重叠长度
截图中的分段重叠长度是：

但后续真正解释“分段重叠长度作用”的内容可能落在另一个 chunk 中。
```

结论：

- 问题不只是 `\n\n` 太碎。
- 更准确地说，是“按段落切分 + 最大长度硬切”共同导致语义单元断裂。
- Rerank 只能重排已经召回的候选 chunk，不能自动把没有召回的下一段补回来。
- 如果 chunk 从源头上切坏了，后续调 Top K、权重、Rerank 只能缓解，不能根治。

调优结果：

- 换用更合适的切分规则后，搜索准确性明显提升。
- 对学习笔记、配置说明、操作记录类 Markdown，不建议盲目使用 `\n\n` 作为默认分段方式。
- 更适合按标题层级或更完整的语义单元切分，保证标题、定义、解释、注意事项尽量落在同一个 chunk 或父级上下文中。

经验沉淀：

```text
RAG 质量优先从 chunk 质量开始调。
当命中标题但答案不完整时，优先检查切片，而不是马上换模型。
如果 chunk 因最大长度被硬切成两段，应提高最大长度、增加 overlap，或改为按 Markdown 标题层级切分。
```
