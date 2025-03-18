import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import ReviewSearchPrisonerListRoutes from './reviewSearchPrisonerList'
import { PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/nonAssociationsService')
jest.mock('../../../../../services/activitiesService')
const nonAssociationsService = new NonAssociationsService(null, null)
const activitiesService = new ActivitiesService(null)

describe('Review the prisoners added individually', () => {
  const handler = new ReviewSearchPrisonerListRoutes(nonAssociationsService, activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'USER1',
          activeCaseLoadDescription: 'Moorland (HMP & YOI)',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      params: {},
      session: {
        allocateJourney: {
          inmates: [
            {
              prisonerName: 'Joe Bloggs',
              prisonerNumber: 'G9566GQ',
              cellLocation: '1-1-1',
              firstName: 'Joe',
              lastName: 'Bloggs',
            },
            {
              prisonerName: 'Jane Blunt',
              prisonerNumber: 'T4530VC',
              cellLocation: '2-2-2',
              firstName: 'Jane',
              lastName: 'Blunt',
            },
          ],
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('redirects back to the select prisoner page if there are no inmates on the session', async () => {
      req.session.allocateJourney.inmates = []
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')
    })
    it('renders the page with prisoners on the session', async () => {
      const prisonerAllocations = [
        {
          prisonerNumber: 'G9566GQ',
          allocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
          ],
        },
        {
          prisonerNumber: 'T4530VC',
          allocations: [],
        },
      ] as PrisonerAllocations[]

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['G9566GQ', 'T4530VC'], res.locals.user)
        .mockResolvedValue(prisonerAllocations)

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['G9566GQ', 'T4530VC'], res.locals.user)
        .mockResolvedValue(['G9566GQ', 'H4623WP'])
      await handler.GET(req, res)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewSearchPrisonerList',
        {
          inmates: [
            {
              prisonerNumber: 'G9566GQ',
              prisonerName: 'Joe Bloggs',
              firstName: 'Joe',
              lastName: 'Bloggs',
              cellLocation: '1-1-1',
              allocations: [
                { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
                { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
              ],
              nonAssociations: true,
            },
            {
              prisonerNumber: 'T4530VC',
              firstName: 'Jane',
              lastName: 'Blunt',
              prisonerName: 'Jane Blunt',
              cellLocation: '2-2-2',
              allocations: [],
              nonAssociations: false,
            },
          ],
        },
      )
    })
  })
  describe('POST', () => {
    it('Redirects to the next page', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('activity-requirements-review')
    })
  })
  describe('REMOVE', () => {
    it('Removes the prisoner from the session and redirects back', async () => {
      req.params = {
        prisonerNumber: 'G9566GQ',
      }
      await handler.REMOVE(req, res)

      expect(req.session.allocateJourney.inmates).toEqual([
        {
          prisonerName: 'Jane Blunt',
          prisonerNumber: 'T4530VC',
          cellLocation: '2-2-2',
          firstName: 'Jane',
          lastName: 'Blunt',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../../review-search-prisoner-list')
    })
  })
})
