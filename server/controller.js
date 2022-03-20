import { Service } from './service.js'
import { logger } from './util.js'

export class Controller {
  constructor() {
    this.service = new Service()
  }

  async getFileStream(filename) {
    return this.service.getFileStream(filename)
  }

  async handleCommand({ command }) {
    logger.info(`Command received: ${command}`)
    const result = {
      result: 'Ok'
    }

    const cmd = command.toLowerCase()

    if (cmd.includes('start')) {
      this.service.startStreaming()
      return result
    }

    if (cmd.includes('stop')) {
      this.service.stopStreaming()
      return result
    }

    const chosenFx = await this.service.readFxByName(cmd)
    logger.info(`Added fx to service: ${chosenFx}`)

    this.service.appendFxStream(chosenFx)

    return result;
  }

  createClientStream() {
    const { id, clientStream } = this.service.createClientStream()

    const onClose = () => {
      logger.info(`Closing connection of ${id}`)
      this.service.removeClientStream(id)
    }

    logger.info(`Starting connection of ${id}`)

    return {
      stream: clientStream,
      onClose
    }
  }
}