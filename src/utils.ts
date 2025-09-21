import type { EventHandler } from 'h3'
import type { MethodOption, Middleware } from './types'

/**
 * Adds a unified prefix to all URLs in the routes array
 * @param routes - Array of route configurations
 * @param prefix - URL prefix to add
 * @returns New array of routes with prefixed URLs
 *
 * @example
 * ```typescript
 * const routes = [
 *   { url: '/users', method: 'get', handler: getUsersHandler },
 *   { url: '/posts', method: 'get', handler: getPostsHandler }
 * ]
 * const prefixedRoutes = addRoutesPrefix(routes, '/api/v1')
 * // Result: [
 * //   { url: '/api/v1/users', method: 'get', handler: getUsersHandler },
 * //   { url: '/api/v1/posts', method: 'get', handler: getPostsHandler }
 * // ]
 * ```
 */
export function addRoutesPrefix(
  routes: MethodOption[],
  prefix: string
): MethodOption[] {
  // Return original array if prefix is empty or invalid
  if (!prefix || prefix.trim() === '') {
    return routes
  }

  // Normalize prefix: ensure it starts with / and doesn't end with /
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
  const cleanPrefix =
    normalizedPrefix.endsWith('/') && normalizedPrefix !== '/'
      ? normalizedPrefix.slice(0, -1)
      : normalizedPrefix

  return routes.map((route) => {
    const { url, ...otherOptions } = route

    // Handle different URL patterns
    let prefixedUrl: string
    if (url === '/') {
      // Special handling for root path
      prefixedUrl = cleanPrefix === '/' ? '/' : cleanPrefix
    } else if (url.startsWith('/')) {
      // URL already starts with /
      prefixedUrl = cleanPrefix === '/' ? url : `${cleanPrefix}${url}`
    } else {
      // URL doesn't start with /, need to add one
      prefixedUrl = `${cleanPrefix}/${url}`
    }

    return {
      url: prefixedUrl,
      ...otherOptions
    }
  })
}

/**
 * Creates a middleware configuration object
 * @param middleware - The event handler function
 * @param options - Configuration options for the middleware
 * @returns Middleware configuration object
 *
 * @example
 * ```typescript
 * const corsMiddleware = createMiddleware(
 *   async (event) => {
 *     setHeader(event, 'Access-Control-Allow-Origin', '*')
 *   },
 *   { name: 'cors', isAfter: false }
 * )
 * ```
 */

export const createMiddleware = (
  middleware: EventHandler,
  options: Omit<Middleware, 'middleware'> = {}
): Middleware => ({
  name: options.name,
  isAfter: options.isAfter || false,
  middleware
})
