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
