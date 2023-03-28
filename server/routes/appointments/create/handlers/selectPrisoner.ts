import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentType } from '../journey'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { FormValidationError } from '../../../../formValidationErrorHandler'

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
      throw new FormValidationError('query', `No prisoners found for query "${query}"`)
    }

    // There is no check that more than one prisoner returned from the prisoner search call as there cannot be
    // more than one match based on prisoner number. In the future if we add searching by name, there will need to
    // be a screen to select the correct prisoner from the returned list.
    const prisoner = results.content[0]
    this.addPrisoner(prisoner, req)

    if (req.session.createAppointmentJourney.type === AppointmentType.GROUP) {
      return res.redirect('review-prisoners')
    }
    return res.redirectOrReturn('category')
  }

  private addPrisoner(prisoner: Prisoner, req: Request) {
    req.session.createAppointmentJourney.prisoners = req.session.createAppointmentJourney.prisoners || []
    // Clear the array if this appointment is for an individual
    if (req.session.createAppointmentJourney.type === AppointmentType.INDIVIDUAL) {
      req.session.createAppointmentJourney.prisoners = []
    }

    if (req.session.createAppointmentJourney.prisoners.find(p => p.number === prisoner.prisonerNumber)) {
      throw new FormValidationError(
        'query',
        `${prisoner.firstName} ${prisoner.lastName} (${prisoner.prisonerNumber}) already added to appointment`,
      )
    }

    req.session.createAppointmentJourney.prisoners.push({
      number: prisoner.prisonerNumber,
      name: `${prisoner.firstName} ${prisoner.lastName}`,
      cellLocation: prisoner.cellLocation,
    })
  }
}
