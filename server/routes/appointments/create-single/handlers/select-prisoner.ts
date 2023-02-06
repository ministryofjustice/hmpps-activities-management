import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'Enter a prisoner number to search by' })
  number: string
}

export default class NameRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create-single/select-prisoner`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // TODO: Call prisoner search API to validate prisoner number and return name and booking id
    req.session.createSingleAppointmentJourney.prisoner = {
      number: req.body.number,
      bookingId: 1,
      displayName: 'TODO',
    }

    res.redirectOrReturn(`category`)
  }
}
