import { Request, Response } from 'express'
import { format } from 'date-fns'
import timeNowMiddleware from './timeNowMiddleware'

const res = {
  locals: {},
} as Response
const req = {} as Request
const next = jest.fn()

const middleware = timeNowMiddleware()

describe('timeNowMiddleware', () => {
  it('should add the current time to the response object', async () => {
    await middleware(req, res, next)

    expect(format(res.locals.now, 'yyyy-MM-dd HH:mm')).toEqual(format(new Date(), 'yyyy-MM-dd HH:mm'))
  })
})
