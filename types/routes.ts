import type { EventHandler, RouteOptions } from 'h3'

// HTTP 方法类型
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type AllHTTPMethod = 'ALL'

// 带选项的路由处理器配置
interface RouteHandlerConfig {
  options?: RouteOptions
  handler: EventHandler
}

// 路由处理器类型
type RouteHandler = EventHandler | RouteHandlerConfig

// 路由配置接口
interface RouteConfig {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  PATCH?: RouteHandler
  DELETE?: RouteHandler
  children?: Routes
}

// 路由定义 - URL 只能是 RouteHandler 或 RouteConfig
interface Routes {
  [route: string]: RouteHandler | RouteConfig
}

// 解析后的路由项
interface ParsedRoute {
  route: string
  method: HTTPMethod | AllHTTPMethod
  handler: EventHandler
  options?: RouteOptions
}

export type {
  AllHTTPMethod,
  HTTPMethod,
  ParsedRoute,
  RouteConfig,
  RouteHandler,
  RouteHandlerConfig,
  Routes
}
