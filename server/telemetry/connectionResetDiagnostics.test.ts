import { createServer, get } from 'node:http'
import type { AddressInfo, Socket } from 'node:net'
import logger from '../../logger'
import installConnectionResetDiagnostics from './connectionResetDiagnostics'

jest.mock('../../logger')

describe('connection reset diagnostics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('records a single reset after response headers arrive and preserves the response error', async () => {
    const stop = installConnectionResetDiagnostics()
    let serverSocket: Socket
    const server = createServer((request, response) => {
      serverSocket = request.socket
      response.writeHead(200, { 'Content-Length': '100' })
      response.flushHeaders()
    })
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      const { port } = server.address() as AddressInfo
      const error = await new Promise<NodeJS.ErrnoException>((resolve, reject) => {
        get(`http://127.0.0.1:${port}/activities/123`, { agent: false }, response => {
          let responseError: NodeJS.ErrnoException
          response.on('error', (err: NodeJS.ErrnoException) => {
            responseError = err
          })
          response.once('close', () => resolve(responseError))
          response.resume()
          // Wait until the client has received headers before truncating the response.
          serverSocket.destroy()
        }).on('error', reject)
      })

      expect(error.code).toBe('ECONNRESET')
      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'outbound_http_connection_reset',
          errorCode: 'ECONNRESET',
          endpoint: '/activities/:id',
          responseStarted: true,
        }),
        'Outbound HTTP connection reset',
      )
    } finally {
      stop()
      server.closeAllConnections()
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close(error => (error ? reject(error) : resolve()))
        })
      }
    }
  })

  it('records a real reset with a sanitised endpoint and preserves the request error', async () => {
    const stop = installConnectionResetDiagnostics()
    const server = createServer(request => request.socket.destroy())
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    try {
      const { port } = server.address() as AddressInfo
      const error = await new Promise<NodeJS.ErrnoException>(resolve => {
        get(`http://127.0.0.1:${port}/prisoners/A1234BC?token=secret`, { agent: false }).on('error', resolve)
      })
      expect(error.code).toBe('ECONNRESET')
      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'outbound_http_connection_reset',
          errorCode: 'ECONNRESET',
          host: '127.0.0.1',
          endpoint: '/prisoners/:value',
          reusedSocket: false,
          responseStarted: false,
          durationMs: expect.any(Number),
        }),
        'Outbound HTTP connection reset',
      )
      expect(JSON.stringify(jest.mocked(logger.warn).mock.calls)).not.toMatch(/A1234BC|secret|token/)
    } finally {
      stop()
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
      })
    }
  })
})
