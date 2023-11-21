import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'

export class HostForm {
  @Expose()
  @IsEnum(Organiser, { message: 'Select an appointment host' })
  host: string
}

export default class HostRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/appointments/create-and-edit/host', { organiserDescriptions })

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { host }: HostForm = req.body

    req.session.appointmentJourney.organiserCode = host

    return res.redirectOrReturn('location')
  }
}
