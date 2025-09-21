/* eslint-disable no-console */
import type { MethodOption } from '../src/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { addRoutesPrefix } from '../src'

/**
 * Test suite for utility functions
 * Tests the addRoutesPrefix functions
 */
describe('Utils Functions', () => {
  let mockRoutes: MethodOption[]

  beforeEach(() => {
    // Setup mock routes for testing
    mockRoutes = [
      {
        url: '/users',
        method: 'get',
        handler: async (event) => {
          console.log('GET /users handler called', event.node.req.url)
          return { users: [] }
        }
      },
      {
        url: '/posts',
        method: 'post',
        handler: async (event) => {
          console.log('POST /posts handler called', event.node.req.url)
          return { success: true }
        }
      },
      {
        url: '/',
        method: 'get',
        handler: async () => {
          return { message: 'Root endpoint' }
        }
      }
    ]
  })

  describe('addRoutesPrefix', () => {
    it('should add prefix to all route URLs correctly', () => {
      const prefix = '/api/v1'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      console.log(
        'Original routes:',
        mockRoutes.map((r) => r.url)
      )
      console.log(
        'Prefixed routes:',
        prefixedRoutes.map((r) => r.url)
      )

      // Verify all routes have the prefix
      expect(prefixedRoutes.every(({ url }) => url.startsWith(prefix))).toBe(
        true
      )

      // Verify specific URL transformations
      expect(prefixedRoutes[0].url).toBe('/api/v1/users')
      expect(prefixedRoutes[1].url).toBe('/api/v1/posts')
      expect(prefixedRoutes[2].url).toBe('/api/v1')
    })

    it('should handle prefix without leading slash', () => {
      const prefix = 'api'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      expect(prefixedRoutes[0].url).toBe('/api/users')
      expect(prefixedRoutes[1].url).toBe('/api/posts')
      expect(prefixedRoutes[2].url).toBe('/api')
    })

    it('should handle prefix with trailing slash', () => {
      const prefix = '/api/'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      expect(prefixedRoutes[0].url).toBe('/api/users')
      expect(prefixedRoutes[1].url).toBe('/api/posts')
      expect(prefixedRoutes[2].url).toBe('/api')
    })

    it('should handle root prefix correctly', () => {
      const prefix = '/'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      expect(prefixedRoutes[0].url).toBe('/users')
      expect(prefixedRoutes[1].url).toBe('/posts')
      expect(prefixedRoutes[2].url).toBe('/')
    })

    it('should return original routes when prefix is empty', () => {
      const emptyPrefixes = ['', '   ', null, undefined]

      emptyPrefixes.forEach((prefix) => {
        const result = addRoutesPrefix(mockRoutes, prefix as string)
        expect(result).toEqual(mockRoutes)
      })
    })

    it('should preserve other route properties', () => {
      const prefix = '/api'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      prefixedRoutes.forEach((route, index) => {
        expect(route.method).toBe(mockRoutes[index].method)
        expect(route.handler).toBe(mockRoutes[index].handler)
      })
    })

    it('should handle URLs without leading slash', () => {
      const routesWithoutSlash: MethodOption[] = [
        {
          url: 'users',
          method: 'get',
          handler: async () => ({ users: [] })
        },
        {
          url: 'posts',
          method: 'get',
          handler: async () => ({ posts: [] })
        }
      ]

      const prefix = '/api'
      const prefixedRoutes = addRoutesPrefix(routesWithoutSlash, prefix)

      expect(prefixedRoutes[0].url).toBe('/api/users')
      expect(prefixedRoutes[1].url).toBe('/api/posts')
    })

    it('should handle complex nested paths', () => {
      const nestedRoutes: MethodOption[] = [
        {
          url: '/api/v1/users/:id',
          method: 'get',
          handler: async () => ({ user: {} })
        },
        {
          url: '/admin/dashboard',
          method: 'get',
          handler: async () => ({ dashboard: {} })
        }
      ]

      const prefix = '/service'
      const prefixedRoutes = addRoutesPrefix(nestedRoutes, prefix)

      expect(prefixedRoutes[0].url).toBe('/service/api/v1/users/:id')
      expect(prefixedRoutes[1].url).toBe('/service/admin/dashboard')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty routes array', () => {
      const emptyRoutes: MethodOption[] = []
      const prefix = '/api'
      const result = addRoutesPrefix(emptyRoutes, prefix)

      expect(result).toEqual([])
    })

    it('should handle special characters in prefix', () => {
      const specialRoutes: MethodOption[] = [
        {
          url: '/test',
          method: 'get',
          handler: async () => ({ test: true })
        }
      ]

      const prefix = '/api-v1_test'
      const prefixedRoutes = addRoutesPrefix(specialRoutes, prefix)

      expect(prefixedRoutes[0].url).toBe('/api-v1_test/test')
    })

    it('should preserve route order', () => {
      const prefix = '/api'
      const prefixedRoutes = addRoutesPrefix(mockRoutes, prefix)

      expect(prefixedRoutes).toHaveLength(mockRoutes.length)
      prefixedRoutes.forEach((route, index) => {
        expect(route.method).toBe(mockRoutes[index].method)
      })
    })
  })
})
