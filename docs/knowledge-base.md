# Stock MCP Telegram Bot Knowledge Base

本文档用于沉淀项目的 MVP 共识、技术方案、模块划分、数据设计与实施路线，作为后续开发的长期参考基线。

## 1. 项目目标

本项目的第一阶段目标不是直接做一个功能齐全的成品，而是在陪跑式开发过程中，亲手搭建一个最小可运行闭环。

MVP 的核心目标是：

- 能跑：服务、数据库、定时任务可以正常运行
- 能存：行情、告警、新闻可以持久化到数据库
- 能监控：系统可以定期检查 watchlist 中的股票
- 能推送：发生异动时可以通过 Telegram 发送提醒

## 2. 第一版技术栈

第一版 MVP 采用熟悉且启动成本低的技术栈：

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Docker

当前明确不做：

- React dashboard
- 复杂异动规则
- 盘前 / 盘后行情
- Telegram 指令交互

## 3. MVP 解决的问题

用户维护一个美股 watchlist，系统定时执行以下流程：

1. 拉取 watchlist 中股票的最新行情
2. 计算是否发生异动
3. 若发生异动，写入数据库
4. 通过 Telegram 发送提醒
5. 记录新闻标题，作为后续扩展基础
6. 提供少量 API 方便手动触发与排查

## 4. MVP 范围

### 4.1 本版一定做

#### 股票池管理

- 支持预置一批 ticker
- 支持通过 API 添加 / 删除 / 查看 ticker

#### 行情采集

至少采集以下字段：

- `symbol`
- `currentPrice`
- `previousClose`
- `dayHigh`
- `dayLow`
- `volume`
- `timestamp`

#### 基础异动检测

第一版仅做 3 个简单规则：

- 价格涨幅异动：相对昨收涨跌超过阈值，例如 `5%`
- 日内振幅异动：`(dayHigh - dayLow) / previousClose` 超过阈值
- 成交量异动：当前 `volume` 超过设定阈值

#### Telegram 推送

- 检测到异动后发送消息
- 一条异动只推一次，避免刷屏

#### 新闻抓取

- 面向 watchlist 中的股票抓 RSS / 新闻标题
- 第一版仅做“抓取并存储”
- 暂不参与核心判断

#### 数据持久化

- Prisma
- PostgreSQL

#### Docker 化

初版建议只保留两个服务：

- `postgres`
- `app`

#### 手动触发接口

- 手动执行一次行情抓取
- 手动执行一次新闻抓取
- 查看最近异动记录

### 4.2 本版明确不做

为避免项目膨胀，第一版刻意不做：

- React dashboard
- 用户登录注册
- 多用户隔离
- 复杂技术指标，如 `MACD` / `RSI` / 布林带
- 盘前 / 盘后
- WebSocket 实时流
- Telegram 命令交互
- AI 摘要 / AI 分析
- 多渠道推送，如邮件、钉钉、Slack
- 多市场，如 A 股、港股

## 5. 技术 Blueprint

### 后端

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- `@nestjs/schedule` 或 `node-cron`
- Axios
- `rss-parser`
- `class-validator`
- Docker / Docker Compose

### 推送

- Telegram Bot API

### 数据源建议

#### 行情源

MVP 阶段优先选择简单、便宜、容易启动的方案：

- Yahoo Finance 兼容方案 / 开源 npm 包

选择原因：

- 启动快
- 免费
- 足够支撑 MVP

后续可以切换到更稳定的 provider：

- Finnhub
- Alpha Vantage
- Polygon
- Twelve Data

#### 新闻源

第一版优先：

- RSS Feed

选择原因：

- 最简单
- 不需要额外付费
- 足够支撑 MVP

## 6. 系统架构 Blueprint

建议第一版先拆成 7 个模块。

### 6.1 Watchlist Module

职责：

- 管理需要监控的股票列表

API：

- `GET /watchlist`
- `POST /watchlist`
- `DELETE /watchlist/:symbol`

### 6.2 Market Data Module

职责：

- 拉取股票行情
- 标准化不同 provider 的返回格式

核心接口：

- `fetchQuote(symbol: string): Promise<Quote>`
- `fetchQuotes(symbols: string[]): Promise<Quote[]>`

### 6.3 News Module

职责：

- 拉取新闻 RSS
- 存储新闻标题、链接、发布时间、来源
- 与 `symbol` 关联

核心接口：

- `fetchNewsForSymbol(symbol: string): Promise<NewsItem[]>`

### 6.4 Anomaly Detection Module

