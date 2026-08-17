// @ts-nocheck

import BackLink from './back-link'

describe('BackLink', () => {
  let backLink
  let clickHandler

  beforeEach(() => {
    clickHandler = undefined

    backLink = {
      remove: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'click') {
          clickHandler = handler
        }
      }),
    }

    global.window = {
      history: {
        length: 2,
        go: jest.fn(),
      },
    }

    global.document = {
      getElementsByClassName: jest.fn().mockReturnValue([]),
    }
  })

  afterEach(() => {
    delete global.window
    delete global.document
  })

  it('should go back one page when clicked', () => {
    new BackLink(backLink)

    const event = {
      preventDefault: jest.fn(),
    }

    clickHandler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(window.history.go).toHaveBeenCalledWith(-1)
  })

  it('should go back two pages when returning from a validation error', () => {
    document.getElementsByClassName.mockReturnValue([{}])

    new BackLink(backLink)

    clickHandler({
      preventDefault: jest.fn(),
    })

    expect(window.history.go).toHaveBeenCalledWith(-2)
  })

  it('should remove the back link when there is no browser history', () => {
    window.history.length = 1

    new BackLink(backLink)

    expect(backLink.remove).toHaveBeenCalled()
  })
})
