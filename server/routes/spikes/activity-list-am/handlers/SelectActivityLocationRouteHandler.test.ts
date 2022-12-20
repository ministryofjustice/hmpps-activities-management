import { getMockReq, getMockRes } from '@jest-mock/express'

import SelectActivityLocationRouteHandler from './SelectActivityLocationRouteHandler'
import PrisonerSearchApiClient from '../../../../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../../../../data/activitiesApiClient'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../data/prisonApiClient')
jest.mock('../../../../data/prisonerSearchApiClient')
jest.mock('../../../../data/whereaboutsApiClient')

describe('selectActivityLocationRouteHandler', () => {
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const activitiesApiClient = new ActivitiesApiClient()
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)
  let controller: SelectActivityLocationRouteHandler

  beforeEach(() => {
    controller = new SelectActivityLocationRouteHandler(activitiesService)
    jest.spyOn(Date, 'now').mockImplementation(() => 1595548800000) // Friday, 24 July 2020 00:00:00
  })

  describe('GET', () => {
    it('should render with current date and period', async () => {
      activitiesService.getScheduledPrisonLocations = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Location 1',
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

      expect(activitiesService.getScheduledPrisonLocations).toHaveBeenCalledWith('MDI', '2020-07-24', 'AM', {
        token: 'token',
        activeCaseLoad: { caseLoadId: 'MDI' },
      })
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityListAm/selectActivityLocation', {
        date: '24/07/2020',
        locationDropdownValues: [{ text: 'Location 1', value: 1 }],
        period: 'AM',
      })
    })

    it('should render with supplied date and period', async () => {
      activitiesService.getScheduledPrisonLocations = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Location 1',
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

      expect(activitiesService.getScheduledPrisonLocations).toHaveBeenCalledWith('MDI', '2020-12-10', 'ED', {
        token: 'token',
        activeCaseLoad: { caseLoadId: 'MDI' },
      })
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityListAm/selectActivityLocation', {
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

      expect(res.redirect).toHaveBeenCalledWith('/activity-list-am?locationId=MDI&date=2022-08-01&period=AM')
    })
  })
})
