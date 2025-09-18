import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import populateJourney from './populateJourney'
import { SessionDatum } from '../@types/express'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentSetJourney } from '../routes/appointments/create-and-edit/appointmentSetJourney'

const middleware = populateJourney()

let req: Request
let res: Response

let appointmentJourney: AppointmentJourney
let appointmentSetJourney: AppointmentSetJourney
let appointmentSessionDatum: SessionDatum

let journeyId: string

const next = jest.fn()

beforeEach(() => {
  res = {
    redirect: jest.fn(),
  } as unknown as Response

  req = {
    journeyData: {},
    session: {},
    params: {},
  } as unknown as Request

  appointmentJourney = {
    appointmentName: 'From mapped session data',
  } as AppointmentJourney
  appointmentSetJourney = {
    appointments: [
      {
        extraInformation: 'From mapped session data',
      },
    ],
  } as AppointmentSetJourney
  appointmentSessionDatum = {
    appointmentJourney,
    appointmentSetJourney,
  } as SessionDatum

  journeyId = randomUUID()
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
    const unMappedSetJourney = {
      appointments: [
        {
          extraInformation: 'Not from mapped session data',
        },
      ],
    } as AppointmentSetJourney

    beforeEach(() => {
      req.session.appointmentJourney = unMappedJourney
      req.session.appointmentSetJourney = unMappedSetJourney
      req.session.sessionDataMap = new Map<string, SessionDatum>()
      req.session.sessionDataMap[journeyId] = appointmentSessionDatum

      req.params.journeyId = journeyId
    })

    it('should return session mapped data using journey id parameter', async () => {
      expect(req.session.appointmentJourney).toBe(unMappedJourney)
      expect(req.session.appointmentSetJourney).toBe(unMappedSetJourney)

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.appointmentSetJourney).toBe(appointmentSetJourney)
    })

    it('should return null session data with unmapped journey id', async () => {
      req.params.journeyId = randomUUID()

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.appointmentSetJourney).toBeNull()
    })

    it('should return null session data with an undefined journey id', async () => {
      req.params.journeyId = undefined

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.appointmentSetJourney).toBeNull()
    })

    it('should return null session data with a null journey id', async () => {
      req.params.journeyId = null

      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.appointmentSetJourney).toBeNull()
    })
  })

  describe('set session journey', () => {
    const updatedJourney = {
      appointmentName: 'Updated session data',
    } as AppointmentJourney
    const updatedSetJourney = {
      appointments: [
        {
          extraInformation: 'Updated session data',
        },
      ],
    } as AppointmentSetJourney

    beforeEach(() => {
      req.params.journeyId = journeyId
      req.session.sessionDataMap = new Map<string, SessionDatum>()
      req.session.sessionDataMap[journeyId] = appointmentSessionDatum
    })

    it('should set session mapped data using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.appointmentSetJourney).toBe(appointmentSetJourney)
      expect(req.session.sessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = updatedJourney
      req.session.appointmentSetJourney = updatedSetJourney

      expect(req.session.appointmentJourney).toBe(updatedJourney)
      expect(req.session.appointmentSetJourney).toBe(updatedSetJourney)
      expect(req.session.sessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
        appointmentSetJourney: updatedSetJourney,
      } as SessionDatum)
    })

    it('should set session mapped data to null using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.appointmentSetJourney).toBe(appointmentSetJourney)
      expect(req.session.sessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = null
      req.session.appointmentSetJourney = null

      expect(req.session.appointmentJourney).toBe(null)
      expect(req.session.appointmentSetJourney).toBe(null)
      expect(req.session.sessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: null,
        appointmentSetJourney: null,
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

      req.session.sessionDataMap = Array(100)
        .fill({} as SessionDatum)
        .reduce((map, obj, i) => {
          // eslint-disable-next-line no-param-reassign
          map[randomUUID()] = { ...obj, instanceUnixEpoch: epoch + i }
          return map
        }, {})

      middleware(req, res, next)

      expect(req.session.sessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.sessionDataMap[journeyId]).toMatchObject({
        appointmentJourney: updatedJourney,
      } as SessionDatum)
      expect(Object.keys(req.session.sessionDataMap).length).toEqual(100)
      expect(Object.values(req.session.sessionDataMap).find(j => j.instanceUnixEpoch === epoch)).toBeUndefined()
    })
  })
})
