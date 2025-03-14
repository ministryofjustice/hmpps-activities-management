import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, formatISO } from 'date-fns'
import ActivityRequirementsReviewRoutes from './activityRequirementsReview'
import { AllocationSuitability } from '../../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')
const activitiesService = new ActivitiesService(null)

describe('Activity requirements review page', () => {
  const handler = new ActivityRequirementsReviewRoutes(activitiesService)
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
      session: {
        allocateJourney: {
          inmates: [
            {
              prisonerName: 'Joe Bloggs',
              prisonerNumber: 'ABC123',
            },
            {
              prisonerName: 'Jane Blunt',
              prisonerNumber: 'ABC321',
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
    it('Prisoner is not suitable', async () => {
      const tomorrow = addDays(new Date(), 1)
      const allocationSuitability = {
        workplaceRiskAssessment: {
          suitable: false,
          riskLevel: 'medium',
        },
        education: {
          suitable: true,
          education: null,
        },
        releaseDate: {
          suitable: true,
          earliestReleaseDate: {
            releaseDate: formatISO(tomorrow),
          },
        },
      } as AllocationSuitability
      const allocationSuitability2 = {
        workplaceRiskAssessment: {
          suitable: true,
          riskLevel: 'low',
        },
        education: {
          suitable: true,
          education: null,
        },
        releaseDate: {
          suitable: true,
          earliestReleaseDate: {
            releaseDate: formatISO(tomorrow),
          },
        },
      } as AllocationSuitability

      when(activitiesService.allocationSuitability)
        .calledWith(1, 'ABC123', res.locals.user)
        .mockResolvedValue(allocationSuitability)
      when(activitiesService.allocationSuitability)
        .calledWith(1, 'ABC321', res.locals.user)
        .mockResolvedValue(allocationSuitability2)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview',
        {
          prisoners: [
            {
              prisonerName: 'Joe Bloggs',
              prisonerNumber: 'ABC123',
              workplaceRiskAssessment: {
                suitable: false,
                riskLevel: 'medium',
              },
              education: {
                suitable: true,
                education: null,
              },
              releaseDate: {
                suitable: true,
                earliestReleaseDate: {
                  releaseDate: formatISO(tomorrow),
                },
              },
            },
          ],
        },
      )
    })
    it('Prisoner is suitable and so the page is not rendered', async () => {
      const tomorrow = addDays(new Date(), 1)
      const allocationSuitability = {
        workplaceRiskAssessment: {
          suitable: true,
          riskLevel: 'medium',
        },
        education: {
          suitable: true,
          education: null,
        },
        releaseDate: {
          suitable: true,
          earliestReleaseDate: {
            releaseDate: formatISO(tomorrow),
          },
        },
      } as AllocationSuitability

      when(activitiesService.allocationSuitability)
        .calledWith(1, 'ABC123', res.locals.user)
        .mockResolvedValue(allocationSuitability)

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('#')
    })
  })
  describe('POST', () => {
    it('redirects to the start-date page', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('start-date')
    })
  })
  describe('REMOVE', () => {
    it('Removes the prisoner from the session and redirects back', async () => {
      req.params = {
        prisonerNumber: 'ABC123',
      }
      await handler.REMOVE(req, res)

      expect(req.session.allocateJourney.inmates).toEqual([
        {
          prisonerName: 'Jane Blunt',
          prisonerNumber: 'ABC321',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../../activity-requirements-review')
    })
  })
})
