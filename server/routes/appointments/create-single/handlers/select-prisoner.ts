import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'

export class PrisonerSearch {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Enter a prisoner number to search by' })
  number: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create-single/select-prisoner`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { number } = req.body
    const { user } = res.locals

    const prisoners = await this.prisonService.searchInmates(
      { prisonerIdentifier: number, includeAliases: false },
      user,
    )

    const errors = []
    errors.push({ text: 'Select yes if you want to delete this appointment', href: '#confirmation' })

    if (prisoners.length === 0) {
      req.flash(
        'validationErrors',
        JSON.stringify([{ field: 'number', message: `Prisoner with number ${number} was not found` }]),
      )
      req.flash('formResponses', JSON.stringify(req.body))
      return res.redirect(req.originalUrl)
    }

    if (prisoners.length > 1) {
      req.flash(
        'validationErrors',
        JSON.stringify([{ field: 'number', message: `More than one prisoner was found with number ${number}` }]),
      )
      req.flash('formResponses', JSON.stringify(req.body))
      return res.redirect(req.originalUrl)
    }

    const prisoner = prisoners[0]

    req.session.createSingleAppointmentJourney.prisoner = {
      number: prisoner.prisonerNumber,
      bookingId: parseInt(prisoner.bookingId, 10),
      displayName: `${prisoner.lastName}, ${prisoner.firstName}`,
    }

    return res.redirectOrReturn('category')
  }
}
