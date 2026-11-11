// @ts-nocheck

import accessibleAutocomplete from 'accessible-autocomplete'
import AutoComplete from './autocomplete'

jest.mock('accessible-autocomplete', () => ({
  enhanceSelectElement: jest.fn(),
}))

describe('AutoComplete', () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator')
  const originalDocument = Object.getOwnPropertyDescriptor(global, 'document')
  let selectElement

  const setDevice = (userAgent, platform, maxTouchPoints) => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { userAgent, platform, maxTouchPoints },
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'MacIntel', 0)
    selectElement = {
      setAttribute: jest.fn(),
      parentNode: { setAttribute: jest.fn(), addEventListener: jest.fn() },
    }
    Object.defineProperty(global, 'document', {
      configurable: true,
      value: { querySelector: jest.fn().mockReturnValue(selectElement) },
    })
  })

  afterEach(() => {
    if (originalNavigator) Object.defineProperty(global, 'navigator', originalNavigator)
    else delete global.navigator
    if (originalDocument) Object.defineProperty(global, 'document', originalDocument)
    else delete global.document
  })

  it.each([
    ['iPad', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'iPad', 5],
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'iPhone', 5],
    ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', 'iPod', 5],
    [
      'iPad with a desktop user agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      'MacIntel',
      5,
    ],
    ['Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'MacIntel', 0],
    ['Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0],
    ['touchscreen Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 10],
    ['Android', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36', 'Linux armv8l', 5],
  ])('retains autocomplete on %s', (_device, userAgent, platform, maxTouchPoints) => {
    setDevice(userAgent, platform, maxTouchPoints)

    new AutoComplete({ content: 'categoryCode,locationId' })

    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(2)
    expect(document.querySelector).toHaveBeenCalledWith('#categoryCode')
    expect(document.querySelector).toHaveBeenCalledWith('#locationId')
    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledWith({
      selectElement,
      showAllValues: true,
      preserveNullOptions: true,
      templates: { suggestion: expect.any(Function) },
    })
    expect(selectElement.setAttribute).toHaveBeenCalledWith('type', 'search')
  })

  it('escapes HTML in autocomplete suggestions', () => {
    new AutoComplete({ content: 'categoryCode' })

    const { templates } = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(templates.suggestion('<script>alert("test")</script>')).toEqual(
      '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;',
    )
  })
})
