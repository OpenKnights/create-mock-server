import type { Router } from 'h3'
import type { MethodOption, RouterOptions } from './types'
import { createRouter, defineEventHandler, useBase } from 'h3'

/**
 * Creates an H3 router with the specified routes and options
 * @param routes - Array of route configurations
 * @param options - Router configuration options
 * @returns Configured H3 router instance
 *
 * @example
 * ```typescript
 * const routes = [
 *   { url: '/api/users', method: 'get', handler: getUsersHandler },
 *   { url: '/api/users', method: 'post', handler: createUserHandler }
 * ]
 * const router = createH3Router(routes, { prefix: '/api' })
 * ```
 */
export function createH3Router(
  routes: MethodOption[],
  options: RouterOptions = {}
) {
  const { prefix } = options

  // Create H3 router instance
  let h3Router = createRouter()

  // Configure all routes on the H3 router
  routes.forEach(({ handler, method = 'get', url }) => {
    if (!h3Router[method]) {
      console.warn(`Unsupported HTTP method: ${method}`)
      return
    }
    h3Router[method](url, defineEventHandler(handler))
  })

  // Apply nested routing if prefix is specified
  if (prefix) h3Router = createNestedRouter(h3Router, prefix)

  return h3Router
}

/**
 * Creates a nested router with the specified prefix
 * @param router - Base router instance
 * @param prefix - URL prefix for nested routing
 * @returns Nested router with prefix configuration
 */
function createNestedRouter(router: Router, prefix: string) {
  const baseRouter = createRouter()

  // Ensure prefix starts with forward slash
  if (!prefix.startsWith('/')) prefix = `/${prefix}`

  baseRouter.use(`${prefix}/**`, useBase(prefix, router.handler))

  return baseRouter
}
