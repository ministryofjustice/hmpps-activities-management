import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import populateJourney from './populateJourney'
import { AppointmentSessionDatum } from '../@types/express'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { BulkAppointmentJourney } from '../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'

const middleware = populateJourney()

let req: Request
let res: Response

let appointmentJourney: AppointmentJourney
let bulkAppointmentJourney: BulkAppointmentJourney
let editAppointmentJourney: EditAppointmentJourney
let appointmentSessionDatum: AppointmentSessionDatum

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
  } as AppointmentSessionDatum

  journeyId = uuidv4()
})

describe('populateJourney', () => {
  describe('create session map', () => {
    it('should create a new session map when map is undefined', async () => {
      req.session.appointmentSessionDataMap = undefined

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap).not.toBeUndefined()
      expect(req.session.appointmentSessionDataMap).not.toBeNull()
    })

    it('should create a new session map when map is null', async () => {
      req.session.appointmentSessionDataMap = null

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap).not.toBeUndefined()
      expect(req.session.appointmentSessionDataMap).not.toBeNull()
    })

    it('should not create a new session map when map exists', async () => {
      const existingMap = new Map<string, AppointmentSessionDatum>()
      req.session.appointmentSessionDataMap = existingMap

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap).toBe(existingMap)
    })

    it('should not create a new session map when populated map exists', async () => {
      const existingMap = new Map<string, AppointmentSessionDatum>()
      existingMap[journeyId] = {} as AppointmentSessionDatum
      req.session.appointmentSessionDataMap = existingMap

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap).toBe(existingMap)
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
      req.session.appointmentSessionDataMap = new Map<string, AppointmentSessionDatum>()
      req.session.appointmentSessionDataMap[journeyId] = appointmentSessionDatum

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
      req.session.appointmentSessionDataMap = new Map<string, AppointmentSessionDatum>()
      req.session.appointmentSessionDataMap[journeyId] = appointmentSessionDatum
    })

    it('should set session mapped data using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.bulkAppointmentJourney).toBe(bulkAppointmentJourney)
      expect(req.session.editAppointmentJourney).toBe(editAppointmentJourney)
      expect(req.session.appointmentSessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = updatedJourney
      req.session.bulkAppointmentJourney = updatedBulkJourney
      req.session.editAppointmentJourney = updatedEditJourney

      expect(req.session.appointmentJourney).toBe(updatedJourney)
      expect(req.session.bulkAppointmentJourney).toBe(updatedBulkJourney)
      expect(req.session.editAppointmentJourney).toBe(updatedEditJourney)
      expect(req.session.appointmentSessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
        bulkAppointmentJourney: updatedBulkJourney,
        editAppointmentJourney: updatedEditJourney,
      } as AppointmentSessionDatum)
    })

    it('should set session mapped data to null using journey id parameter', async () => {
      middleware(req, res, next)

      expect(req.session.appointmentJourney).toBe(appointmentJourney)
      expect(req.session.bulkAppointmentJourney).toBe(bulkAppointmentJourney)
      expect(req.session.editAppointmentJourney).toBe(editAppointmentJourney)
      expect(req.session.appointmentSessionDataMap[journeyId]).toBe(appointmentSessionDatum)

      req.session.appointmentJourney = null
      req.session.bulkAppointmentJourney = null
      req.session.editAppointmentJourney = null

      expect(req.session.appointmentJourney).toBe(null)
      expect(req.session.bulkAppointmentJourney).toBe(null)
      expect(req.session.editAppointmentJourney).toBe(null)
      expect(req.session.appointmentSessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: null,
        bulkAppointmentJourney: null,
        editAppointmentJourney: null,
      } as AppointmentSessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id is not mapped', async () => {
      req.session.appointmentSessionDataMap = new Map<string, AppointmentSessionDatum>()

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.appointmentSessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
      } as AppointmentSessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id maps to undefined', async () => {
      req.session.appointmentSessionDataMap[journeyId] = undefined

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap[journeyId]).toBeUndefined()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.appointmentSessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
      } as AppointmentSessionDatum)
    })

    it('should create a new session datum mapped to the journey id parameter if journey id maps to null', async () => {
      req.session.appointmentSessionDataMap[journeyId] = null

      middleware(req, res, next)

      expect(req.session.appointmentSessionDataMap[journeyId]).toBeNull()

      req.session.appointmentJourney = updatedJourney

      expect(req.session.appointmentSessionDataMap[journeyId]).toStrictEqual({
        appointmentJourney: updatedJourney,
      } as AppointmentSessionDatum)
    })
  })
})
