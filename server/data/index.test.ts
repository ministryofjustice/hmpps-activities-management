import dataAccess from './index'
import HmppsAuthClient from './hmppsAuthClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import WhereaboutsApiClient from './whereaboutsApiClient'

jest.mock('../utils/azureAppInsights')

describe('DataAccess', () => {
  test('The correct rest clients are instantiated', () => {
    const clients = dataAccess()
    expect(Object.values(clients).length).toBe(5)
    expect(clients.hmppsAuthClient).toBeInstanceOf(HmppsAuthClient)
    expect(clients.prisonApiClient).toBeInstanceOf(PrisonApiClient)
    expect(clients.prisonerSearchApiClient).toBeInstanceOf(PrisonerSearchApiClient)
    expect(clients.prisonRegisterApiClient).toBeInstanceOf(PrisonRegisterApiClient)
    expect(clients.whereaboutsApiClient).toBeInstanceOf(WhereaboutsApiClient)
  })
})
