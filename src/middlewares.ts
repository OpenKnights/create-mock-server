import type {
  MiddlewareConfig,
  Middlewares,
  ParsedMiddleware
} from '#types/middlewares'
import type { H3 as H3Instance } from 'h3'
import { isArray, isObject } from './util'

/**
 * 判断是否为 MiddlewareConfig 类型
 */
function isMiddlewareConfig(config: unknown): config is MiddlewareConfig {
  if (!isObject(config)) return false

  const cfg = config as MiddlewareConfig
  return 'middleware' in cfg && typeof cfg.middleware === 'function'
}

/**
 * 解析中间件配置为二维数组
 *
 * 返回格式可以直接用于 app.use(...middleware)
 *
 * 支持的输入格式：
 * 1. 直接的 Middleware 函数
 * 2. MiddlewareConfig 对象（包含 route、middleware、options）
 *
 * 返回格式：
 * - [middleware]
 * - [route, middleware]
 * - [middleware, options]
 * - [route, middleware, options]
 */
function parseMiddlewares(middlewares: Middlewares): ParsedMiddleware[] {
  const parsedMiddlewares: ParsedMiddleware[] = []

  for (const config of middlewares) {
    if (isMiddlewareConfig(config)) {
      // MiddlewareConfig 格式
      const { route, handler, options } = config

      if (route && options) {
        // [route, middleware, options]
        parsedMiddlewares.push([route, handler, options])
      } else if (route) {
        // [route, middleware]
        parsedMiddlewares.push([route, handler])
      } else if (options) {
        // [middleware, options]
        parsedMiddlewares.push([handler, options])
      } else {
        // [middleware]
        parsedMiddlewares.push([handler])
      }
    } else {
      // 直接的 Middleware 函数格式
      parsedMiddlewares.push([config])
    }
  }

  return parsedMiddlewares
}

/**
 * 注册中间件到 H3 应用
 */
function registerMiddlewares(app: H3Instance, middlewares?: Middlewares): void {
  if (!(isArray(middlewares) && middlewares.length)) return

  const parsedMiddlewares = parseMiddlewares(middlewares)

  // 直接展开数组传给 app.use()
  for (const middleware of parsedMiddlewares) {
    // @ts-expect-error - 展开元组类型
    app.use(...middleware)
  }
}

export { parseMiddlewares, registerMiddlewares }
