import { Request, Response } from 'express'
import { when } from 'jest-when'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import ConfirmNonAssociationRoutes from './confirmNonAssociations.ts'
import { NonAssociation } from '../../../../@types/nonAssociationsApi/types'

jest.mock('../../../../services/nonAssociationsService')
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

describe('Route Handlers - Create Appointment - Review non-associations', () => {
  const handler = new ConfirmNonAssociationRoutes(nonAssociationsService)

  let req: Request
  let res: Response
  const appointmentId = 1

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {
        user: {
          username: 'user',
          activeCaseLoadId: 'LEI',
        },
      },
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          prisoners: [{ number: 'G6123VU' }, { number: 'AB123IT' }, { number: 'PW987BB' }],
        },
      },
      params: {
        appointmentId,
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('If the count has been passed as a query, the endpoint should not be called', async () => {
      req.query = {
        nonAssociationsRemainingCount: '2',
      }
      await handler.GET(req, res)
      expect(nonAssociationsService.getNonAssociationsBetween).not.toHaveBeenCalled()
      expect(nonAssociationsService.enhanceNonAssociations).not.toHaveBeenCalled()

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirm-non-associations', {
        backLinkHref: 'review-non-associations',
        nonAssociationsCount: 2,
      })
    })
    it('If the count is missing from the query, the endpoint should be called, as well as the enhance function', async () => {
      req.query = {}

      const expectedResult = [
        {
          primaryPrisoner: { name: 'SAMUEL RAMROOP', prisonerNumber: 'G6123VU' },
          nonAssociations: [
            {
              prisonerNumber: 'AB123IT',
              name: 'JOSHUA SMITH',
              cellLocation: 'A-N-2-24S',
              lastUpdated: '2024-10-16T15:38:03',
            },
          ],
        },
        {
          primaryPrisoner: { name: 'JOSHUA SMITH', prisonerNumber: 'AB123IT' },
          nonAssociations: [
            {
              prisonerNumber: 'G6123VU',
              name: 'SAMUEL RAMROOP',
              cellLocation: 'A-N-2-55S',
              lastUpdated: '2024-10-16T15:38:03',
            },
          ],
        },
      ]

      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['G6123VU', 'AB123IT', 'PW987BB'], res.locals.user)
        .mockReturnValue(
          Promise.resolve([
            {
              id: 1,
              firstPrisonerNumber: 'G6123VU',
              secondPrisonerNumber: 'AB123IT',
              whenUpdated: '2024-10-16T15:38:03',
            },
          ] as NonAssociation[]),
        )
      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(Promise.resolve(expectedResult))
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirm-non-associations', {
        backLinkHref: 'review-non-associations',
        nonAssociationsCount: 2,
      })
    })
  })

  describe('POST', () => {
    it('should redirect or return to the confirm non-associations page during create journey - if user has not resolved any non-associations', async () => {
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('name')
    })
  })
})
