import type { Request, Response } from 'express'

import addServiceReturnLink from './addServiceReturnLink'

describe('addServiceReturnLink', () => {
  let req: Request
  const res = {
    locals: {},
  } as Response
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should add service return link and text to response', async () => {
    await addServiceReturnLink('Go to all activities tasks', '/activities')(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.locals.serviceReturnLinkText).toBe('Go to all activities tasks')
    expect(res.locals.serviceReturnLinkHref).toBe('/activities')
  })
})
