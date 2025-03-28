import services from './index'
import UserService from './userService'
import PrisonService from './prisonService'
import BankHolidayService from './bankHolidayService'
import ActivitiesService from './activitiesService'
import UnlockListService from './unlockListService'
import MetricsService from './metricsService'
import CaseNotesService from './caseNotesService'
import AlertsFilterService from './alertsFilterService'
import BookAVideoLinkService from './bookAVideoLinkService'
import NonAssociationsService from './nonAssociationsService'
import LocationMappingService from './locationMappingService'
import AlertsService from './alertsService'
import LocationsService from './locationsService'
import CourtBookingService from './courtBookingService'
import ProbationBookingService from './probationBookingService'
import TokenStore from '../data/tokenStore'

jest.mock('applicationinsights')

describe('Services', () => {
  test('The correct services are instantiated', () => {
    const servicesList = services()

    expect(Object.values(servicesList).length).toBe(17)
    expect(servicesList.userService).toBeInstanceOf(UserService)
    expect(servicesList.prisonService).toBeInstanceOf(PrisonService)
    expect(servicesList.ukBankHolidayService).toBeInstanceOf(BankHolidayService)
    expect(servicesList.activitiesService).toBeInstanceOf(ActivitiesService)
    expect(servicesList.caseNotesService).toBeInstanceOf(CaseNotesService)
    expect(servicesList.unlockListService).toBeInstanceOf(UnlockListService)
    expect(servicesList.alertsFilterService).toBeInstanceOf(AlertsFilterService)
    expect(servicesList.metricsService).toBeInstanceOf(MetricsService)
    expect(servicesList.bookAVideoLinkService).toBeInstanceOf(BookAVideoLinkService)
    expect(servicesList.nonAssociationsService).toBeInstanceOf(NonAssociationsService)
    expect(servicesList.alertsService).toBeInstanceOf(AlertsService)
    expect(servicesList.locationMappingService).toBeInstanceOf(LocationMappingService)
    expect(servicesList.locationsService).toBeInstanceOf(LocationsService)
    expect(servicesList.courtBookingService).toBeInstanceOf(CourtBookingService)
    expect(servicesList.probationBookingService).toBeInstanceOf(ProbationBookingService)
    expect(servicesList.tokenStore).toBeInstanceOf(TokenStore)
    expect(servicesList.applicationInfo.applicationName).toBe('hmpps-activities-management')
  })
})
