import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  selectedPrisoner: string
}

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'Enter a name or prison number to search by' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let { query } = req.query
    if (res.locals.formResponses?.query !== undefined) {
      query = res.locals.formResponses.query
    }

    if (query && typeof query === 'string' && query !== '') {
      const result = await this.prisonService.searchPrisonInmates(query, user)
      let prisoners: Prisoner[] = []
      if (result && !result.empty) prisoners = result.content
      return res.render('pages/appointments/create-and-edit/select-prisoner', { prisoners, query })
    }

    return res.render('pages/appointments/create-and-edit/select-prisoner')
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}`)
  }

  SELECT_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const result = await this.addSelectedPrisonerToSession(req, res)

    if (result) {
      if (
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT ||
        req.session.appointmentJourney.type === AppointmentType.GROUP
      ) {
        return res.redirect('review-prisoners')
      }
      return res.redirectOrReturn('category')
    }
    return res.validationFailed('selectedPrisoner', 'You must select one option')
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
