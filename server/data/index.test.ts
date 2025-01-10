import dataAccess from './index'
import ManageUsersApiClient from './manageUsersApiClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import ActivitiesApiClient from './activitiesApiClient'
import IncentivesApiClient from './incentivesApiClient'
import FrontendComponentApiClient from './frontendComponentApiClient'
import CaseNotesApiClient from './caseNotesApiClient'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import AlertsApiClient from './alertsApiClient'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import NomisMappingClient from './nomisMappingClient'

describe('DataAccess', () => {
  test('The correct rest clients are instantiated', () => {
    const clients = dataAccess()
    expect(Object.values(clients).length).toBe(14)
    expect(clients.manageUsersApiClient).toBeInstanceOf(ManageUsersApiClient)
    expect(clients.caseNotesApiClient).toBeInstanceOf(CaseNotesApiClient)
    expect(clients.prisonApiClient).toBeInstanceOf(PrisonApiClient)
    expect(clients.prisonerSearchApiClient).toBeInstanceOf(PrisonerSearchApiClient)
    expect(clients.prisonRegisterApiClient).toBeInstanceOf(PrisonRegisterApiClient)
    expect(clients.incentivesApiClient).toBeInstanceOf(IncentivesApiClient)
    expect(clients.activitiesApiClient).toBeInstanceOf(ActivitiesApiClient)
    expect(clients.bookAVideoLinkApiClient).toBeInstanceOf(BookAVideoLinkApiClient)
    expect(clients.frontendComponentApiClient).toBeInstanceOf(FrontendComponentApiClient)
    expect(clients.nonAssociationsApiClient).toBeInstanceOf(NonAssociationsApiClient)
    expect(clients.alertsApiClient).toBeInstanceOf(AlertsApiClient)
    expect(clients.locationsInsidePrisonApiClient).toBeInstanceOf(LocationsInsidePrisonApiClient)
    expect(clients.nomisMappingClient).toBeInstanceOf(NomisMappingClient)
    expect(clients.applicationInfo.applicationName).toBe('hmpps-activities-management')
  })
})
