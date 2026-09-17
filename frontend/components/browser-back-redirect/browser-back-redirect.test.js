// @ts-nocheck

import BrowserBackRedirect from './browser-back-redirect'

describe('BrowserBackRedirect', () => {
  let element
  let popStateHandler

  beforeEach(() => {
    element = {
      getAttribute: jest.fn().mockReturnValue('/appointments/create/journeyId/review-prisoners'),
    }
    popStateHandler = undefined

    global.window = {
      history: {
        state: null,
        replaceState: jest.fn(),
        pushState: jest.fn(),
      },
      location: {
        href: 'http://localhost/appointments/create/journeyId/name',
        assign: jest.fn(),
      },
      addEventListener: jest.fn((event, handler) => {
        if (event === 'popstate') popStateHandler = handler
      }),
    }
  })

  afterEach(() => {
    delete global.window
  })

  it('adds a history entry and redirects browser back navigation', () => {
    new BrowserBackRedirect(element)

    expect(window.history.replaceState).toHaveBeenCalledWith(
      { browserBackRedirect: '/appointments/create/journeyId/review-prisoners' },
      '',
    )
    expect(window.history.pushState).toHaveBeenCalledWith(
      { browserBackRedirect: '/appointments/create/journeyId/review-prisoners' },
      '',
      'http://localhost/appointments/create/journeyId/name',
    )

    popStateHandler()

    expect(window.location.assign).toHaveBeenCalledWith('/appointments/create/journeyId/review-prisoners')
  })

  it('does not add another history entry when the page is reloaded', () => {
    window.history.state = { browserBackRedirect: '/appointments/create/journeyId/review-prisoners' }

    new BrowserBackRedirect(element)

    expect(window.history.replaceState).not.toHaveBeenCalled()
    expect(window.history.pushState).not.toHaveBeenCalled()
    expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
  })
})
