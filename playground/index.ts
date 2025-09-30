import { createMockServer } from '../src/index'

async function runMockServer() {
  const server = createMockServer({
    routes: [
      {
        url: '/hello',
        method: 'get',
        handler: () => {
          return 'hello world'
        }
      },
      {
        url: '/',
        method: 'get',
        handler: () => {
          return 'home'
        }
      }
    ],
    port: 3060,
    prefix: '/api'
  })
  await server.listen()
}

runMockServer()
