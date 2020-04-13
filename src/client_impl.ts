import { Client } from '@yagisumi/e7ipc-types'
import { MESSAGE, ErrorData, ResponseMessage, RequestMessage } from './messages'
import EventEmitter from 'eventemitter3'
import { IpcRenderer } from 'electron'

export function getCounter() {
  let i = 0
  return function () {
    i = (i + 1) & 0xffffff
    return i
  }
}

export function eventKey(channel: string, id: number) {
  return `${channel}/=/${id}`
}

export class ResponseDispacher {
  private readonly ipc: IpcRenderer
  readonly event: EventEmitter
  readonly counter = getCounter()

  constructor(ipc: IpcRenderer) {
    this.ipc = ipc
    this.event = new EventEmitter()

    ipc.on(MESSAGE, (_: any, msg: ResponseMessage<any>) => {
      setTimeout(() => {
        if (typeof msg === 'object' && 'channel' in msg && 'id' in msg) {
          this.event.emit(eventKey(msg.channel, msg.id), msg)
        }
      }, 0)
    })
  }
}

export function wrapError(newError: Error, baseError: ErrorData) {
  if (baseError.stack) {
    let newEntries: string[] = []
    if (newError.stack) {
      newEntries = newError.stack.split('\n')
    }
    const baseEntries = baseError.stack.split('\n')
    const entries = []
    if (newEntries.length > 0) {
      entries.push(newEntries.shift())
    }

    for (const entry of newEntries) {
      if (baseEntries.includes(entry)) {
        break
      }
      entries.push(entry)
    }
    entries.push(...baseEntries)
    newError.stack = entries.join('\n')
  }

  Object.defineProperty(newError, 'name', {
    configurable: true,
    enumerable: false,
    value: baseError.name,
    writable: true,
  })

  return newError
}

export class IpcRendererClient<Req, Res> implements Client<Req, Res> {
  private readonly ipc: IpcRenderer
  readonly channel: string
  private readonly event: EventEmitter
  private readonly counter: () => number

  constructor(ipc: IpcRenderer, channel: string, event: EventEmitter, counter: () => number) {
    this.ipc = ipc
    this.channel = channel
    this.event = event
    this.counter = counter
  }

  invoke(request: Req) {
    const id = this.counter()
    return new Promise<Res>((resolve, reject) => {
      this.event.once(eventKey(this.channel, id), (msg: ResponseMessage<Res>) => {
        setTimeout(() => {
          if (msg.type === 'error') {
            const err = new Error(msg.error.message)
            wrapError(err, msg.error)
            reject(err)
          } else {
            resolve(msg.response)
          }
        }, 0)
      })
      this.send({ channel: this.channel, id, request })
    })
  }

  private send(msg: RequestMessage<Req>) {
    this.ipc.send(MESSAGE, msg)
  }
}
