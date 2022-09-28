import { getMockReq, getMockRes } from '@jest-mock/express'

import PrisonService from '../../../services/prisonService'
import SelectActivityLocationRouteHandler from './SelectActivityLocationRouteHandler'
import PrisonApiClient from '../../../data/prisonApiClient'
import PrisonerSearchApiClient from '../../../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../../../data/prisonRegisterApiClient'

jest.mock('../../../services/prisonService')
jest.mock('../../../data/prisonApiClient')
jest.mock('../../../data/prisonerSearchApiClient')
jest.mock('../../../data/prisonRegisterApiClient')

describe('Activity list route handler', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const prisonRegisterApiClient = new PrisonRegisterApiClient()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, prisonRegisterApiClient)
  let controller: SelectActivityLocationRouteHandler

  beforeEach(() => {
    controller = new SelectActivityLocationRouteHandler(prisonService)
    jest.spyOn(Date, 'now').mockImplementation(() => 1595548800000) // Friday, 24 July 2020 00:00:00
  })

  describe('SelectActivityLocationRouteHandler', () => {
    it('should render with current date and period', async () => {
      prisonService.searchActivityLocations = jest.fn().mockResolvedValue([
        {
          locationId: 1,
          userDescription: 'Location 1',
        },
      ])
      const req = getMockReq()
      const { res } = getMockRes({
        locals: {
          user: { token: 'token' },
        },
      })

      await controller.GET(req, res)

      expect(prisonService.searchActivityLocations).toHaveBeenCalledWith('MDI', '2020-07-24', 'AM', { token: 'token' })
      expect(res.render).toHaveBeenCalledWith('pages/activityList/selectActivityLocation', {
        date: '24/07/2020',
        locationDropdownValues: [{ text: 'Location 1', value: 1 }],
        period: 'AM',
      })
    })

    it('should render with supplied date and period', async () => {
      prisonService.searchActivityLocations = jest.fn().mockResolvedValue([
        {
          locationId: 1,
          userDescription: 'Location 1',
        },
      ])

      const req = getMockReq({ query: { prisonId: 'HERE', date: '10/12/2020', period: 'ED' } })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token' },
        },
      })

      await controller.GET(req, res)

      expect(prisonService.searchActivityLocations).toHaveBeenCalledWith('HERE', '2020-12-10', 'ED', { token: 'token' })
      expect(res.render).toHaveBeenCalledWith('pages/activityList/selectActivityLocation', {
        date: '10/12/2020',
        locationDropdownValues: [{ text: 'Location 1', value: 1 }],
        period: 'ED',
      })
    })
  })
})
