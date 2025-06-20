import { toFullCourtLink } from './utils'

describe('toFullCourtLink', () => {
  it.each([
    ['1234', 'HMCTS1234@meet.video.justice.gov.uk'],
    ['0878', 'HMCTS0878@meet.video.justice.gov.uk'],
    ['12', 'HMCTS12@meet.video.justice.gov.uk'],
    ['', undefined],
    [undefined, undefined],
  ])("expands court link [%s] to full link '%s'", (input, expected) => {
    expect(toFullCourtLink(input)).toEqual(expected)
  })
})
