import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentType } from '../journey'

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'Enter a name or prisoner number to search by' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create/select-prisoner`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    const { user } = res.locals

    const results = await this.prisonService.searchPrisonInmates(query, user)

    if (results.empty) {
      return res.validationFailed('query', `No prisoners found for query "${query}"`)
    }

    // There is no check that more than one prisoner returned from the prisoner search call as there cannot be
    // more than one match based on prisoner number. In the future if we add searching by name, there will need to
    // be a screen to select the correct prisoner from the returned list.
    const prisoner = {
      number: results.content[0].prisonerNumber,
      name: `${results.content[0].firstName} ${results.content[0].lastName}`,
      cellLocation: results.content[0].cellLocation,
    }

    if (req.session.createAppointmentJourney.type === AppointmentType.GROUP) {
      if (req.session.createAppointmentJourney.prisoners.find(p => p.number === prisoner.number)) {
        return res.validationFailed('query', `${prisoner.name} (${prisoner.number}) already added to appointment`)
      }

      req.session.createAppointmentJourney.prisoners.push(prisoner)

      return res.redirect('review-prisoners')
    }

    req.session.createAppointmentJourney.prisoners = [prisoner]

    return res.redirectOrReturn('category')
  }
}
