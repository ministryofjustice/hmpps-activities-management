import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import PendingWaitlistHandler, { allocateOption } from './pendingWaitlistAllocations'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mockPrisoner: Prisoner = {
  prisonerNumber: 'ABC123',
  firstName: 'Joe',
  lastName: 'Bloggs',
  cellLocation: '1-2-001',
  prisonId: 'LEI',
  status: 'ACTIVE OUT',
  prisonName: 'Leicester Prison',
  lastMovementTypeCode: 'CRT',
  releaseDate: '2019-11-30',
  alerts: [{ alertType: 'R', alertCode: 'RLO', active: true, expired: false }],
} as Prisoner

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PendingWaitlistHandler(activitiesService, prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { activeCaseLoadId: 'LEI', username: 'USER1', displayName: 'John Smith' },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: 'ABC123' },
      journeyData: {
        prisonerAllocationsJourney: {
          activityName: 'B Wing Orderly',
          status: 'PENDING',
          scheduleId: '518',
          applicationId: 213,
          applicationDate: '2025-06-24',
          requestedBy: 'PRISONER',
          comments: 'Test',
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render prisoner pending waitlist allocation page', async () => {
      when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValue(mockPrisoner)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/pending-application', {
        prisonerName: 'Joe Bloggs',
      })
    })
  })

  describe('POST', () => {
    it('should update waitlist application and redirect to allocate to activity page when YES is selected', async () => {
      req.body = {
        options: 'YES',
      }

      await handler.POST(req, res)
      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        213,
        { status: 'APPROVED' },
        res.locals.user,
      )
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations/create/prisoner/ABC123?scheduleId=518')
    })

    it('should redirect back to prisoner allocation page when NO is selected', async () => {
      req.body = {
        options: 'NO',
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/prisoner-allocations/ABC123')
    })
  })

  describe('Validation', () => {
    it('validation fails if Yes or No have not been selected', async () => {
      const body = {
        prisonerName: 'Joe Bloggs',
      }

      const requestObject = plainToInstance(allocateOption, {
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'options',
            error: 'Select if you want to approve this application and allocate Joe Bloggs or not',
          },
        ]),
      )
    })
  })
})
