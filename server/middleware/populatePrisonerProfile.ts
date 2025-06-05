import { Request, Response, NextFunction } from 'express'
import PrisonService from '../services/prisonService'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'

const WORKPLACE_RISK_LEVEL_LOW = 'RLO'
const WORKPLACE_RISK_LEVEL_MEDIUM = 'RME'
const WORKPLACE_RISK_LEVEL_HIGH = 'RHI'

export default function populatePrisonerProfile(prisonService: PrisonService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner: Prisoner = await prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const earliestReleaseDate = determineEarliestReleaseDate(prisoner)
    const workplaceRiskAssessment = determineWorkplaceRiskAssessment(prisoner)
    const location = determineLocation(prisoner)

    res.locals.prisonerProfile = {
      ...prisoner,
      earliestReleaseDate,
      workplaceRiskAssessment,
      location,
    }

    next()
  }
}

const determineLocation = (prisoner: Prisoner) => {
  switch (prisoner.lastMovementTypeCode) {
    case 'CRT':
      return 'Court'
    case 'REL':
      return 'Released'
    default:
      return prisoner.cellLocation
  }
}

const determineWorkplaceRiskAssessment = (prisoner: Prisoner) => {
  if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_HIGH)) {
    return 'HIGH'
  }
  if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_MEDIUM)) {
    return 'MEDIUM'
  }
  if (prisoner.alerts.some(alert => alert.alertCode === WORKPLACE_RISK_LEVEL_LOW)) {
    return 'LOW'
  }
  return 'NONE'
}

const determineEarliestReleaseDate = (prisoner: Prisoner) =>
  prisoner.releaseDate ||
  (hasActualParoleDate(prisoner) ? prisoner.actualParoleDate : null) ||
  (hasTariffDate(prisoner) ? prisoner.tariffDate : null)

const hasActualParoleDate = (prisoner: Prisoner) =>
  prisoner.legalStatus === 'INDETERMINATE_SENTENCE' && prisoner.actualParoleDate != null

const hasTariffDate = (prisoner: Prisoner) =>
  prisoner.legalStatus === 'INDETERMINATE_SENTENCE' && prisoner.tariffDate != null