职责：

- 读取行情
- 根据规则判断是否异动
- 生成标准化 alert

核心接口：

- `detectQuoteAnomalies(quote: Quote): Alert[]`

### 6.5 Alert Module

职责：

- 存储异动记录
- 幂等去重
- 控制告警状态

建议按以下维度去重：

- 同一 `symbol`
- 同一告警类型
- 同一交易日
- 同一阈值区间

### 6.6 Notification Module

职责：

- 把 alert 转成 Telegram 消息
- 调用 Bot API 发送
- 记录发送结果

### 6.7 Scheduler Module

职责：

- 定时编排任务
- 串起完整流程

调度示例：

- 每 5 分钟抓一次行情
- 每 15 分钟抓一次新闻

## 7. MVP 数据流

### 7.1 行情监控主流程

1. Scheduler 触发任务
2. 读取 watchlist
3. 调用 Market Data provider 拉行情
4. 保存 quote snapshot
5. 调用 Anomaly Detector 计算异常
6. 对异常做去重
7. 新异常写入 alerts
8. 调用 Telegram 发送消息
9. 更新发送状态

### 7.2 新闻抓取主流程

1. Scheduler 触发新闻任务
2. 读取 watchlist
3. 拉取 RSS
4. 过滤重复新闻
5. 保存 news records

## 8. 数据库设计建议

以下实体足够支撑 MVP。

### 8.1 WatchlistItem

字段建议：

- `id`
- `symbol`
- `companyName?`
- `isActive`
- `createdAt`
- `updatedAt`

用途：

- 管理监控股票池

### 8.2 QuoteSnapshot

字段建议：

- `id`
- `symbol`
- `price`
- `previousClose`
- `changePercent`
- `dayHigh`
- `dayLow`
- `volume`
- `capturedAt`
- `createdAt`

用途：

- 保存每次抓取的行情快照
- 为后续分析和 dashboard 打基础

### 8.3 Alert

字段建议：

- `id`
- `symbol`
- `type`
- `title`
- `message`
- `severity`
- `metricValue`
- `thresholdValue`
- `status`
- `triggeredAt`
- `createdAt`

`type` 示例：

- `PRICE_CHANGE`
- `INTRADAY_RANGE`
- `VOLUME_SPIKE`

`status` 示例：

- `PENDING`
- `SENT`
- `FAILED`

### 8.4 AlertDelivery

字段建议：

- `id`
- `alertId`
- `channel`
- `target`
- `status`
- `responseRaw?`
- `sentAt?`
- `createdAt`

用途：

- 记录 Telegram 推送是否成功

### 8.5 NewsItem

字段建议：

- `id`
- `symbol`
- `title`
- `url`
- `source`
- `publishedAt`
- `createdAt`

约束建议：

- 对 `symbol + url` 或 `url` 做唯一约束，防止重复入库

### 8.6 SystemJobLog

字段建议：

- `id`
- `jobName`
- `status`
- `startedAt`
- `finishedAt`
- `message?`
- `createdAt`

用途：

- 排查 cron 与任务执行问题
- 观察任务是否正常运行

## 9. 推荐目录结构

第一版建议按 NestJS 模块化方式组织：

```text
src/
  app.module.ts
  main.ts

  common/
    constants/
    enums/
    interfaces/
    utils/

  config/
    configuration.ts
    env.validation.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  modules/
    watchlist/
      watchlist.module.ts
      watchlist.controller.ts
      watchlist.service.ts
      dto/

    market-data/
      market-data.module.ts
      market-data.service.ts
      providers/
        yahoo.provider.ts
      interfaces/

    quotes/
      quotes.module.ts
      quotes.service.ts

    news/
      news.module.ts
      news.service.ts
      providers/
        rss.provider.ts

    anomaly/
      anomaly.module.ts
      anomaly.service.ts
      rules/
        price-change.rule.ts
        intraday-range.rule.ts
        volume-spike.rule.ts

    alerts/
      alerts.module.ts
      alerts.service.ts
      alerts.controller.ts

    notification/
      notification.module.ts
      notification.service.ts
      telegram/
        telegram.service.ts

    scheduler/
      scheduler.module.ts
      scheduler.service.ts

    health/
      health.module.ts
      health.controller.ts
```

这一结构的价值：

- 后续接 React dashboard 时后端无需大改
- 新增 provider 或规则时扩展点清晰
- 更接近正式项目的组织方式

## 10. MVP API Blueprint

### Health

- `GET /health`

用途：

- 确认服务是否启动

### Watchlist

