import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, formatISO } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import BeforeYouAllocate, { ConfirmOptions } from './beforeYouAllocate'
import ActivitiesService from '../../../../services/activitiesService'
import { AllocationSuitability } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Allocate - Before you allocate', () => {
  const handler = new BeforeYouAllocate(activitiesService)
  let req: Request
  let res: Response

  const tomorrow = addDays(new Date(), 1)

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'USER1',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            cellLocation: '1-2-001',
            payBand: { id: 1, alias: 'A' },
          },
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
    it('should render page with correct context', async () => {
      const allocationSuitability = {
        workplaceRiskAssessment: {
          suitable: true,
          riskLevel: 'medium',
        },
        incentiveLevel: {
          suitable: true,
          incentiveLevel: 'Standard',
        },
        education: {
          suitable: true,
          education: null,
        },
        releaseDate: {
          suitable: true,
          earliestReleaseDate: formatISO(tomorrow),
        },
        nonAssociation: {
          suitable: true,
          nonAssociations: [],
        },
        allocations: [
          {
            allocation: {
              id: 123456,
              prisonerNumber: 'ABC123',
              activitySummary: 'English 1',
              scheduleId: 1,
              prisonPayBand: {
                id: 123456,
                alias: 'Low',
                description: 'Pay band 1',
                nomisPayBand: 1,
              },
              status: 'ACTIVE',
            },
            payRate: {
              id: 123456,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBandId: 123456,
              rate: 150,
              pieceRate: 150,
              pieceRateItems: 10,
            },
          },
        ],
      } as AllocationSuitability

      when(activitiesService.allocationSuitability)
        .calledWith(atLeast(1, 'ABC123'))
        .mockResolvedValue(allocationSuitability)

      await handler.GET(req, res)

      expect(res.render).toBeCalledWith('pages/activities/allocate-to-activity/before-you-allocate', {
        allocationSuitability,
      })
    })
  })

  describe('POST', () => {
    it('should continue with allocation', async () => {
      req.body = {
        confirm: 'yes',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('start-date')
    })

    it('should redirect back to the allocation dashboard', async () => {
      req.body = {
        confirm: 'no',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/allocation-dashboard/1#candidates-tab')
    })
  })

  describe('validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(ConfirmOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'confirm', error: 'Please confirm you want to continue with this allocation' },
      ])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        confirm: 'invalid',
      }

      const requestObject = plainToInstance(ConfirmOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'confirm', error: 'Please confirm you want to continue with this allocation' },
      ])
    })

    it('passes validation', async () => {
      const body = {
        confirm: 'yes',
      }

      const requestObject = plainToInstance(ConfirmOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
