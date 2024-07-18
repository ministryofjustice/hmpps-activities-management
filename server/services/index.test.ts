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

jest.mock('applicationinsights')

describe('Services', () => {
  test('The correct services are instantiated', () => {
    const servicesList = services()

    expect(Object.values(servicesList).length).toBe(9)
    expect(servicesList.userService).toBeInstanceOf(UserService)
    expect(servicesList.prisonService).toBeInstanceOf(PrisonService)
    expect(servicesList.ukBankHolidayService).toBeInstanceOf(BankHolidayService)
    expect(servicesList.activitiesService).toBeInstanceOf(ActivitiesService)
    expect(servicesList.caseNotesService).toBeInstanceOf(CaseNotesService)
    expect(servicesList.unlockListService).toBeInstanceOf(UnlockListService)
    expect(servicesList.alertsFilterService).toBeInstanceOf(AlertsFilterService)
    expect(servicesList.metricsService).toBeInstanceOf(MetricsService)
    expect(servicesList.bookAVideoLinkService).toBeInstanceOf(BookAVideoLinkService)
  })
})
