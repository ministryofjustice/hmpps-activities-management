import dataAccess from './index'
import HmppsAuthClient from './hmppsAuthClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import WhereaboutsApiClient from './whereaboutsApiClient'
import ActivitiesApiClient from './activitiesApiClient'
import NomisUserApiClient from './nomisUserApiClient'
import IncentivesApiClient from './incentivesApiClient'

jest.mock('../utils/azureAppInsights')

describe('DataAccess', () => {
  test('The correct rest clients are instantiated', () => {
    const clients = dataAccess()
    expect(Object.values(clients).length).toBe(8)
    expect(clients.hmppsAuthClient).toBeInstanceOf(HmppsAuthClient)
    expect(clients.nomisUserApiClient).toBeInstanceOf(NomisUserApiClient)
    expect(clients.prisonApiClient).toBeInstanceOf(PrisonApiClient)
    expect(clients.prisonerSearchApiClient).toBeInstanceOf(PrisonerSearchApiClient)
    expect(clients.prisonRegisterApiClient).toBeInstanceOf(PrisonRegisterApiClient)
    expect(clients.whereaboutsApiClient).toBeInstanceOf(WhereaboutsApiClient)
    expect(clients.incentivesApiClient).toBeInstanceOf(IncentivesApiClient)
    expect(clients.activitiesApiClient).toBeInstanceOf(ActivitiesApiClient)
  })
})
