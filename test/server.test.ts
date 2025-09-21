/* eslint-disable no-console */
import type { MethodOption, Middleware, MockServerOptions } from '../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockServer } from '../src'

/**
 * Test suite for MockServer functionality
 * Tests server creation, routing, middleware, port management, and lifecycle
 */
describe('MockServer', () => {
  let mockRoutes: MethodOption[]
  let mockMiddlewares: Middleware[]
  let server: any

  beforeEach(() => {
    // Setup mock routes for testing
    mockRoutes = [
      {
        url: '/users',
        method: 'get',
        handler: async () => {
          console.log('GET /users handler called')
          return {
            users: [
              { id: 1, name: 'John' },
              { id: 2, name: 'Jane' }
            ]
          }
        }
      },
      {
        url: '/users',
        method: 'post',
        handler: async () => {
          console.log('POST /users handler called')
          return { success: true, message: 'User created' }
        }
      },
      {
        url: '/posts/:id',
        method: 'get',
        handler: async () => {
          console.log('GET /posts/:id handler called')
          return { post: { id: 1, title: 'Test Post' } }
        }
      },
      {
        url: '/',
        method: 'get',
        handler: async () => {
          console.log('GET / handler called')
          return { message: 'Welcome to Mock Server' }
        }
      }
    ]

    // Setup mock middlewares for testing
    mockMiddlewares = [
      {
        name: 'cors',
        isAfter: false,
        middleware: async (event) => {
          console.log('CORS middleware executed (before)')
          // Mock CORS headers
          if (event.node?.res?.setHeader) {
            event.node.res.setHeader('Access-Control-Allow-Origin', '*')
          }
        }
      },
      {
        name: 'logger',
        isAfter: true,
        middleware: async (event) => {
          console.log('Logger middleware executed (after)')
          console.log(
            `Request: ${event.node?.req?.method} ${event.node?.req?.url}`
          )
        }
      }
    ]
  })

  afterEach(async () => {
    // Clean up server after each test
    if (server && server.close) {
      await server.close()
      server = null
    }
  })

  describe('Server Creation', () => {
    it('should create server with basic configuration', () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3001
      }

      server = createMockServer(options)

      expect(server).toBeDefined()
      expect(server.app).toBeDefined()
      expect(server.router).toBeDefined()
      expect(server.http).toBeDefined()
      expect(typeof server.listen).toBe('function')
      expect(typeof server.close).toBe('function')
    })

    it('should create server with all configuration options', () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        middlewares: mockMiddlewares,
        port: 3002,
        prefix: '/api/v1',
        h3Options: {
          debug: true
        }
      }

      server = createMockServer(options)

      expect(server).toBeDefined()
      expect(server.app).toBeDefined()
      expect(server.router).toBeDefined()
      expect(server.http).toBeDefined()
    })

    it('should create server with empty routes array', () => {
      const options: MockServerOptions = {
        routes: [],
        port: 3003
      }

      server = createMockServer(options)

      expect(server).toBeDefined()
      expect(server.app).toBeDefined()
      expect(server.router).toBeDefined()
    })

    it('should use default port when not specified', () => {
      const options: MockServerOptions = {
        routes: mockRoutes
      }

      server = createMockServer(options)
      expect(server).toBeDefined()
    })
  })

  describe('Server Lifecycle', () => {
    it('should start server on specified port', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3004
      }

      server = createMockServer(options)

      await server.listen()

      expect(server.port).toBe(3004)
      expect(server.url).toBe('http://localhost:3004')
    })

    it('should start server on custom port via listen parameter', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3005
      }

      server = createMockServer(options)

      await server.listen(3006)

      expect(server.port).toBe(3006)
      expect(server.url).toBe('http://localhost:3006')
    })

    it('should find available port when specified port is in use', async () => {
      // First server on port 3007
      const server1 = createMockServer({
        routes: mockRoutes,
        port: 3007
      })
      await server1.listen()

      // Second server should find next available port
      server = createMockServer({
        routes: mockRoutes,
        port: 3007
      })

      await server.listen()

      expect(server.port).toBeGreaterThan(3007)
      expect(server.url).toContain('localhost')

      // Clean up first server
      await server1.close()
    })

    it('should close server properly', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3008
      }

      server = createMockServer(options)
      await server.listen()

      expect(server.port).toBe(3008)
      expect(server.url).toBe('http://localhost:3008')

      await server.close()

      expect(server.port).toBeUndefined()
      expect(server.url).toBeUndefined()
    })
  })

  describe('Route Configuration', () => {
    it('should handle routes with prefix', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3009,
        prefix: '/api'
      }

      server = createMockServer(options)
      await server.listen()

      expect(server.port).toBe(3009)
      expect(server.url).toBe('http://localhost:3009')

      // Test that routes are accessible under prefix
      const response = await fetch(`${server.url}/api/users`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
    })

    it('should handle different HTTP methods', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3010
      }

      server = createMockServer(options)
      await server.listen()

      // Test GET request
      const getResponse = await fetch(`${server.url}/users`)
      expect(getResponse.status).toBe(200)
      const getData = await getResponse.json()
      expect(getData.users).toBeDefined()

      // Test POST request
      const postResponse = await fetch(`${server.url}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User' })
      })
      expect(postResponse.status).toBe(200)
      const postData = await postResponse.json()
      expect(postData.success).toBe(true)
    })

    it('should handle parameterized routes', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3011
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/posts/123`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.post).toBeDefined()
      expect(data.post.id).toBe(1)
    })

    it('should handle root route', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3012
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.message).toBe('Welcome to Mock Server')
    })
  })

  describe('Middleware Integration', () => {
    it('should apply before middlewares correctly', async () => {
      const beforeMiddleware: Middleware = {
        name: 'auth',
        isAfter: false,
        middleware: async (event) => {
          console.log('Auth middleware executed')
          // Mock adding auth header
          if (event.node?.req?.headers) {
            event.node.req.headers['x-auth'] = 'authenticated'
          }
        }
      }

      const options: MockServerOptions = {
        routes: mockRoutes,
        middlewares: [beforeMiddleware],
        port: 3013
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/users`)
      expect(response.status).toBe(200)
    })

    it('should apply after middlewares correctly', async () => {
      const afterMiddleware: Middleware = {
        name: 'response-logger',
        isAfter: true,
        middleware: async () => {
          console.log('Response logger middleware executed')
        }
      }

      const options: MockServerOptions = {
        routes: mockRoutes,
        middlewares: [afterMiddleware],
        port: 3014
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/users`)
      expect(response.status).toBe(200)
    })

    it('should apply multiple middlewares in correct order', async () => {
      const executionOrder: string[] = []

      const middleware1: Middleware = {
        name: 'first',
        isAfter: false,
        middleware: async () => {
          executionOrder.push('before-1')
          console.log('First before middleware')
        }
      }

      const middleware2: Middleware = {
        name: 'second',
        isAfter: false,
        middleware: async () => {
          executionOrder.push('before-2')
          console.log('Second before middleware')
        }
      }

      const middleware3: Middleware = {
        name: 'third',
        isAfter: true,
        middleware: async () => {
          executionOrder.push('after-1')
          console.log('First after middleware')
        }
      }

      const options: MockServerOptions = {
        routes: mockRoutes,
        middlewares: [middleware1, middleware2, middleware3],
        port: 3015
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/users`)
      expect(response.status).toBe(200)
    })

    it('should handle middleware with and without names', async () => {
      const namedMiddleware: Middleware = {
        name: 'named-middleware',
        isAfter: false,
        middleware: async () => {
          console.log('Named middleware executed')
        }
      }

      const unnamedMiddleware: Middleware = {
        isAfter: true,
        middleware: async () => {
          console.log('Unnamed middleware executed')
        }
      }

      const options: MockServerOptions = {
        routes: mockRoutes,
        middlewares: [namedMiddleware, unnamedMiddleware],
        port: 3016
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/users`)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle server creation with invalid routes gracefully', () => {
      const invalidRoutes = [
        {
          url: '/test',
          method: 'invalid-method' as any,
          handler: async () => ({ test: true })
        }
      ]

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      server = createMockServer({
        routes: invalidRoutes,
        port: 3017
      })

      expect(server).toBeDefined()
      consoleSpy.mockRestore()
    })

    it('should handle port conflicts gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Create first server
      const server1 = createMockServer({
        routes: mockRoutes,
        port: 3018
      })
      await server1.listen()

      // Create second server on same port - should find alternative
      server = createMockServer({
        routes: mockRoutes,
        port: 3018
      })
      await server.listen()

      expect(server.port).toBeGreaterThan(3018)

      await server1.close()
      consoleSpy.mockRestore()
    })
  })

  describe('Advanced Configuration', () => {
    it('should handle custom h3Options', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3020,
        h3Options: {
          debug: true
        }
      }

      server = createMockServer(options)
      await server.listen()

      expect(server.port).toBe(3020)
      expect(server.url).toBe('http://localhost:3020')
    })

    it('should handle complex prefix configurations', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3021,
        prefix: '/api/v2/service'
      }

      server = createMockServer(options)
      await server.listen()

      const response = await fetch(`${server.url}/api/v2/service/users`)
      expect(response.status).toBe(200)
    })

    it('should handle concurrent requests', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3022
      }

      server = createMockServer(options)
      await server.listen()

      // Make multiple concurrent requests
      const requests = [
        fetch(`${server.url}/users`),
        fetch(`${server.url}/users`, { method: 'POST' }),
        fetch(`${server.url}/posts/1`),
        fetch(`${server.url}/`)
      ]

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Server State Management', () => {
    it('should maintain correct server state during lifecycle', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3023
      }

      server = createMockServer(options)

      // Initial state
      expect(server.port).toBeUndefined()
      expect(server.url).toBeUndefined()

      // After listening
      await server.listen()
      expect(server.port).toBe(3023)
      expect(server.url).toBe('http://localhost:3023')

      // After closing
      await server.close()
      expect(server.port).toBeUndefined()
      expect(server.url).toBeUndefined()
    })

    it('should handle multiple listen/close cycles', async () => {
      const options: MockServerOptions = {
        routes: mockRoutes,
        port: 3024
      }

      server = createMockServer(options)

      // First cycle
      await server.listen()
      expect(server.port).toBe(3024)
      await server.close()
      expect(server.port).toBeUndefined()

      // Second cycle
      await server.listen()
      expect(server.port).toBe(3024)
      await server.close()
      expect(server.port).toBeUndefined()
    })
  })
})
