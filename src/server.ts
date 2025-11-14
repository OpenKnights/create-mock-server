import type { AppServer, AppServerOptions } from '#types/server'

import { H3, serve } from 'h3'
import { registerMiddlewares } from './middlewares'
import { registerRoutes } from './routes'

function createAppServer(options: AppServerOptions) {
  const { routes, middlewares, port = 0 } = options

  const app = new H3()

  // 注册所有中间价
  registerMiddlewares(app, middlewares)

  // 注册所有路由
  registerRoutes(app, routes)

  const server = serve(app, { port })

  const appServer: AppServer = {
    raw: server,
    port: server.options.port || port,
    url: server.url || `http://localhost:${server.options.port}`,
    close: server.close
  }

  return appServer
}

export { createAppServer }
