import { createClient, createServer } from '@/e7ipc-electron'
import { MESSAGE } from '@/messages'
import { createElectronIpcMock } from './mock'
import { Request, Response, handler } from './messages'

describe('e7ipc-child-process', () => {
  test('normal request', async () => {
    const [main, renderer] = createElectronIpcMock()
    const client = createClient<Request, Response>('test', renderer as any)
    const server = createServer<Request, Response>('test', main as any)

    server.handle(handler)

    const r1 = await client.invoke({ type: 'hello' })
    expect(r1).toEqual({ type: 'ok' })

    const r2 = await client.invoke({ type: 'bye' }).catch((err) => {
      expect(err).toBeInstanceOf(Error)
      return null
    })
    expect(r2).toBeNull()
  })

  test('handle, removeHandler, handleOnce', async () => {
    const [main, renderer] = createElectronIpcMock()
    const client = createClient<Request, Response>('test', renderer as any)
    const server = createServer<Request, Response>('test', main as any)

    const r1 = await client.invoke({ type: 'hello' }).catch((err) => {
      expect(err).toBeInstanceOf(Error)
      return null
    })
    expect(r1).toBeNull()

    server.handleOnce(handler)
    expect(() => {
      server.handle(handler)
    }).toThrowError()

    const r2 = await client.invoke({ type: 'hello' })
    expect(r2).toEqual({ type: 'ok' })

    const r3 = await client.invoke({ type: 'hello' }).catch((err) => {
      expect(err).toBeInstanceOf(Error)
      return null
    })
    expect(r3).toBeNull()
  })

  // for coverage
  test('send unrelated message', (done) => {
    const [main, renderer] = createElectronIpcMock()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const client = createClient<Request, Response>('test', renderer as any)
    const server = createServer<Request, Response>('test', main as any)

    server.handle(handler)

    renderer.emitter.emit(MESSAGE, 'test')
    renderer.send(MESSAGE, 'test')

    renderer.emitter.emit(MESSAGE, {})
    renderer.send(MESSAGE, {})

    renderer.emitter.emit(MESSAGE, { channel: 'test' })
    renderer.send(MESSAGE, { channel: 'test' })

    setImmediate(() => {
      done()
    })
  })

  test('throw error', async () => {
    const [main, renderer] = createElectronIpcMock()
    const client = createClient<Request, Response>('test', renderer as any)
    const server = createServer<Request, Response>('test', main as any)

    server.handle(handler)

    const r1 = await client.invoke({ type: 'throwString' }).catch((err) => err)
    expect(r1).toBeInstanceOf(Error)

    const r2 = await client.invoke({ type: 'throwObject' }).catch((err: Error) => err)
    expect(r2).toBeInstanceOf(Error)
    if (r2 instanceof Error) {
      expect(r2.message).toBe('')
    }
  })

  test('register the same channel twice', () => {
    expect(() => {
      const [main] = createElectronIpcMock()
      createServer<Request, Response>('test', main as any)
      createServer<Request, Response>('test', main as any)
    }).toThrowError()
  })

  test('createClient', () => {
    expect(() => {
      createClient<Request, Response>('test', {} as any)
    }).toThrowError()

    const renderer = createElectronIpcMock()[1]
    const client1 = createClient<Request, Response>('test', renderer as any)
    const client2 = createClient<Request, Response>('test', renderer as any)

    const n = client1['counter']()
    expect(client2['counter']()).toBe(n + 1)
  })
})
