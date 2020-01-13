import { Server, Handler } from '@yagisumi/e7ipc-types'
import { MESSAGE, ResponseMessage, RequestMessage } from './messages'
import { IpcMain } from 'electron'

interface IpcMainEvent {
  reply(channel: string, ...args: any): void
}

export class RequestDispacher {
  private readonly ipc: IpcMain
  private servers: Map<string, IpcMainServer<any, any>> = new Map()
  constructor(ipc: IpcMain) {
    this.ipc = ipc
    ipc.on(MESSAGE, (ev, msg: RequestMessage<any>) => {
      setImmediate(() => {
        this.handle(ev as any, msg)
      })
    })
  }

  handle(ev: IpcMainEvent, msg: RequestMessage<any>) {
    if (typeof msg === 'object' && 'channel' in msg && 'id' in msg) {
      const server = this.servers.get(msg.channel)
      if (server && server.handler) {
        server
          .handler({}, msg.request)
          .then((response) => {
            this.send(ev, {
              channel: msg.channel,
              id: msg.id,
              type: 'ok',
              response,
            })
          })
          .catch((err) => {
            const e: Error = {
              name: 'Error',
              stack: undefined,
              message: '',
            }

            if (typeof err === 'string') {
              e.message = err
            } else if (err instanceof Error) {
              e.name = err.name
              e.stack = err.stack
              e.message = err.message
            }

            this.send(ev, {
              channel: msg.channel,
              id: msg.id,
              type: 'error',
              error: e,
            })
          })
      } else {
        this.send(ev, {
          channel: msg.channel,
          id: msg.id,
          type: 'error',
          error: {
            name: 'NoHandlerError',
            message: `No handler for '${msg.channel}'`,
          },
        })
      }
    }
  }

  register(channel: string, server: IpcMainServer<any, any>) {
    if (this.servers.has(channel)) {
      throw new Error(`already registered channel '${channel}'`)
    }

    this.servers.set(channel, server)
  }

  private send(ev: IpcMainEvent, msg: ResponseMessage<any>) {
    ev.reply(MESSAGE, msg)
  }
}

export class IpcMainServer<Req, Res> implements Server<Req, Res> {
  readonly channel: string
  handler?: Handler<Req, Res>

  constructor(channel: string) {
    this.channel = channel
  }

  handle(listener: Handler<Req, Res>) {
    if (this.handler !== undefined) {
      throw new Error(`already exist handler for '${this.channel}'`)
    }
    this.handler = listener
  }

  handleOnce(listener: Handler<Req, Res>) {
    this.handle((ev, req) => {
      this.removeHandler()
      return listener(ev, req)
    })
  }

  removeHandler() {
    this.handler = undefined
  }
}
