import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'Enter a name or prisoner number to search by' })
  query: string

  @Expose()
  @Transform(({ value }) => value === 'true')
  isSelection: boolean

  @Expose()
  selectedPrisoner: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/select-prisoner')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { query, isSelection } = req.body

    const prisoners = await this.getPrisoners(req, res)

    if (prisoners && isSelection) {
      const result = await this.addSelectedPrisonerToSession(req, prisoners)

      if (result) {
        if (req.session.appointmentJourney.type === AppointmentType.GROUP) {
          return res.redirect('review-prisoners')
        }
        return res.redirectOrReturn('category')
      }
      return res.validationFailed('selectedPrisoner', 'You must select one option')
    }

    return res.render('pages/appointments/create-and-edit/select-prisoner', { prisoners, query })
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { isSelection, query } = req.body

    const prisoners = await this.getPrisoners(req, res)

    if (prisoners && isSelection) {
      const result = await this.addSelectedPrisonerToSession(req, prisoners)
      if (result) return res.redirect('review-prisoners')
      return res.validationFailed('selectedPrisoner', 'You must select one option')
    }

    return res.render('pages/appointments/create-and-edit/select-prisoner', { prisoners, query })
  }

  private getPrisoners = async (req: Request, res: Response) => {
    const { query } = req.body
    const { user } = res.locals

    const results = await this.prisonService.searchPrisonInmates(query, user)

    return results.content
  }

  private addSelectedPrisonerToSession = async (req: Request, prisoners: Prisoner[]) => {
    const { selectedPrisoner } = req.body

    if (!selectedPrisoner || selectedPrisoner === '') return false

    const prisoner = prisoners.find(p => p.prisonerNumber === selectedPrisoner)
    if (!prisoner) return false

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