- `GET /watchlist`
- `POST /watchlist`
- `DELETE /watchlist/:symbol`

请求体示例：

```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc."
}
```

### Jobs

- `POST /jobs/run-quotes`
- `POST /jobs/run-news`

用途：

- 开发阶段手动触发任务，不必等待 cron

### Alerts

- `GET /alerts`
- `GET /alerts/recent`

## 11. 异动规则 Blueprint

第一版规则必须尽量简单。

### 规则 1：价格涨跌幅异动

公式：

```text
(price - previousClose) / previousClose * 100
```

触发条件：

- `abs(changePercent) >= 5`

### 规则 2：日内振幅异动

公式：

```text
(dayHigh - dayLow) / previousClose * 100
```

触发条件：

- `intradayRangePercent >= 7`

### 规则 3：成交量异动

触发条件：

- `volume >= 5_000_000`

说明：

- 该规则较粗糙，但足够支撑 MVP
- 后续可升级为“相对过去 N 日均量”的规则

## 12. Telegram 推送格式建议

第一版保持简洁，避免过度模板化：

```text
🚨 Stock Alert: AAPL
Type: PRICE_CHANGE
Price: $214.32
Prev Close: $202.10
Change: +6.05%
Time: 2026-04-06 10:35 ET
```

后续可逐步加入：

- 新闻链接
- TradingView 链接
- Yahoo Finance 链接
- AI summary

## 13. Docker Blueprint

第一版建议直接维护两个服务：

- `postgres`
- `app`

如果后续需要再考虑：

- `adminer`
- `pgadmin`

### 环境变量建议

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/stock_agent?schema=public

TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

QUOTE_JOB_ENABLED=true
NEWS_JOB_ENABLED=true

PRICE_CHANGE_THRESHOLD=5
INTRADAY_RANGE_THRESHOLD=7
VOLUME_SPIKE_THRESHOLD=5000000
```

## 14. 分阶段实施计划

不要一口气写完，按阶段推进。

### Phase 0：项目初始化

目标：

- 建 NestJS 项目
- 配置 Prisma
- 连上 PostgreSQL
- Docker 跑起来
- 健康检查接口可用

交付结果：

- `GET /health` 可用
- Prisma migration 成功
- Docker Compose 正常启动

### Phase 1：Watchlist + 数据库建模

目标：

- 建立 Prisma schema
- 完成 watchlist CRUD
- 可以往数据库里加股票

交付结果：

- `POST /watchlist` 可添加 `AAPL` / `TSLA` / `NVDA`
- `GET /watchlist` 返回数据库结果

### Phase 2：行情采集

目标：

- 接一个美股行情 provider
- 完成单只 / 多只股票抓取
- 保存 quote snapshot

交付结果：

- 手动调用 `/jobs/run-quotes` 能将 quotes 入库

### Phase 3：异动检测

目标：

- 根据规则生成 alerts
- 做基础去重

交付结果：

- 满足阈值时生成 alert 记录

### Phase 4：Telegram 推送

目标：

- 把 alert 发出去
- 更新发送状态

交付结果：

- 手机上能收到异常提醒

### Phase 5：新闻抓取

目标：

- RSS 抓取入库
- 去重

交付结果：

- `/jobs/run-news` 能存新闻标题

### Phase 6：调度与稳定性

目标：

- 加定时任务
- 加 job log
- 做基础错误处理

交付结果：

- 服务可长期运行
- 能通过日志定位问题

## 15. 为什么这个 Blueprint 合适

这个方案适合当前阶段的原因：

- 使用熟悉技术栈，学习成本低
- 从一开始就具备完整工程闭环
- 功能边界明确，复杂度可控
- 后续可自然扩展到 dashboard、AI summary、更多策略与更多数据源

## 16. 推荐协作方式

建议按阶段推进，先落地基础设施，再逐步扩展业务功能。

推荐节奏：

1. 先做 `Phase 0`，完成项目初始化、Docker、Prisma、PostgreSQL、健康检查
2. 再做 `Phase 1`，完成 Watchlist 模块
3. 之后按 `Phase 2` 到 `Phase 6` 逐步推进

每个阶段都应该做到：

- 先明确目标
- 再落文件结构
- 再写代码
- 最后验证是否成功

## 17. 当前结论

这份 Blueprint 的核心原则是：

- 第一版先建立完整闭环
- 不急于堆功能
- 优先保证可运行、可验证、可扩展

后续开发应始终围绕这个原则推进，避免 MVP 在早期失控膨胀。
