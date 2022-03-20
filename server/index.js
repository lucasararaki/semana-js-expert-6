import config from './config.js';
import server from './server.js';
import { logger } from './util.js'

const { port } = config

server.listen(port)
  .on('listening', () => logger.info(`Server is running on ${port}`))

// impede que um erro não tratado derrube a aplicação
process.on('uncaughtException', (error) => logger.error(`UncaughtException happened: ${error.stack || error}`)) // throw
process.on('unhandledRejection', (error) => logger.error(`UnhandledRejection happened: ${error.stack || error}`)) // Promises