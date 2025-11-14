/* eslint-disable no-console */
import { createAppServer } from '../src/server'

const appServer = createAppServer({
  routes: {
    '/': {
      GET: () => {
        return 'home'
      }
    },
    '/all': (event) => {
      console.log(`🚀 ~ event:`, event)
      return 'all'
    },
    '/hello': {
      GET: () => {
        return 'hello world'
      },
      POST: {
        handler: () => {
          return 'aaa'
        },
        options: {
          meta: { name: '333' }
        }
      }
    }
  },
  port: 3060
})
console.log(`🚀 ~ appServer:`, appServer)
