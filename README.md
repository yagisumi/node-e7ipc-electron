# @yagisumi/e7ipc-electron

Electron IPC wrapper similar to Electron v7.

[![NPM version][npm-image]][npm-url] [![install size][packagephobia-image]][packagephobia-url] [![DefinitelyTyped][dts-image]][dts-url]  
[![Build Status][githubactions-image]][githubactions-url] [![Coverage percentage][coveralls-image]][coveralls-url]

## Installation

```sh
$ npm i @yagisumi/e7ipc-electron
```

## Requirements

[@yagisumi/e7ipc-electron7](https://www.npmjs.com/package/@yagisumi/e7ipc-electron7) ― `electron` v7 or higher<br>
[@yagisumi/e7ipc-electron](https://www.npmjs.com/package/@yagisumi/e7ipc-electron) ― `electron` v5 or higher

## Usage

```ts
// messages.ts
export const CHANNEL = 'app'

type MapType<T, U = keyof T> = U extends keyof T ? T[U] : never

export interface Requests {
  hello: {
    type: 'hello'
  }
  bye: {
    type: 'bye'
  }
}

export type Request = MapType<Requests>

export interface Responses {
  ok: {
    type: 'ok'
  }
  error: {
    type: 'error'
    message: string
  }
}

export type Response = MapType<Responses>

export const unexpected = (): Response => {
  return { type: 'error', message: 'unexpected' }
}
```

```ts
// handler.ts
import { Handler } from '@yagisumi/e7ipc-electron'
import { Request, Response } from './messages'

export const handler: Handler<Request, Response> = async (_, req) => {
  if (req.type === 'hello') {
    return { type: 'ok' }
  } else if (req.type === 'bye') {
    return { type: 'error', message: `Don't say goodbye.` }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unreachable: never = req
    throw 'unreachable'
  }
}
```

```ts
// process: Main
import { ipcMain } from 'electron'
import { Request, Response, CHANNEL } from './messages'
import { handler } from './handler'
import { createServer } from '@yagisumi/e7ipc-electron'

const server = createServer<Request, Response>(CHANNEL, ipcMain)
server.handle(handler)
```

```ts
// Process: Renderer
import { ipcRenderer } from 'electron'
import { Request, Response, CHANNEL, unexpected } from './messages'
import { createClient } from '@yagisumi/e7ipc-electron'

const client = createClient<Request, Response>(CHANNEL, ipcRenderer)

async function foo() {
  const r1 = await client.invoke({ type: 'hello' }).catch(unexpected)
  // r1: { type: 'ok' }
  const r2 = await client.invoke({ type: 'bye' }).catch(unexpected)
  // r2: { type: 'error', message: `Don't say goodbye.` }
}
```

## Test

You can test handler with `@yagisumi/e7ipc-mock`

```ts
import { Mock } from '@yagisumi/e7ipc-mock'
import { Request, Response } from '@/messages'
import { handler } from '@/handler'

describe('handler', () => {
  test('request', async () => {
    const mock = new Mock<Request, Response>()
    mock.handle(handler)

    const r1 = await mock.invoke({ type: 'hello' })
    expect(r1.type).toBe('ok')

    const r2 = await mock.invoke({ type: 'bye' })
    expect(r2.type).toBe('error')
  })
})
```

## License

[MIT License](https://opensource.org/licenses/MIT)

[githubactions-image]: https://img.shields.io/github/workflow/status/yagisumi/node-e7ipc-electron/build?logo=github&style=flat-square
[githubactions-url]: https://github.com/yagisumi/node-e7ipc-electron/actions
[npm-image]: https://img.shields.io/npm/v/@yagisumi/e7ipc-electron.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@yagisumi/e7ipc-electron
[packagephobia-image]: https://flat.badgen.net/packagephobia/install/@yagisumi/e7ipc-electron
[packagephobia-url]: https://packagephobia.now.sh/result?p=@yagisumi/e7ipc-electron
[coveralls-image]: https://img.shields.io/coveralls/yagisumi/node-e7ipc-electron.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/yagisumi/node-e7ipc-electron?branch=master
[dts-image]: https://img.shields.io/badge/DefinitelyTyped-.d.ts-blue.svg?style=flat-square
[dts-url]: http://definitelytyped.org
