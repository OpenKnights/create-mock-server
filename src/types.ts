import type { App, AppOptions, EventHandler, Router } from 'h3'
import type { Server } from 'node:http'

/**
 * Configuration options for creating a mock server
 */
export interface MockServerOptions {
  /** Array of route configurations */
  routes: MethodOption[]
  /** Array of middleware configurations */
  middlewares?: Middleware[]
  /**
   * Server port number
   * @default 3060
   */
  port?: number
  /** Prefix for nested router */
  prefix?: string
  /** H3 application configuration options */
  h3Options?: AppOptions
}

/**
 * Mock server instance with methods for server management
 */
export interface MockServer {
  /** H3 application instance */
  app: App
  /** H3 router instance */
  router: Router
  /** Current server port (available after listen() is called) */
  port?: number
  /** Server URL (available after listen() is called) */
  url?: string
  /** Node.js HTTP server instance */
  http: Server
  /**
   * Starts the server listening on specified port
   * @param port - Optional port number, uses default if not provided
   */
  listen: (port?: number) => Promise<void>
  /** Stops the server and cleans up resources */
  close: () => Promise<void>
}

/**
 * Supported HTTP methods for route configuration
 */
export type HTTPMethod = 'get' | 'patch' | 'post' | 'put' | 'delete'

/**
 * Configuration for a single route/endpoint
 */
export interface MethodOption {
  /** Route URL path */
  url: string
  /** HTTP method for the route */
  method?: HTTPMethod
  /** Event handler function for processing requests */
  handler: EventHandler
}

/**
 * Configuration options for router creation
 */
export interface RouterOptions {
  /** URL prefix for all routes in this router */
  prefix?: string
}

/**
 * Middleware configuration with execution order control
 */
export interface Middleware {
  /** Optional name for the middleware (useful for debugging) */
  name?: string
  /**
   * If true, middleware runs after routes; if false, runs before routes
   * @default false
   */
  isAfter?: boolean
  /** The actual middleware event handler function */
  middleware: EventHandler
}
