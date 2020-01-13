import { IpcRenderer } from 'electron'
import { IpcRendererClient, ResponseDispacher } from './client_impl'

const responseDispachers = new WeakMap<IpcRenderer, ResponseDispacher>()

export function createClient<Req, Res>(channel: string, ipc: IpcRenderer) {
  let dispacher = responseDispachers.get(ipc)
  if (dispacher === undefined) {
    dispacher = new ResponseDispacher(ipc)
    responseDispachers.set(ipc, dispacher)
  }

  return new IpcRendererClient<Req, Res>(ipc, channel, dispacher.event, dispacher.counter)
}
