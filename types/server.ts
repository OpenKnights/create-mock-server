import type { H3Plugin, serve } from 'h3'
import type { Middlewares } from './middlewares'
import type { Routes } from './routes'

type Server = ReturnType<typeof serve>

export interface AppServerOptions {
  routes: Routes
  port?: number
  middlewares?: Middlewares
  plugins?: H3Plugin[]
}

export interface AppServer {
  /** h3 raw server */
  raw: Server
  port: number | string
  url: string
  close: () => Promise<void>
}
