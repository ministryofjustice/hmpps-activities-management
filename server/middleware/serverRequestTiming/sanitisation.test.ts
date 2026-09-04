import { sanitiseDownstreamEndpoint } from './sanitisation'

describe('sanitiseDownstreamEndpoint', () => {
  it.each([
    ['/activities/123?prisoner=A1234BC', '/activities/:id'],
    ['/prisoners/A1234BC/appointments', '/prisoners/:value/appointments'],
    ['/scheduled-instances/2026-09-03', '/scheduled-instances/:date'],
    ['/locations/0d813283-1d70-4048-85ec-9b6509f9f9a0', '/locations/:id'],
    ['https://example.test/users/BLOGGSJ?token=secret', '/users/:value'],
    ['/users/jbloggs/authenticate', '/users/:value/authenticate'],
    ['/john-smith', '/:value'],
    ['/aliases/john-smith/preferences', '/:value/:value/:value'],
    ['/:johnSmith', '/:value'],
  ])('normalises %s', (endpoint, expected) => {
    expect(sanitiseDownstreamEndpoint(endpoint)).toBe(expected)
  })
})
