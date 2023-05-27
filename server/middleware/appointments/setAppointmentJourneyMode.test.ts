import { Request, Response } from 'express'
import setAppointmentJourneyMode from './setAppointmentJourneyMode'
import { AppointmentJourneyMode, AppointmentType } from '../../routes/appointments/create-and-edit/appointmentJourney'

describe('setAppointmentJourneyMode', () => {
  const middleware = setAppointmentJourneyMode(AppointmentJourneyMode.EDIT)
  let req: Request
  let res: Response
  const next = jest.fn()

  beforeEach(() => {
    req = {
      session: {},
    } as Request

    res = {} as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('overrides appointment journey mode', async () => {
    req.session.appointmentJourney = { mode: AppointmentJourneyMode.CREATE, type: AppointmentType.INDIVIDUAL }
    await middleware(req, res, next)

    expect(req.session.appointmentJourney.mode).toEqual(AppointmentJourneyMode.EDIT)
    expect(next).toHaveBeenCalled()
  })

  it('does not require active appointment journey in session', async () => {
    req.session.appointmentJourney = null
    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
