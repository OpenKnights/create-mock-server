import type { Router } from 'h3'
import type { MethodOption, RouterOptions } from './types'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { isEmpty } from './utils'

/**
 * Base path constant
 * Used to identify the root path of routes
 */
const BASE_PATH = '/'

/**
 * Creates an H3 router with specified routes and options
 *
 * @param routes - Array of route configurations, each containing URL, HTTP method, and handler function
 * @param options - Router configuration options
 * @param options.prefix - Optional route prefix, e.g., '/api'
 * @returns Configured H3 router instance
 *
 * @example
 * Basic usage (without prefix)
 * ```typescript
 * const routes = [
 *   { url: '/users', method: 'get', handler: getUsersHandler },
 *   { url: '/users', method: 'post', handler: createUserHandler }
 * ]
 * const router = createH3Router(routes)
 * ```
 *
 * @example
 * Usage with prefix
 * ```typescript
 * const routes = [
 *   { url: '/users', method: 'get', handler: getUsersHandler },
 *   { url: '/', method: 'get', handler: apiRootHandler }  // Will be mapped to /api
 * ]
 * const router = createH3Router(routes, { prefix: '/api' })
 * // Actual routes: GET /api, GET /api/users
 * ```
 *
 * @remarks
 * - If a prefix is provided, the function creates a nested router structure
 * - The root path '/' is handled specially, mapping directly to the prefix path
 * - The prefix is automatically normalized to ensure it starts with '/'
 */
export function createH3Router(
  routes: MethodOption[],
  options: RouterOptions = {}
) {
  const { prefix } = options
  const hasPrefix = !isEmpty(prefix) && prefix !== '/'

  if (hasPrefix) {
    // Normalize prefix to ensure it starts with a forward slash
    const normalizedPrefix = (
      prefix!.startsWith('/') ? prefix : `/${prefix}`
    ) as string

    // Create base router and nested router
    const baseRouter = createRouter()
    const nestedRouter = createRouter()

    // Check if a root path route exists
    const hasBasePath = routes.find((route) => route.url === BASE_PATH)
    if (hasBasePath) {
      // Remove root path from routes list and handle it separately
      routes = routes.filter((route) => route.url !== BASE_PATH)

      // Add root path route to the prefix path
      // Example: prefix='/api', url='/' => actual route: /api
      const { handler, method } = hasBasePath
      baseRouter.add(normalizedPrefix, defineEventHandler(handler), method)
    }

    // Configure all non-root routes to the nested router
    addRoutes(nestedRouter, routes)

    // Mount the nested router to the base router under the prefix path using useBase
    // Example: prefix='/api' => all routes will be under /api/**
    baseRouter.use(
      `${normalizedPrefix}/**`,
      useBase(normalizedPrefix, nestedRouter.handler)
    )

    return baseRouter
  } else {
    // Without prefix, create a simple H3 router directly
    const h3Router = createRouter()

    // Configure all routes to the H3 router
    addRoutes(h3Router, routes)

    return h3Router
  }
}

/**
 * Batch adds an array of routes to the router
 *
 * @param router - H3 router instance
 * @param routes - Array of route configurations to add
 *
 * @remarks
 * - Default HTTP method is 'get'
 * - If the specified HTTP method is not supported by the router, a warning is logged and the route is skipped
 * - Each route is wrapped in defineEventHandler
 *
 * @internal
 */
function addRoutes(router: Router, routes: MethodOption[]) {
  routes.forEach(({ handler, method = 'get', url }) => {
    // Check if the router supports this HTTP method
    if (!router[method]) {
      console.warn(`Unsupported HTTP method: ${method}`)
      return
    }
    // Add route to the router
    router.add(url, defineEventHandler(handler), method)
  })
}
