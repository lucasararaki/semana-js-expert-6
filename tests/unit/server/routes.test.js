import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'
import TestUtil from '../_util/testUtill'

const { pages, location, constants: { CONTENT_TYPE } } = config

describe('#Routes - test suite for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      { 'Location': location.home }
    )
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home - should respond with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
  })

  test(`GET /controller - should respond with ${pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
  })

  test(`GET /index.html - should respond with a file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/index.html'

    params.request.method = 'GET'
    params.request.url = filename

    const expectedType = '.html'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType
      })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(filename)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
    expect(params.response.writeHead).toBeCalledWith(
      200,
      {
        'Content-Type': CONTENT_TYPE[expectedType]
      }
    )
  })

  test(`GET /file.ext - should respond with a file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/file.ext'

    params.request.method = 'GET'
    params.request.url = filename

    const expectedType = '.ext'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType
      })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(filename)
    expect(mockFileStream.pipe).toBeCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  test(`GET /unknown - given an inexistent route it should respond with 404`, async () => {
    const params = TestUtil.defaultHandleParams()

    params.request.method = 'GET'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`POST /unknown - given an inexistent route it should respond with 404`, async () => {
    const params = TestUtil.defaultHandleParams()

    params.request.method = 'POST'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    test('given inexistent file it should responde with 404', async () => {
      const params = TestUtil.defaultHandleParams()

      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given an error it should responde with 500', async () => {
      const params = TestUtil.defaultHandleParams()

      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})