import config from "./config.js"
import { logger } from './util.js'
import { Controller } from "./controller.js"
import { once } from 'events'

const {
  location,
  pages: {
    homeHTML,
    controllerHTML
  },
  constants: {
    CONTENT_TYPE
  }
} = config

const controller = new Controller()

const routesObject = {
  'GET': {
    '/': function (_, response) {
      response.writeHead(302, {
        'Location': location.home
      })

      return response.end()
    },
    '/home': async function (_, response) {
      const { stream } = await controller.getFileStream(homeHTML)

      return stream.pipe(response)
    },
    '/controller': async function (_, response) {
      const { stream } = await controller.getFileStream(controllerHTML)

      return stream.pipe(response)
    },
    '/stream': (request, response) => {
      const { stream, onClose } = controller.createClientStream()

      request.once('close', onClose)
      response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      })

      return stream.pipe(response)
    },
    'default': async function ({ url }, response) {
      const { stream, type } = await controller.getFileStream(url)

      const contentType = CONTENT_TYPE[type]

      if (contentType) {
        response.writeHead(200, {
          'Content-Type': CONTENT_TYPE[type]
        })
      }

      return stream.pipe(response)
    }
  },
  'POST': {
    '/controller': async (request, response) => {
      const data = await once(request, 'data')
      const item = JSON.parse(data)
      const result = await controller.handleCommand(item)

      return response.end(JSON.stringify(result))
    }
  }
}

async function routes(request, response) {
  const { method, url } = request

  const methodHandlers = routesObject[method]

  const isStreamRoute = url.includes('/stream')
  const route = isStreamRoute ? '/stream' : url;

  const responseObject = methodHandlers
    ? methodHandlers[route] || methodHandlers['default']
    : null

  if (responseObject) {
    return responseObject(request, response)
  }

  response.writeHead(404)
  return response.end()
}

function handleError(error, response) {
  if (error.message.includes('ENOENT')) {
    logger.warn(`Asset not found ${error.stack}`)

    response.writeHead(404)
    return response.end()
  }

  logger.error(`Caught error on API ${error.stack}`)

  response.writeHead(500)
  return response.end()
}

export function handler(request, response) {
  return routes(request, response)
    .catch(error => handleError(error, response))
}