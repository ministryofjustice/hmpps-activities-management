import services from './index'
import UserService from './userService'
import PrisonService from './prisonService'
import BankHolidayService from './bankHolidayService'
import ActivitiesService from './activitiesService'
import CapacitiesService from './capacitiesService'
import UnlockListService from './unlockListService'

describe('Services', () => {
  test('The correct services are instantiated', () => {
    const servicesList = services()

    expect(Object.values(servicesList).length).toBe(6)
    expect(servicesList.userService).toBeInstanceOf(UserService)
    expect(servicesList.prisonService).toBeInstanceOf(PrisonService)
    expect(servicesList.ukBankHolidayService).toBeInstanceOf(BankHolidayService)
    expect(servicesList.activitiesService).toBeInstanceOf(ActivitiesService)
    expect(servicesList.capacitiesService).toBeInstanceOf(CapacitiesService)
    expect(servicesList.unlockListService).toBeInstanceOf(UnlockListService)
  })
})
