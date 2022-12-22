import { getMockReq, getMockRes } from '@jest-mock/express'

import PrisonService from '../../../../services/prisonService'
import SelectActivityLocationRouteHandler from './SelectActivityLocationRouteHandler'

jest.mock('../../../../services/prisonService')

describe('selectActivityLocationRouteHandler', () => {
  const prisonService = new PrisonService(null, null, null, null)
  let controller: SelectActivityLocationRouteHandler

  beforeEach(() => {
    controller = new SelectActivityLocationRouteHandler(prisonService)
    jest.spyOn(Date, 'now').mockImplementation(() => 1595548800000) // Friday, 24 July 2020 00:00:00
  })

  describe('GET', () => {
    it('should render with current date and period', async () => {
      prisonService.searchActivityLocations = jest.fn().mockResolvedValue([
        {
          locationId: 1,
          userDescription: 'Location 1',
        },
      ])
      const req = getMockReq({
        session: {
          data: {},
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)

      expect(prisonService.searchActivityLocations).toHaveBeenCalledWith('MDI', '2020-07-24', 'AM', {
        token: 'token',
        activeCaseLoad: { caseLoadId: 'MDI' },
      })
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityList/selectActivityLocation', {
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

      const req = getMockReq({
        query: { prisonId: 'MDI', date: '10/12/2020', period: 'ED' },
        session: {
          data: {},
        },
      })

      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)

      expect(prisonService.searchActivityLocations).toHaveBeenCalledWith('MDI', '2020-12-10', 'ED', {
        token: 'token',
        activeCaseLoad: { caseLoadId: 'MDI' },
      })
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityList/selectActivityLocation', {
        date: '10/12/2020',
        locationDropdownValues: [{ text: 'Location 1', value: 1 }],
        period: 'ED',
      })
    })
  })

  describe('POST', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        body: {
          currentLocation: 'MDI',
          date: '01/08/2022',
          period: 'AM',
        },
      })
      const { res } = getMockRes()

      await controller.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activity-list?locationId=MDI&date=2022-08-01&period=AM')
    })
  })
})
