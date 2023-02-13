import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase, toPrisonerDescription } from '../../../../utils/utils'

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
      { prisonIds: [user.activeCaseLoadId], prisonerIdentifier: number, includeAliases: false },
      user,
    )

    if (prisoners.length === 0) {
      req.flash(
        'validationErrors',
        JSON.stringify([{ field: 'number', message: `Prisoner with number ${number} was not found` }]),
      )
      req.flash('formResponses', JSON.stringify(req.body))
      return res.redirect('back')
    }

    // There is no check that more than one prisoner returned from the prisoner search call as there cannot be
    // more than one match based on prisoner number. In the future if we add searching by name, there will need to
    // be a screen to select the correct prisoner from the returned list.
    const prisoner = prisoners[0]

    req.session.createSingleAppointmentJourney.prisoner = {
      number: prisoner.prisonerNumber,
      displayName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      cellLocation: prisoner.cellLocation,
      description: toPrisonerDescription(prisoner),
    }

    return res.redirectOrReturn('category')
  }
}
