import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import portfinder from 'portfinder'
import superTest from 'supertest'
import { Transform } from 'stream'
import { setTimeout } from 'timers/promises'

import config from '../../../server/config'
import Server from '../../../server/server.js'
import { send } from 'process'
// import TestUtil from '../_util/testUtill'
// import { Controller } from '../../../server/controller'
// import { handler } from '../../../server/routes'

const { pages, location, constants: { CONTENT_TYPE } } = config
const RETENTION_DATA_PERIOD = 200 // ms

const getavailablePort = portfinder.getPortPromise

describe('API E2E Suit test', () => {
  const commandResponse = JSON.stringify({ result: 'Ok' })
  const possibleCommands = {
    start: 'start',
    stop: 'stop'
  }

  function pipeAndReadStreamData(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk)

        cb(null, chunk)
      }
    })

    return stream.pipe(transform)
  }

  describe('client workflow', () => {

    async function getTestServer() {
      const getSuperTest = port => superTest(`http://localhost:${port}`)
      const port = await getavailablePort()

      return new Promise((resolve, reject) => {
        const server = Server.listen(port)
          .once('listening', () => {

            const testServer = getSuperTest(port)

            const response = {
              testServer,
              kill() {
                server.close()
              }
            }

            return resolve(response)

          })
          .once('error', reject)
      })
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer.post('/controller')
            .send({
              command
            })

          expect(response.text).toStrictEqual(commandResponse)
        }
      }
    }

    test('it should not receive data stream if the process is not playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()

      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )

      await setTimeout(RETENTION_DATA_PERIOD)
      server.kill()

      expect(onChunk).not.toHaveBeenCalled()
    })

    test('it should receive data stream if the process is playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const { send } = commandSender(server.testServer)

      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )

      await send(possibleCommands.start)
      await setTimeout(RETENTION_DATA_PERIOD)
      await send(possibleCommands.stop)

      const [[buffer]] = onChunk.mock.calls;

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      server.kill()
    })
  })
})