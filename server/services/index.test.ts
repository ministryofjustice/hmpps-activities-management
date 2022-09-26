import services from './index'
import UserService from './userService'
import PrisonService from './prisonService'

describe('Services', () => {
  test('The correct services are instantiated', () => {
    const servicesList = services()

    expect(Object.values(servicesList).length).toBe(2)
    expect(servicesList.userService).toBeInstanceOf(UserService)
    expect(servicesList.prisonService).toBeInstanceOf(PrisonService)
  })
})
