import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  selectedPrisoner: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { query, search } = req.query

    // The "search" variable is used for form validation because it's always set when the form submits
    // "query" can be undefined either because it's an inital page load or because no query term was entered
    if (search && search === 'true') {
      const prisoners = await this.getPrisoners(req, res)
      if (prisoners) return res.render('pages/appointments/create-and-edit/select-prisoner', { prisoners, query })
    }

    return res.render('pages/appointments/create-and-edit/select-prisoner')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const result = await this.addSelectedPrisonerToSession(req, res)

    if (result) {
      if (req.session.appointmentJourney.type === AppointmentType.GROUP) {
        return res.redirect('review-prisoners')
      }
      return res.redirectOrReturn('category')
    }
    return res.validationFailed('selectedPrisoner', 'You must select one option')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const result = await this.addSelectedPrisonerToSession(req, res)

    if (result) return res.redirect('review-prisoners')

    return res.validationFailed('selectedPrisoner', 'You must select one option')
  }

  private getPrisoners = async (req: Request, res: Response) => {
    const { query } = req.query
    const { user } = res.locals

    if (typeof query !== 'string' || query === '') {
      res.validationFailed('query', 'Enter a name or prisoner number to search by', false)
      return false
    }

    const results = await this.prisonService.searchPrisonInmates(query, user)

    return results.content
  }

  private addSelectedPrisonerToSession = async (req: Request, res: Response) => {
    const { selectedPrisoner } = req.body
    const { user } = res.locals

    let prisoner
    try {
      prisoner = await this.prisonService.getInmateByPrisonerNumber(selectedPrisoner, user)
    } catch {
      return false
    }

    const prisonerData = {
      number: prisoner.prisonerNumber,
      name: `${prisoner.firstName} ${prisoner.lastName}`,
      cellLocation: prisoner.cellLocation,
    }

    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      if (req.session.editAppointmentJourney.addPrisoners.find(p => p.number === prisonerData.number)) return true
      req.session.editAppointmentJourney.addPrisoners.push(prisonerData)
    } else if (req.session.appointmentJourney.type === AppointmentType.GROUP) {
      if (req.session.appointmentJourney.prisoners.find(p => p.number === prisonerData.number)) return true
      req.session.appointmentJourney.prisoners.push(prisonerData)
    } else if (req.session.appointmentJourney.type === AppointmentType.INDIVIDUAL) {
      req.session.appointmentJourney.prisoners = [prisonerData]
    }

    return true
  }
}
