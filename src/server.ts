import { IpcMain } from 'electron'
import { RequestDispacher, IpcMainServer } from './server_impl'

const requestDispachers = new WeakMap<IpcMain, RequestDispacher>()

export function createServer<Req, Res>(channel: string, ipc: IpcMain) {
  let dispacher = requestDispachers.get(ipc)
  if (dispacher === undefined) {
    dispacher = new RequestDispacher(ipc)
    requestDispachers.set(ipc, dispacher)
  }
  const server = new IpcMainServer<Req, Res>(channel)
  dispacher.register(channel, server)

  return server
}
