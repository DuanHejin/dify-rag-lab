import http from 'node:http'

const port = 8787

const profiles = {
  '前端开发': {
    job_type: '前端开发',
    market_summary: '前端开发岗位当前更重视工程化能力、复杂业务交付能力、AI 应用接入能力和项目表达能力。',
    required_skills: ['JavaScript', 'Vue 或 React', '工程化', '性能优化', 'AI 应用交互'],
    interview_focus: ['项目表达', '手写题', '浏览器原理', '工程化经验', 'AI 产品接入经验'],
  },
  '后端开发': {
    job_type: '后端开发',
    market_summary: '后端开发岗位当前更重视接口设计、数据库建模、缓存、稳定性和服务部署能力。',
    required_skills: ['接口设计', '数据库', '缓存', '消息队列', '服务部署'],
    interview_focus: ['项目架构', '数据库设计', '高并发处理', '故障排查', '服务稳定性'],
  },
  '产品经理': {
    job_type: '产品经理',
    market_summary: '产品经理岗位当前更重视业务理解、需求拆解、数据分析、跨团队协作和 AI 产品化能力。',
    required_skills: ['需求分析', '业务建模', '数据分析', '原型设计', 'AI 产品理解'],
    interview_focus: ['需求判断', '项目复盘', '指标设计', '沟通协作', 'AI 场景理解'],
  },
}

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  if (url.pathname === '/job-profile' && req.method === 'GET') {
    const jobType = (url.searchParams.get('job_type') || '').trim()

    if (!jobType) {
      sendJson(res, 400, { error: 'job_type is required' })
      return
    }

    const profile = profiles[jobType] || {
      job_type: jobType,
      market_summary: `${jobType}岗位暂无预置画像，请结合岗位 JD、项目经历和目标公司要求做针对性准备。`,
      required_skills: ['岗位基础能力', '项目经验', '问题拆解', '沟通表达'],
      interview_focus: ['岗位理解', '项目复盘', '核心技能', '真实经验'],
    }

    sendJson(res, 200, profile)
    return
  }

  sendJson(res, 404, { error: 'not found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Job profile mock server listening on http://0.0.0.0:${port}`)
  console.log(`Try: curl "http://localhost:${port}/job-profile?job_type=%E5%89%8D%E7%AB%AF%E5%BC%80%E5%8F%91"`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
