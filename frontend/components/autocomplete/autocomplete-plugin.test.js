// @ts-nocheck

import { readFile } from 'node:fs/promises'
import { accessibleAutocompletePlugin } from '../../../esbuild/accessible-autocomplete.plugin'

jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }))

describe('accessible-autocomplete iPadOS build patch', () => {
  let load

  beforeEach(() => {
    jest.clearAllMocks()
    const build = { onLoad: jest.fn() }
    accessibleAutocompletePlugin().setup(build)
    const [options, handler] = build.onLoad.mock.calls[0]
    expect(options.filter.test('/node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js')).toBe(true)
    expect(options.filter.test('/node_modules/another-library/dist/accessible-autocomplete.min.js')).toBe(false)
    load = handler
  })

  it('extends the iOS check and preserves the rest of the distributed code', async () => {
    const original =
      'function H(){return"undefined"!=typeof navigator&&!(!navigator.userAgent.match(/(iPod|iPhone|iPad)/g)||!navigator.userAgent.match(/AppleWebKit/g))}'
    readFile.mockResolvedValue(original)

    const result = await load({ path: '/autocomplete.min.js' })

    expect(result.loader).toEqual('js')
    expect(result.contents).toEqual(
      original.replace(
        'navigator.userAgent.match(/(iPod|iPhone|iPad)/g)',
        '(navigator.userAgent.match(/(iPod|iPhone|iPad)/g)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))',
      ),
    )
  })

  it.each([
    ['missing', 'function H(){return false}'],
    ['duplicated', 'navigator.userAgent.match(/(iPod|iPhone|iPad)/g);navigator.userAgent.match(/(iPod|iPhone|iPad)/g)'],
  ])('fails for a %s check so dependency changes require review', async (_description, contents) => {
    readFile.mockResolvedValue(contents)

    await expect(load({ path: '/autocomplete.min.js' })).rejects.toThrow(
      'Review the accessible-autocomplete iPadOS patch',
    )
  })
})
