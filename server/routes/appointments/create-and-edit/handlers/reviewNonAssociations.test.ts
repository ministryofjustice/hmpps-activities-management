import { Request, Response } from 'express'
import { when } from 'jest-when'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import ReviewNonAssociationRoutes from './reviewNonAssociations'
import PrisonService from '../../../../services/prisonService'
import { NonAssociation } from '../../../../@types/nonAssociationsApi/types'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { AppointmentPrisonerDetails } from '../appointmentPrisonerDetails'

jest.mock('../../../../services/nonAssociationsService')
jest.mock('../../../../services/prisonService')

const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Appointment - Review non-associations', () => {
  const handler = new ReviewNonAssociationRoutes(nonAssociationsService, prisonService)

  let req: Request
  let res: Response
  const appointmentId = 1
  const preserveHistory = false

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
      query: {
        preserveHistory,
      },
    } as unknown as Request
  })

  const prisoners = [
    {
      prisonerNumber: 'G6123VU',
      firstName: 'SAMUEL',
      lastName: 'RAMROOP',
      cellLocation: 'A-N-2-55S',
    },
    {
      prisonerNumber: 'AB123IT',
      firstName: 'JOSHUA',
      lastName: 'SMITH',
      cellLocation: 'A-N-2-24S',
    },
  ] as Prisoner[]

  describe('GET', () => {
    it('should render the view for create appointment - no non-associations to start with', async () => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['G6123VU', 'AB123IT', 'PW987BB'], res.locals.user)
        .mockReturnValue(Promise.resolve([]))
      expect(prisonService.searchInmatesByPrisonerNumbers).not.toHaveBeenCalled()

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('name')
    })
    it('should render the view for create appointment - no non-associations because user has removed them', async () => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['G6123VU', 'AB123IT', 'PW987BB'], res.locals.user)
        .mockReturnValue(Promise.resolve([]))
      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(Promise.resolve([]))
      expect(prisonService.searchInmatesByPrisonerNumbers).not.toHaveBeenCalled()
      req.query.prisonerRemoved = 'true'
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations', {
        appointmentId,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: [],
        attendeesTotalCount: 3,
      })
    })
    it('should render the view for create appointment - non-associations present', async () => {
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
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['G6123VU', 'AB123IT']))
        .mockResolvedValue(prisoners)

      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(Promise.resolve(expectedResult))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations', {
        appointmentId,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: expectedResult,
        attendeesTotalCount: 3,
      })
    })
    it('if there is only one prisoner in the session, redirect to the next page', async () => {
      req.session.appointmentJourney.prisoners = [{ number: 'G6123VU' } as AppointmentPrisonerDetails]

      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('name')
    })
    it('if there is only one prisoner in the session because a prisoner was just removed, display the alternative message', async () => {
      req.session.appointmentJourney.prisoners = [{ number: 'G6123VU' } as AppointmentPrisonerDetails]
      req.query.prisonerRemoved = 'true'

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations', {
        appointmentId,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: [],
        attendeesTotalCount: 1,
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['G6123VU', 'AB123IT', 'PW987BB'], res.locals.user)
        .mockReturnValue(Promise.resolve([]))
    })
    it('should redirect or return to name page during create journey - if user has resolved any non-associations', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

      req.body = {
        nonAssociationsRemainingCount: 0,
      }

      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('name')
    })
    it('should redirect or return to the confirm non-associations page during create journey - if user has not resolved any non-associations', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

      req.body = {
        nonAssociationsRemainingCount: 2,
      }

      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('confirm-non-associations?nonAssociationsRemainingCount=2')
    })
  })

  describe('REMOVE', () => {
    it('should remove selected prisoners and redirect', async () => {
      req.session.appointmentJourney.prisoners = [
        { number: 'G6123VU', name: 'SAMUEL RAMROOP' },
        { number: 'AB123IT', name: 'JOSHUA SMITH' },
      ] as AppointmentPrisonerDetails[]

      req.params = {
        prisonNumber: 'AB123IT',
      }

      await handler.REMOVE(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([{ number: 'G6123VU', name: 'SAMUEL RAMROOP' }])
      expect(res.redirect).toBeCalledWith('../../review-non-associations?prisonerRemoved=true')
    })

    it('should redirect back to GET with preserve history', async () => {
      req.session.appointmentJourney.prisoners = []
      req.query = { preserveHistory: 'true' }
      req.params = {
        prisonNumber: 'G6123VU',
      }
      await handler.REMOVE(req, res)
      expect(res.redirect).toBeCalledWith('../../review-non-associations?prisonerRemoved=true&preserveHistory=true')
    })
  })
})

describe('Route Handlers - Edit Appointment - Review non-associations', () => {
  const handler = new ReviewNonAssociationRoutes(nonAssociationsService, prisonService)

  let req: Request
  let res: Response
  const appointmentId = 1
  const preserveHistory = false

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
          prisoners: [{ number: 'AB123IT' }, { number: 'PW987BB' }],
        },
        editAppointmentJourney: {
          addPrisoners: [{ number: 'G6123VU' }],
        },
      },
      params: {
        appointmentId,
      },
      query: {
        preserveHistory,
      },
    } as unknown as Request
  })

  describe('EDIT_GET', () => {
    it('should render the view for edit appointment - no new prisoners left', async () => {
      req.session.editAppointmentJourney.addPrisoners = []

      await handler.EDIT_GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations-edit', {
        appointmentId: 1,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: [],
        additionalAttendeesCount: 0,
      })
    })
    it('should render the view for edit appointment - no non-associations', async () => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['AB123IT', 'PW987BB', 'G6123VU'], res.locals.user)
        .mockReturnValue(Promise.resolve([]))
      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(Promise.resolve([]))
      expect(prisonService.searchInmatesByPrisonerNumbers).not.toHaveBeenCalled()

      await handler.EDIT_GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../../schedule')
    })
    it('should render the view for edit appointment - no non-associations as user has removed additional prisoner', async () => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['AB123IT', 'PW987BB', 'G6123VU'], res.locals.user)
        .mockReturnValue(Promise.resolve([]))
      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(Promise.resolve([]))
      expect(prisonService.searchInmatesByPrisonerNumbers).not.toHaveBeenCalled()
      req.query.prisonerRemoved = 'true'

      await handler.EDIT_GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations-edit', {
        appointmentId: 1,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: [],
        existingAttendeesCount: 2,
        additionalAttendeesCount: 1,
        existingPrisonerNumbers: ['AB123IT', 'PW987BB'],
      })
    })
    it('should render the view for edit appointment - non-associations present', async () => {
      when(nonAssociationsService.getNonAssociationsBetween)
        .calledWith(['AB123IT', 'PW987BB', 'G6123VU'], res.locals.user)
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
      when(nonAssociationsService.enhanceNonAssociations).mockReturnValue(
        Promise.resolve([
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
        ]),
      )

      await handler.EDIT_GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-non-associations-edit', {
        appointmentId: 1,
        backLinkHref: 'review-prisoners-alerts',
        preserveHistory: false,
        nonAssociations: [
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
        ],
        existingAttendeesCount: 2,
        additionalAttendeesCount: 1,
        existingPrisonerNumbers: ['AB123IT', 'PW987BB'],
      })
    })
  })
})
