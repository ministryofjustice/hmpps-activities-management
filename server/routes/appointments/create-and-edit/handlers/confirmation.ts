import { plainToInstance } from 'class-transformer'
import { Request, Response } from 'express'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/create-and-edit/confirmation', { appointment })

    req.session.appointmentJourney = null
  }

  GET_BULK = async (req: Request, res: Response) => {
    // TODO: Replace session with GET bulk appointment request
    const { appointmentJourney, bulkAppointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/confirmation', {
      appointment: {
        ...appointmentJourney,
        ...bulkAppointmentJourney,
        startDate: plainToInstance(SimpleDate, appointmentJourney.startDate).toString(),
      },
    })

    req.session.appointmentJourney = null
    req.session.bulkAppointmentJourney = null
  }
}
