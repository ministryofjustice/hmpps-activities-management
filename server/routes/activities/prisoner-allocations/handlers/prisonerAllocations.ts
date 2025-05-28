import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

const WORKPLACE_RISK_LEVEL_LOW = 'RLO'
const WORKPLACE_RISK_LEVEL_MEDIUM = 'RME'
const WORKPLACE_RISK_LEVEL_HIGH = 'RHI'

export default class PrisonerAllocationsHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const earliestReleaseDate = determineEarliestReleaseDate(prisoner)

    let wra = 'NONE'
    if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_HIGH)) {
      wra = 'HIGH'
    } else if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_MEDIUM)) {
      wra = 'MEDIUM'
    } else if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_LOW)) {
      wra = 'LOW'
    }

    const viewPrisoner = {
      ...prisoner,
      earliestReleaseDate,
      workplaceRiskAssessment: wra,
    }

    return res.render('pages/activities/prisoner-allocations/dashboard', { prisoner: viewPrisoner })
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}

const determineEarliestReleaseDate = (prisoner: Prisoner) =>
  prisoner.releaseDate ||
  (hasActualParoleDate(prisoner) ? prisoner.actualParoleDate : null) ||
  (hasTariffDate(prisoner) ? prisoner.tariffDate : null)

const hasActualParoleDate = (prisoner: Prisoner) =>
  prisoner.legalStatus === 'INDETERMINATE_SENTENCE' && prisoner.actualParoleDate != null

const hasTariffDate = (prisoner: Prisoner) =>
  prisoner.legalStatus === 'INDETERMINATE_SENTENCE' && prisoner.tariffDate != null
