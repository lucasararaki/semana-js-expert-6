import fs from 'fs'
import fsPromises from 'fs/promises'
import { extname, join } from 'path'
import { logger } from './util.js'
import { randomUUID } from 'crypto'
import { PassThrough, Writable } from 'stream'
import streamPromises from 'stream/promises'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { once } from 'events'
import config from './config.js'

const {
  dir: {
    publicDirectory
  },
  constants: {
    fallbackBitRate,
    bitRateDivisor,
    englishConversation
  }
} = config

export class Service {
  constructor() {
    this.clientStreams = new Map()
    this.currentSong = englishConversation
    this.currentBitrate = 0
    this.throttleTransform = {}
    this.currentReadable = {}

    this.startStreaming()
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(song) {
    try {
      const args = [
        '--i',
        '-B',
        song
      ]

      const { stderr, stdout } = this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable'),
      ])

      const [success, error] = [stdout, stderr].map(stream => stream.read())

      if (error) return await Promise.reject()

      return success
        .toString()
        .trim()
        .replace(/k/, '000')

    } catch (error) {
      logger.error(`Problemas ao obter o bitrate do arquivo: ${error}`)

      return fallbackBitRate
    }
  }

  broadcast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [id, stream] of this.clientStreams) {

          if (stream.writableEnded) {
            this.clientStreams.delete(id)
            continue
          }

          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreaming() {
    logger.info(`Starting with ${this.currentSong}`)

    const bitRate = this.currentBitrate = (await this.getBitRate(this.currentSong) / bitRateDivisor)
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)

    return streamPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadcast()
    )
  }

  createFileStream(filename) {
    return fs.createReadStream(filename)
  }

  async getFileInfo(file) {
    const fullFilePath = join(publicDirectory, file)

    // valida se existe, se não existir, estoura erro
    await fsPromises.access(fullFilePath)

    const fileType = extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file) {
    const { name, type } = await this.getFileInfo(file)

    return {
      stream: this.createFileStream(name),
      type
    }
  }
}