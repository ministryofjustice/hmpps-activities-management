import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentType } from '../appointmentJourney'

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'Enter a name or prisoner number to search by' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/select-prisoner')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const prisoner = await this.getPrisoner(req, res)
    if (!prisoner) return

    if (req.session.appointmentJourney.type === AppointmentType.GROUP) {
      if (!req.session.appointmentJourney.prisoners.find(p => p.number === prisoner.number)) {
        req.session.appointmentJourney.prisoners.push(prisoner)
      }

      res.redirect('review-prisoners')
    } else {
      req.session.appointmentJourney.prisoners = [prisoner]

      res.redirectOrReturn('category')
    }
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const prisoner = await this.getPrisoner(req, res)
    if (!prisoner) return

    if (!req.session.editAppointmentJourney.addPrisoners.find(p => p.number === prisoner.number)) {
      req.session.editAppointmentJourney.addPrisoners.push(prisoner)
    }

    res.redirect('review-prisoners')
  }

  private getPrisoner = async (req: Request, res: Response) => {
    const { query } = req.body
    const { user } = res.locals

    const results = await this.prisonService.searchPrisonInmates(query, user)

    if (results.empty) {
      res.validationFailed('query', `No prisoners found for query "${query}"`)
      return false
    }

    // There is no check that more than one prisoner returned from the prisoner search call as there cannot be
    // more than one match based on prisoner number. In the future if we add searching by name, there will need to
    // be a screen to select the correct prisoner from the returned list.
    return {
      number: results.content[0].prisonerNumber,
      name: `${results.content[0].firstName} ${results.content[0].lastName}`,
      cellLocation: results.content[0].cellLocation,
    }
  }
}
