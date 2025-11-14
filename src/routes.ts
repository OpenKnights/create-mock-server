import type {
  ParsedRoute,
  RouteConfig,
  RouteHandlerConfig,
  Routes
} from '#types/routes'
import type { EventHandler, H3 as H3Instance } from 'h3'
import { ALL_HTTP_METHOD, HTTP_METHODS } from './constants'
import { isArray, isObject, joinPaths } from './util'

/**
 * 判断是否为 RouteHandlerConfig 类型
 */
function isRouteHandlerConfig(config: unknown): config is RouteHandlerConfig {
  if (!isObject(config)) return false

  const cfg = config as RouteHandlerConfig
  return 'handler' in cfg && typeof cfg.handler === 'function'
}

/**
 * 判断是否为 RouteConfig 类型
 */
function isRouteConfig(config: unknown): config is RouteConfig {
  if (!isObject(config)) return false

  const cfg = config as RouteConfig
  return (
    cfg.GET !== undefined ||
    cfg.POST !== undefined ||
    cfg.PUT !== undefined ||
    cfg.PATCH !== undefined ||
    cfg.DELETE !== undefined ||
    cfg.children !== undefined
  )
}

/**
 * 解析嵌套路由结构
 */
function parseRoutes(routes: Routes, basePath = ''): ParsedRoute[] {
  const parsedRoutes: ParsedRoute[] = []

  for (const [path, config] of Object.entries(routes)) {
    const fullPath = joinPaths(basePath, path)

    if (isRouteConfig(config)) {
      // 处理 RouteConfig 类型

      for (const method of HTTP_METHODS) {
        const methodConfig = config[method]
        if (methodConfig) {
          // 处理 HandlerConfig 或直接的 RouteHandler
          if (isRouteHandlerConfig(methodConfig)) {
            parsedRoutes.push({
              route: fullPath,
              method,
              handler: methodConfig.handler,
              options: methodConfig.options
            })
          } else {
            parsedRoutes.push({
              route: fullPath,
              method,
              handler: methodConfig
            })
          }
        }
      }

      // 递归处理子路由
      if (config.children) {
        parsedRoutes.push(...parseRoutes(config.children, fullPath))
      }
    } else {
      // 处理 RouteHandler 类型
      parsedRoutes.push({
        route: fullPath,
        method: ALL_HTTP_METHOD,
        handler: config as EventHandler
      })
    }
  }

  return parsedRoutes
}

/**
 * 注册路由到 H3 应用
 */
function registerRoutes(app: H3Instance, routes: Routes): void {
  if (!(isArray(routes) && routes.length)) return

  const parsedRoutes = parseRoutes(routes)

  for (const { route, method, handler, options } of parsedRoutes) {
    if (method === ALL_HTTP_METHOD) {
      app.all(route, handler, options)
    } else {
      app.on(method, route, handler, options)
    }
  }
}

export { parseRoutes, registerRoutes }
