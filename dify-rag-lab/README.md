# Dify RAG Lab

这个目录是个人学习、实验和二开工作区，用于在 Dify 源码仓库内集中管理和 Dify / RAG / Agent 相关的个人产物。

## 目录规则

- `docs/`: 学习文档、API 验证记录、概念对照表、阶段计划。
- `experiments/`: Dify 应用 DSL、测试用例、示例配置、实验材料。
- `experiments/prompts/`: 提示词版本、测试输入、效果观察和优化记录。
- `scripts/`: curl 脚本、初始化脚本、辅助验证脚本。
- `second-dev/`: 二开方案、改造记录、补丁说明、源码阅读笔记。
- `assets/`: 截图、流程图、导出文件、演示素材。

## 使用原则

- 个人学习和实验产物统一放在 `dify-rag-lab/` 下。
- 不把个人文档放进 Dify 官方 `docs/` 目录，避免和上游内容混在一起。
- 真正需要二开源码时，可以修改仓库原有的 `api/`、`web/`、`docker/` 等目录，但设计说明、验证记录和实验材料仍放在本目录。
- 新增文档优先放到 `dify-rag-lab/docs/`，新增脚本优先放到 `dify-rag-lab/scripts/`。
- 后续 Codex 线程应先阅读 `dify-rag-lab/docs/dify-thread-context.md` 和 `dify-rag-lab/docs/dify-learning-plan.md`。
