import { Request, Response } from 'express'
import { YesNo } from '../../../../@types/activities'

export default class ScheduleRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const defaultBackLinkHref =
      req.session.appointmentJourney.repeat === YesNo.YES ? 'repeat-period-and-count' : 'repeat'

    res.render('pages/appointments/create-and-edit/schedule', {
      backLinkHref: defaultBackLinkHref,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('comment')
  }
}
