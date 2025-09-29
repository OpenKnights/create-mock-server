# create-mock-server

[![npm version](https://badge.fury.io/js/create-mock-server.svg)](https://badge.fury.io/js/create-mock-server)
[![license](https://img.shields.io/npm/l/create-mock-server.svg)](https://github.com/OpenKnights/create-mock-server/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dm/create-mock-server.svg)](https://www.npmjs.com/package/create-mock-server)

A lightweight, flexible mock server library built on top of **H3** framework. Create realistic HTTP mock servers with minimal configuration for rapid API development, testing, and prototyping.

## ✨ Features

- 🏗️ **H3 Framework** - Built on the modern, universal H3 framework
- 🚀 **Zero Configuration** - Start mocking APIs instantly
- 🛣️ **Flexible Routing** - Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- 🔧 **Middleware Support** - Before/after middleware execution control
- 📍 **Route Prefixes** - Organize routes with URL prefixes
- 🔄 **Auto Port Detection** - Automatic port fallback when port is occupied
- ⚡ **TypeScript First** - Full TypeScript support with complete type definitions
- 🎯 **Programmatic API** - Easy integration into existing projects
- 🪶 **Lightweight** - Minimal dependencies, maximum performance

## 📦 Installation

```bash
npm install create-mock-server
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createMockServer } from 'create-mock-server'

const server = createMockServer({
  routes: [
    {
      url: '/api/users',
      method: 'get',
      handler: async (event) => {
        return {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ]
        }
      }
    },
    {
      url: '/api/users/:id',
      method: 'get',
      handler: async (event) => {
        const id = getRouterParam(event, 'id')
        return {
          id: Number.parseInt(id),
          name: `User ${id}`,
          email: `user${id}@example.com`
        }
      }
    }
  ],
  port: 3000
})

await server.listen()
console.log(`Mock server running at ${server.url}`)
```

## 📋 API Reference

### `createMockServer(options: MockServerOptions)`

Creates a new mock server instance.

#### Options

```typescript
interface MockServerOptions {
  /** Array of route configurations */
  routes: MethodOption[]
  /** Array of middleware configurations */
  middlewares?: Middleware[]
  /** Server port number (default: 3060) */
  port?: number
  /** Prefix for all routes */
  prefix?: string
  /** H3 application configuration options */
  h3Options?: AppOptions
}
```

#### Route Configuration

```typescript
interface MethodOption {
  /** Route URL path */
  url: string
  /** HTTP method (default: 'get') */
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch'
  /** Event handler function */
  handler: EventHandler
}
```

### Server Instance Methods

```typescript
interface MockServer {
  /** H3 application instance */
  app: App
  /** H3 router instance */
  router: Router
  /** Current server port */
  port?: number
  /** Server URL */
  url?: string
  /** Node.js HTTP server instance */
  http: Server
  /** Start the server */
  listen: (port?: number) => Promise<void>
  /** Stop the server */
  close: () => Promise<void>
}
```

## 🛠️ Advanced Usage

### Using Middlewares

```typescript
import { createMiddleware, createMockServer } from 'create-mock-server'
import { readBody, setHeader } from 'h3'

const corsMiddleware = createMiddleware(
  async (event) => {
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    setHeader(
      event,
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
  },
  { name: 'cors', isAfter: false }
)

const loggingMiddleware = createMiddleware(
  async (event) => {
    console.log(`${event.node.req.method} ${event.node.req.url}`)
  },
  { name: 'logger', isAfter: true }
)

const server = createMockServer({
  routes: [
    {
      url: '/api/users',
      method: 'post',
      handler: async (event) => {
        const body = await readBody(event)
        return { message: 'User created', data: body }
      }
    }
  ],
  middlewares: [corsMiddleware, loggingMiddleware],
  port: 3000
})
```

### Route Prefixes

```typescript
import { addRoutesPrefix, createMockServer } from 'create-mock-server'

const routes = [
  {
    url: '/users',
    method: 'get' as const,
    handler: async () => ({ users: [] })
  },
  {
    url: '/posts',
    method: 'get' as const,
    handler: async () => ({ posts: [] })
  }
]

// Method 1: Using prefix option
const server1 = createMockServer({
  routes,
  prefix: '/api/v1' // All routes will be prefixed with /api/v1
})

// Method 2: Using utility function
const prefixedRoutes = addRoutesPrefix(routes, '/api/v1')
const server2 = createMockServer({
  routes: prefixedRoutes
})
```

### Working with Request Data

```typescript
import { getQuery, getRouterParam, readBody } from 'h3'

const server = createMockServer({
  routes: [
    {
      url: '/api/users/:id',
      method: 'get',
      handler: async (event) => {
        const id = getRouterParam(event, 'id')
        const query = getQuery(event)

        return {
          user: { id: Number.parseInt(id), name: `User ${id}` },
          query
        }
      }
    },
    {
      url: '/api/users',
      method: 'post',
      handler: async (event) => {
        const userData = await readBody(event)

        return {
          message: 'User created successfully',
          user: { id: Date.now(), ...userData }
        }
      }
    }
  ]
})
```

### Error Handling

```typescript
import { createError } from 'h3'

const server = createMockServer({
  routes: [
    {
      url: '/api/users/:id',
      method: 'get',
      handler: async (event) => {
        const id = getRouterParam(event, 'id')

        if (id === '404') {
          throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
          })
        }

        return { id: Number.parseInt(id), name: `User ${id}` }
      }
    }
  ]
})
```

## 🧪 Testing Integration

### Vitest Example

```typescript
import { createMockServer } from 'create-mock-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Mock Server Tests', () => {
  let server: MockServer

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        {
          url: '/api/test',
          handler: async () => ({ message: 'Hello from mock server!' })
        }
      ]
    })
    await server.listen()
  })

  afterAll(async () => {
    await server.close()
  })

  it('should handle requests correctly', async () => {
    const response = await fetch(`${server.url}/api/test`)
    const data = await response.json()

    expect(data.message).toBe('Hello from mock server!')
  })
})
```

## 🔧 Utilities

### `addRoutesPrefix(routes, prefix)`

Adds a unified prefix to all routes in an array.

```typescript
import { addRoutesPrefix } from 'create-mock-server'

const routes = [
  { url: '/users', method: 'get', handler: getUsersHandler },
  { url: '/posts', method: 'get', handler: getPostsHandler }
]

const prefixedRoutes = addRoutesPrefix(routes, '/api/v1')
// Result:
// [
//   { url: '/api/v1/users', method: 'get', handler: getUsersHandler },
//   { url: '/api/v1/posts', method: 'get', handler: getPostsHandler }
// ]
```

### `createMiddleware(handler, options)`

Creates a middleware configuration object.

```typescript
import { createMiddleware } from 'create-mock-server'

const middleware = createMiddleware(
  async (event) => {
    // Middleware logic here
  },
  {
    name: 'my-middleware',
    isAfter: false // Execute before routes
  }
)
```

## 📝 Real-World Examples

### REST API Mock

```typescript
import { createMockServer } from 'create-mock-server'
import { getRouterParam, readBody } from 'h3'

// Simulate a simple user database
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]

const server = createMockServer({
  routes: [
    // Get all users
    {
      url: '/users',
      method: 'get',
      handler: async () => ({ users })
    },

    // Get user by ID
    {
      url: '/users/:id',
      method: 'get',
      handler: async (event) => {
        const id = Number.parseInt(getRouterParam(event, 'id'))
        const user = users.find((u) => u.id === id)

        if (!user) {
          throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
          })
        }

        return { user }
      }
    },

    // Create new user
    {
      url: '/users',
      method: 'post',
      handler: async (event) => {
        const userData = await readBody(event)
        const newUser = {
          id: Math.max(...users.map((u) => u.id)) + 1,
          ...userData
        }

        users.push(newUser)
        return { user: newUser, message: 'User created successfully' }
      }
    },

    // Update user
    {
      url: '/users/:id',
      method: 'put',
      handler: async (event) => {
        const id = Number.parseInt(getRouterParam(event, 'id'))
        const userData = await readBody(event)
        const userIndex = users.findIndex((u) => u.id === id)

        if (userIndex === -1) {
          throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
          })
        }

        users[userIndex] = { ...users[userIndex], ...userData }
        return { user: users[userIndex], message: 'User updated successfully' }
      }
    },

    // Delete user
    {
      url: '/users/:id',
      method: 'delete',
      handler: async (event) => {
        const id = Number.parseInt(getRouterParam(event, 'id'))
        const userIndex = users.findIndex((u) => u.id === id)

        if (userIndex === -1) {
          throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
          })
        }

        users.splice(userIndex, 1)
        return { message: 'User deleted successfully' }
      }
    }
  ],
  prefix: '/api',
  port: 3000
})

await server.listen()
console.log(`REST API Mock Server running at ${server.url}`)
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/OpenKnights/create-mock-server)
- [NPM Package](https://www.npmjs.com/package/create-mock-server)
- [H3 Framework](https://github.com/unjs/h3)
- [Issue Tracker](https://github.com/OpenKnights/create-mock-server/issues)

## 🙏 Acknowledgments

- Built on top of the excellent [H3](https://github.com/unjs/h3) framework
- Inspired by the need for simple, powerful mock servers
- Thanks to all contributors who make this project possible

---

**Happy Mocking with H3!** 🎭
