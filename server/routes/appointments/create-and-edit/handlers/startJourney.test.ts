import { Request, Response } from 'express'
import { when } from 'jest-when'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import StartJourneyRoutes from './startJourney'
import { AppointmentDetails, AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { parseDate } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { YesNo } from '../../../../@types/activities'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Appointment - Start', () => {
  const handler = new StartJourneyRoutes(prisonService)
  let req: Request
  let res: Response
  const appointment = {
    occurrences: [
      {
        id: 12,
        sequenceNumber: 2,
      },
      {
        id: 13,
        sequenceNumber: 3,
      },
    ],
  } as unknown as AppointmentDetails
  const appointmentOccurrence = {
    id: 12,
    appointmentId: 2,
    appointmentType: 'GROUP',
    sequenceNumber: 2,
    category: {
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    internalLocation: {
      id: 26152,
      prisonCode: 'CHAP',
      description: 'Chapel',
    },
    startDate: '2023-04-13',
    startTime: '09:00',
    endTime: '10:00',
    repeat: {
      period: 'WEEKLY',
      count: 3,
    },
    prisoners: [
      {
        prisonerNumber: 'A1234BC',
        firstName: 'TEST01',
        lastName: 'PRISONER01',
        cellLocation: '1-1-1',
      },
      {
        prisonerNumber: 'B2345CD',
        firstName: 'TEST02',
        lastName: 'PRISONER02',
        cellLocation: '2-2-2',
      },
    ],
  } as AppointmentOccurrenceDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
      query: {
        prisonNumber: 'A1234BC',
      },
    } as unknown as Request
  })

  describe('INDIVIDUAL', () => {
    it('should populate the session with individual appointment journey type and redirect to select prisoner page', async () => {
      when(prisonService.getInmateByPrisonerNumber).calledWith('A1234BC', res.locals.user).mockResolvedValue(null)
      await handler.INDIVIDUAL(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.INDIVIDUAL,
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner?query=A1234BC')
    })

    it('should populate the session with individual appointment journey type and redirect to select category page', async () => {
      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)
      await handler.INDIVIDUAL(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.INDIVIDUAL,
        prisoners: [
          {
            cellLocation: '1-1-1',
            name: 'John Smith',
            number: 'A1234BC',
          },
        ],
        fromPrisonNumberProfile: 'A1234BC',
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('category')
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      await handler.INDIVIDUAL(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('GROUP', () => {
    it('should populate the session with group appointment journey type and redirect to how to add prisoners page', async () => {
      await handler.GROUP(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [],
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('how-to-add-prisoners')
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      await handler.GROUP(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('BULK', () => {
    it('should populate the session with bulk appointment journey type and redirect to upload by csv page', async () => {
      await handler.BULK(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.BULK,
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toEqual({
        appointments: [],
      })
      expect(res.redirect).toHaveBeenCalledWith('upload-bulk-appointment')
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      await handler.BULK(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('EDIT_OCCURRENCE', () => {
    beforeEach(() => {
      res = {
        redirect: jest.fn(),
      } as unknown as Response

      req = {
        session: {},
        appointment,
        appointmentOccurrence,
      } as unknown as Request
    })

    it('should redirect back if property is not specified', async () => {
      req.params = {}

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toBeUndefined()
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should populate the session with appointment occurrence details and redirect to the correct edit route', async () => {
      req.params = {
        property: 'location',
      }

      const appointmentJourneySession = {
        mode: AppointmentJourneyMode.EDIT,
        type: AppointmentType.GROUP,
        prisoners: [
          {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
          {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            cellLocation: '2-2-2',
          },
        ],
        category: {
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        location: {
          id: 26152,
          prisonCode: 'CHAP',
          description: 'Chapel',
        },
        startDate: {
          date: parseDate('2023-04-13'),
          day: 13,
          month: 4,
          year: 2023,
        },
        startTime: {
          date: new Date('2023-04-13 09:00:00'),
          hour: 9,
          minute: 0,
        },
        endTime: {
          date: new Date('2023-04-13 10:00:00'),
          hour: 10,
          minute: 0,
        },
        repeat: YesNo.YES,
        repeatCount: 3,
        repeatPeriod: 'WEEKLY',
      } as AppointmentJourney

      const editAppointmentJourneySession = {
        repeatCount: 3,
        sequenceNumbers: [2, 3],
        sequenceNumber: 2,
      } as EditAppointmentJourney

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toEqual(appointmentJourneySession)
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/location`)
    })

    it('should accept an invalid end date value', async () => {
      req.appointmentOccurrence.endTime = null
      req.params = {
        property: 'location',
      }

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney.endTime).toBeNull()
    })

    it('should redirect back if property not specified', async () => {
      req.params = {
        property: '',
      }

      await handler.EDIT(req, res)

      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      req.params = {
        property: 'location',
      }
      await handler.EDIT(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('REMOVE_PRISONER', () => {
    beforeEach(() => {
      res = {
        redirect: jest.fn(),
      } as unknown as Response

      req = {
        session: {},
        appointment,
        appointmentOccurrence,
      } as unknown as Request
    })

    it('should redirect back if prisoner is not found', async () => {
      req.params = {
        prisonNumber: 'NOT_FOUND',
      }

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).toBeUndefined()
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should populate the session with prisoner details and redirect to apply to', async () => {
      req.params = {
        prisonNumber: 'B2345CD',
      }

      const editAppointmentJourneySession = {
        repeatCount: 3,
        sequenceNumbers: [2, 3],
        sequenceNumber: 2,
        removePrisoner: {
          prisonerNumber: 'B2345CD',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          cellLocation: '2-2-2',
        },
      } as EditAppointmentJourney

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/B2345CD/remove/apply-to`)
    })

    it('should populate the session with prisoner details and redirect to confirm', async () => {
      req.appointment = {
        occurrences: [
          {
            id: 12,
            sequenceNumber: 2,
          },
        ],
      } as unknown as AppointmentDetails
      req.params = {
        prisonNumber: 'A1234BC',
      }

      const editAppointmentJourneySession = {
        repeatCount: 3,
        sequenceNumbers: [2],
        sequenceNumber: 2,
        removePrisoner: {
          prisonerNumber: 'A1234BC',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          cellLocation: '1-1-1',
        },
        applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
      } as EditAppointmentJourney

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/A1234BC/remove/confirm`)
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      req.params = {
        prisonNumber: 'B2345CD',
      }
      await handler.REMOVE_PRISONER(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('ADD_PRISONERS', () => {
    beforeEach(() => {
      res = {
        redirect: jest.fn(),
      } as unknown as Response

      req = {
        session: {},
        appointment,
        appointmentOccurrence,
      } as unknown as Request
    })

    it('should populate the session and redirect to how to add prisoners', async () => {
      const editAppointmentJourneySession = {
        repeatCount: 3,
        sequenceNumbers: [2, 3],
        sequenceNumber: 2,
        addPrisoners: [],
      } as EditAppointmentJourney

      await handler.ADD_PRISONERS(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/prisoners/add/how-to-add-prisoners`)
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      await handler.ADD_PRISONERS(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })

  describe('CANCEL', () => {
    beforeEach(() => {
      res = {
        redirect: jest.fn(),
      } as unknown as Response

      req = {
        session: {},
        appointment,
        appointmentOccurrence,
      } as unknown as Request
    })

    it('should populate the session and redirect to cancellation reasons', async () => {
      const editAppointmentJourneySession = {
        repeatCount: 3,
        sequenceNumbers: [2, 3],
        sequenceNumber: 2,
      } as EditAppointmentJourney

      await handler.CANCEL(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.bulkAppointmentJourney).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/cancel/reason`)
    })

    it('should null return to', async () => {
      req.session.returnTo = 'something'
      await handler.CANCEL(req, res)
      expect(req.session.returnTo).toBeNull()
    })
  })
})
