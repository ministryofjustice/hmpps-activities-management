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

jest.mock('applicationinsights')

describe('Services', () => {
  test('The correct services are instantiated', () => {
    const servicesList = services()

    expect(Object.values(servicesList).length).toBe(11)
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
    expect(servicesList.locationMappingService).toBeInstanceOf(LocationMappingService)
  })
})
