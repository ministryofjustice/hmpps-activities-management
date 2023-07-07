import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import populateJourney from './populateJourney'
import { SessionDatum } from '../@types/express'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { BulkAppointmentJourney } from '../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'

const middleware = populateJourney()

let req: Request
let res: Response

let appointmentJourney: AppointmentJourney
let bulkAppointmentJourney: BulkAppointmentJourney
let editAppointmentJourney: EditAppointmentJourney
let appointmentSessionDatum: SessionDatum

let journeyId: string

const next = jest.fn()

beforeEach(() => {
  res = {
    redirect: jest.fn(),
  } as unknown as Response

  req = {
    session: {},
    params: {},
  } as unknown as Request

  appointmentJourney = {
    appointmentName: 'From mapped session data',
  } as AppointmentJourney
  bulkAppointmentJourney = {
    appointments: [
      {
        comment: 'From mapped session data',
      },
    ],
  } as BulkAppointmentJourney
  editAppointmentJourney = {
    comment: 'From mapped session data',
  } as EditAppointmentJourney
  appointmentSessionDatum = {
    appointmentJourney,
    bulkAppointmentJourney,
    editAppointmentJourney,
  } as SessionDatum

  journeyId = uuidv4()
})

describe('populateJourney', () => {
  describe('create session map', () => {
    it('should create a new session map when map is undefined', async () => {
      req.session.sessionDataMap = undefined

      middleware(req, res, next)

      expect(req.session.sessionDataMap).not.toBeUndefined()
      expect(req.session.sessionDataMap).not.toBeNull()
    })

    it('should create a new session map when map is null', async () => {
      req.session.sessionDataMap = null

      middleware(req, res, next)

      expect(req.session.sessionDataMap).not.toBeUndefined()
      expect(req.session.sessionDataMap).not.toBeNull()
    })

    it('should not create a new session map when map exists', async () => {
      const existingMap = new Map<string, SessionDatum>()
      req.session.sessionDataMap = existingMap

      middleware(req, res, next)

      expect(req.session.sessionDataMap).toBe(existingMap)
    })

    it('should not create a new session map when populated map exists', async () => {
      const existingMap = new Map<string, SessionDatum>()
      existingMap[journeyId] = {} as SessionDatum
      req.session.sessionDataMap = existingMap

      middleware(req, res, next)

      expect(req.session.sessionDataMap).toBe(existingMap)
    })
  })

  describe('get session journey', () => {
    const unMappedJourney = {
      appointmentName: 'Not from mapped session data',
    } as AppointmentJourney
    const unMappedBulkJourney = {
      appointments: [
        {
          comment: 'Not from mapped session data',
        },
      ],
    } as BulkAppointmentJourney
    const unMappedEditJourney = {
      comment: 'Not from mapped session data',
    } as EditAppointmentJourney

    beforeEach(() => {
      req.session.appointmentJourney = unMappedJourney
      req.session.bulkAppointmentJourney = unMappedBulkJourney
      req.session.editAppointmentJourney = unMappedEditJourney
      req.session.sessionDataMap = new Map<string, SessionDatum>()
      req.session.sessionDataMap[journeyId] = appointmentSessionDatum

      req.params.journeyId = journeyId
    })

    it('should return session mapped data using journey id parameter', async () => {
      expect(req.session.appointmentJourney).toBe(unMappedJourney)
      expect(req.session.bulkAppointmentJourney).toBe(unMappedBulkJourney)
      expect(req.session.editAppointmentJourney).toBe(unMappedEditJourney)

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.bulkAppointmentJourney).toBe(bulkAppointmentJourney)
      expect(req.session.editAppointmentJourney).toBe(editAppointmentJourney)
    })

    it('should return null session data with unmapped journey id', async () => {
      req.params.journeyId = uuidv4()

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.bulkAppointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('should return null session data with an undefined journey id', async () => {
      req.params.journeyId = undefined

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.bulkAppointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('should return null session data with a null journey id', async () => {
      req.params.journeyId = null

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.bulkAppointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })
  })

  describe('set session journey', () => {
    const updatedJourney = {
      appointmentName: 'Updated session data',
    } as AppointmentJourney
    const updatedBulkJourney = {
      appointments: [
        {
          comment: 'Updated session data',
        },
      ],
    } as BulkAppointmentJourney
    const updatedEditJourney = {
      comment: 'Updated session data',
    } as EditAppointmentJourney

    beforeEach(() => {
      req.params.journeyId = journeyId
      req.session.sessionDataMap = new Map<string, SessionDatum>()
      req.session.sessionDataMap[journeyId] = appointmentSessionDatum
    })

    it('should set session mapped data using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.bulkAppointmentJourney).toBe(bulkAppointmentJourney)
      expect(req.session.editAppointmentJourney).toBe(editAppointmentJourney)
      expect(req.session.sessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = updatedJourney
      req.session.bulkAppointmentJourney = updatedBulkJourney
      req.session.editAppointmentJourney = updatedEditJourney

      expect(req.session.appointmentJourney).toBe(updatedJourney)
      expect(req.session.bulkAppointmentJourney).toBe(updatedBulkJourney)
      expect(req.session.editAppointmentJourney).toBe(updatedEditJourney)
      expect(req.session.sessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
        bulkAppointmentJourney: updatedBulkJourney,
        editAppointmentJourney: updatedEditJourney,
      } as SessionDatum)
    })

    it('should set session mapped data to null using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.bulkAppointmentJourney).toBe(bulkAppointmentJourney)
      expect(req.session.editAppointmentJourney).toBe(editAppointmentJourney)
      expect(req.session.sessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = null
      req.session.bulkAppointmentJourney = null
      req.session.editAppointmentJourney = null

      expect(req.session.appointmentJourney).toBe(null)
      expect(req.session.bulkAppointmentJourney).toBe(null)
      expect(req.session.editAppointmentJourney).toBe(null)
      expect(req.session.sessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: null,
        bulkAppointmentJourney: null,
        editAppointmentJourney: null,
      } as SessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id is not mapped', async () => {
      req.session.sessionDataMap = new Map<string, SessionDatum>()

      middleware(req, res, next)

      expect(req.session.sessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.sessionDataMap[journeyId]).toMatchObject({
        appointmentJourney: updatedJourney,
      } as SessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id maps to undefined', async () => {
      req.session.sessionDataMap[journeyId] = undefined

      middleware(req, res, next)

      expect(req.session.sessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.sessionDataMap[journeyId]).toMatchObject({
        appointmentJourney: updatedJourney,
      } as SessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id maps to null', async () => {
      req.session.sessionDataMap[journeyId] = null

      middleware(req, res, next)

      expect(req.session.sessionDataMap[journeyId]).toBeNull()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.sessionDataMap[journeyId]).toMatchObject({
        appointmentJourney: updatedJourney,
      } as SessionDatum)
    })

    it('should replace the oldest session datum if MAX_CONCURRENT_JOURNEYS is exceeded', async () => {
      const epoch = Date.now() - 100000 // Reduced by 100 seconds to avoid clash of epoch

      req.session.sessionDataMap = Array(50)
        .fill({} as SessionDatum)
        .reduce((map, obj, i) => {
          // eslint-disable-next-line no-param-reassign
          map[uuidv4()] = { ...obj, instanceUnixEpoch: epoch + i }
          return map
        }, {})

      middleware(req, res, next)

      expect(req.session.sessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.sessionDataMap[journeyId]).toMatchObject({
        appointmentJourney: updatedJourney,
      } as SessionDatum)
      expect(Object.keys(req.session.sessionDataMap).length).toEqual(50)
      expect(Object.values(req.session.sessionDataMap).find(j => j.instanceUnixEpoch === epoch)).toBeUndefined()
    })
  })
})
