/* eslint-disable no-console */
import type { App, Router } from 'h3'
import type { Middleware, MockServer, MockServerOptions } from './types'

import { createServer } from 'node:http'
import {
  createApp as createH3App,
  defineEventHandler,
  toNodeListener
} from 'h3'
import { createH3Router } from './router'

/**
 * Creates a mock server instance with the specified configuration
 * @param options - Mock server configuration options
 * @returns Configured mock server instance
 *
 * @example
 * ```typescript
 * const server = createMockServer({
 *   routes: [
 *     { url: '/api/users', method: 'get', handler: async () => ({ users: [] }) }
 *   ],
 *   port: 3000,
 *   prefix: '/api'
 * })
 *
 * await server.listen()
 * console.log(`Server running at ${server.url}`)
 * ```
 */
export const createMockServer = (options: MockServerOptions) => {
  const {
    routes = [],
    h3Options = {},
    prefix,
    port = 3060,
    middlewares = []
  } = options

  const server = {} as MockServer

  // Initialize H3 application
  server.app = createH3App(h3Options)

  // Create router with routes and prefix
  server.router = createH3Router(routes, {
    prefix
  })

  // Bootstrap the H3 application with middlewares and routes
  bootstrapApp(server.app, server.router, middlewares)

  // Create HTTP server instance
  server.http = createServer(toNodeListener(server.app))

  /**
   * Starts the mock server on the specified port
   * @param listenPort - Optional port number to override default port
   * @returns Promise that resolves when server starts successfully
   */
  server.listen = (listenPort?: number) => {
    return new Promise((resolve, reject) => {
      const targetPort = listenPort || port

      /**
       * Attempts to start the server on the specified port
       * @param portToTry - Port number to attempt binding
       */
      const tryListen = (portToTry: number) => {
        server.http.listen(portToTry, () => {
          const address = server.http.address()
          if (address && typeof address !== 'string') {
            server.port = address.port
          } else {
            server.port = portToTry
          }
          server.url = `http://localhost:${server.port}`

          // Provide feedback about port usage
          if (portToTry !== targetPort) {
            console.log(
              `✓ MockServer started on port ${server.port} (fallback from ${targetPort})`
            )
          } else {
            console.log(`✓ MockServer started on port ${server.port}`)
          }

          resolve()
        })
      }

      // Handle port conflicts
      server.http.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.log(
            `⚠ Port ${targetPort} is already in use, finding available port...`
          )

          // Port is occupied, automatically find an available port
          findAvailablePort(targetPort)
            .then((availablePort) => {
              // Remove previous error listeners to avoid duplicate handling
              server.http.removeAllListeners('error')
              server.http.on('error', reject)
              tryListen(availablePort)
            })
            .catch(reject)
        } else {
          reject(err)
        }
      })

      tryListen(targetPort)
    })
  }

  /**
   * Stops the mock server and cleans up resources
   * @returns Promise that resolves when server is closed
   */
  server.close = async () => {
    await new Promise((resolve) => {
      server.http?.close()
      resolve(server)
    })
    server.port = undefined
    server.url = undefined
  }

  return server
}

/**
 * Bootstraps the H3 application with middlewares and router
 * @param app - H3 application instance
 * @param router - H3 router instance
 * @param middlewares - Array of middleware configurations
 */
function bootstrapApp(
  app: App,
  router: Router,
  middlewares: Middleware[] = []
) {
  // Separate before and after middlewares
  const beforeMiddlewares = middlewares.filter((m) => !m.isAfter)
  const afterMiddlewares = middlewares.filter((m) => m.isAfter)

  // 1. Mount before middlewares (executed before routes)
  beforeMiddlewares.forEach((middlewareItem) => {
    app.use(defineEventHandler(middlewareItem.middleware))
  })

  // 2. Mount the router
  app.use(router)

  // 3. Mount after middlewares (executed after routes)
  afterMiddlewares.forEach((middlewareItem) => {
    app.use(defineEventHandler(middlewareItem.middleware))
  })
}

/**
 * Finds an available port starting from the specified port number
 * @param startPort - Starting port number to search from
 * @param maxPort - Maximum port number to search up to
 * @returns Promise that resolves to an available port number
 * @throws Error if no available port is found in the range
 */
async function findAvailablePort(
  startPort: number,
  maxPort: number = 65535
): Promise<number> {
  for (let port = startPort + 1; port <= maxPort; port++) {
    if (await isPortAvailable(port)) {
      return port
    }
  }
  throw new Error(
    `No available ports found between ${startPort + 1} and ${maxPort}`
  )
}

/**
 * Checks if a specific port is available for binding
 * @param port - Port number to check
 * @returns Promise that resolves to true if port is available, false otherwise
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.listen(port, () => {
      server.close(() => {
        resolve(true)
      })
    })

    server.on('error', () => {
      resolve(false)
    })
  })
}
