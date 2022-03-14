import config from './config.js';
import server from './server.js';
import { logger } from './util.js'

const { port } = config

server.listen(port)
  .on('listening', () => logger.info(`Server is running on ${port}`))