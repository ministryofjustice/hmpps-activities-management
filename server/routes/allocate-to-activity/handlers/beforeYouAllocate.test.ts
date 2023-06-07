import { Request, Response } from 'express'
import { when } from 'jest-when'
import BeforeYouAllocate, { ConfirmOptions } from './beforeYouAllocate'
import ActivitiesService from '../../../services/activitiesService'
import { addDays, formatISO } from 'date-fns'
import { AllocationSuitability, PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import atLeast from '../../../../jest.setup'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../utils/utils'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null)

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
          incentiveLevel: 'Standard'
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
        }
      } as AllocationSuitability

      const otherAllocations = [{
        prisonerNumber: "ABC123",
        allocations: [
          {
            id: 123456,
            prisonerNumber: "ABC123",
            activitySummary: "English 1",
            scheduleId: 1,
            payRate: {
              id: 123456,
              incentiveNomisCode: "BAS",
              incentiveLevel: "Basic",
              prisonPayBand: {
                id: 123456,
                alias: "Low",
                description: "Pay band 1",
                nomisPayBand: 1,
              },
              rate: 150,
              pieceRate: 150,
              pieceRateItems: 10
            },
            status: "ACTIVE"
          }
        ]
      }] as PrisonerAllocations[]

      when(activitiesService.allocationSuitability)
        .calledWith(atLeast(1, 'ABC123'))
        .mockResolvedValue(allocationSuitability)

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(otherAllocations)

      await handler.GET(req, res)

      expect(res.render).toBeCalledWith(
        'pages/allocate-to-activity/before-you-allocate',
        { 
          allocationSuitability,
          prisonerAllocations: otherAllocations[0].allocations
        },
      )
    })
  })

  describe('POST', () => {
    it('should continue with allocation', async () => {
      req.body = {
        confirm: 'yes',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay-band')
    })

    it('should redirect back to the allocation dashboard', async () => {
      req.body = {
        confirm: 'no',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/allocation-dashboard/1')
    })
  })
  
  describe('validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(ConfirmOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'confirm', error: 'Please confirm you want to continue with this allocation' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        confirm: 'invalid',
      }

      const requestObject = plainToInstance(ConfirmOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'confirm', error: 'Please confirm you want to continue with this allocation' }])
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
