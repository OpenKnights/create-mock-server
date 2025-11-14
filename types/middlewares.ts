import type { Middleware, MiddlewareOptions } from 'h3'

interface MiddlewareConfig {
  route?: string
  handler: Middleware
  options?: MiddlewareOptions
}

type Middlewares = Array<Middleware | MiddlewareConfig>

// 解析后的中间件项 - 二维数组，可以直接展开给 app.use()
type ParsedMiddleware =
  | [Middleware]
  | [string, Middleware]
  | [Middleware, MiddlewareOptions]
  | [string, Middleware, MiddlewareOptions]

export type { MiddlewareConfig, Middlewares, ParsedMiddleware }
