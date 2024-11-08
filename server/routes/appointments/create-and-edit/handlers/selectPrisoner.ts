import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import IsNotAnExistingAttendee from '../../../../validators/IsNotAnExistingAttendee'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  @IsNotAnExistingAttendee({
    message: 'The prisoner you have selected is already attending this appointment',
  })
  selectedPrisoner: string
}

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'You must enter a name or prison number in the format A1234CD' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { preserveHistory } = req.query
    let { query } = req.query
    if (res.locals.formResponses?.query !== undefined) {
      query = res.locals.formResponses.query
    }

    if (query && typeof query === 'string') {
      const result = await this.prisonService.searchPrisonInmates(query, user)
      let prisoners: Prisoner[] = []
      if (result && !result.empty) prisoners = result.content
      return res.render('pages/appointments/create-and-edit/select-prisoner', { prisoners, query, preserveHistory })
    }

    return res.render('pages/appointments/create-and-edit/select-prisoner', { preserveHistory })
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}${req.query.preserveHistory ? '&preserveHistory=true' : ''}`)
  }

  SELECT_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const result = await this.addSelectedPrisonerToSession(req, res)

    if (result) {
      if (
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT ||
        req.session.appointmentJourney.type === AppointmentType.GROUP
      ) {
        return res.redirect(`review-prisoners${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
      }
      if (req.query.preserveHistory) {
        req.session.returnTo = 'schedule?preserveHistory=true'
      }

      return res.redirectOrReturn('name')
    }
    return res.validationFailed('selectedPrisoner', 'You must select one option')
  }

  private addSelectedPrisonerToSession = async (req: Request, res: Response) => {
    const { selectedPrisoner } = req.body
    const { user } = res.locals

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(selectedPrisoner, user).catch(_ => null)
    if (!prisoner) return false

    const prisonerData = {
      number: prisoner.prisonerNumber,
      name: `${prisoner.firstName} ${prisoner.lastName}`,
      prisonCode: prisoner.prisonId,
      cellLocation: prisoner.cellLocation,
      status: prisoner.status,
      category: prisoner.category,
    }

    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      if (req.session.editAppointmentJourney.addPrisoners.find(p => p.number === prisonerData.number)) return true
      req.session.editAppointmentJourney.addPrisoners.push(prisonerData)
    } else if (req.session.appointmentJourney.type === AppointmentType.GROUP) {
      if (req.session.appointmentJourney.prisoners.find(p => p.number === prisonerData.number)) return true
      req.session.appointmentJourney.prisoners.push(prisonerData)
    }

    return true
  }
}
