import { EventEmitter } from 'events'

class IpcRendererMock {
  emitter = new EventEmitter()
  pair!: EventEmitter

  send(channel: string, ...args: any[]) {
    this.pair.emit(channel, ...args)
  }

  on(channel: string, listener: (ev: any, ...args: any[]) => void) {
    this.emitter.on(channel, (...args) => {
      listener({}, ...args)
    })
  }
}

interface IpcMainMockEvent {
  reply(channel: string, ...args: any[]): void
}

class IpcMainMock {
  emitter = new EventEmitter()
  pair!: EventEmitter
  listeners = new Map<string, (...args: any[]) => void>()

  on(channel: string, listener: (event: IpcMainMockEvent, ...args: any[]) => void) {
    this.listeners.set(channel, listener)

    this.emitter.on(channel, (...args: any[]) => {
      listener({ reply: this.pair.emit.bind(this.pair) }, ...args)
    })
  }
}

export function createElectronIpcMock(): [IpcMainMock, IpcRendererMock] {
  const main = new IpcMainMock()
  const renderer = new IpcRendererMock()
  main.pair = renderer.emitter
  renderer.pair = main.emitter

  return [main, renderer]
}
