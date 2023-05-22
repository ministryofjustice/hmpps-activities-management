import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { DescriptionRequired, DescriptionMaxLength } from '../../../../validators/validateAppointmentDescription'
import { YesNo } from '../../../../@types/activities'

export class Description {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want to show the appointment category on the unlock list.' })
  descriptionOption: string

  @Expose()
  @DescriptionRequired({ message: 'Please enter an appointment description' })
  @DescriptionMaxLength({ message: 'You must enter a description which has no more than 40 characters' })
  description: string
}

export default class DescriptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/description')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { descriptionOption, description } = req.body
    req.session.appointmentJourney.descriptionOption = descriptionOption
    if (descriptionOption === YesNo.NO) req.session.appointmentJourney.description = description
    else req.session.appointmentJourney.description = null
    res.redirectOrReturn(`location`)
  }
}
