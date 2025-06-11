import { Request, Response, NextFunction } from 'express'
import PrisonService from '../services/prisonService'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'

const WORKPLACE_RISK_LEVEL_LOW = 'RLO'
const WORKPLACE_RISK_LEVEL_MEDIUM = 'RME'
const WORKPLACE_RISK_LEVEL_HIGH = 'RHI'

// Can be added as middleware on routes where server/views/partials/miniProfile.njk is being used
// Example use in view: {{ miniProfile(prisonerProfile) }}
export default function populatePrisonerProfile(prisonService: PrisonService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const prisoner: Prisoner = await prisonService.getInmateByPrisonerNumber(req.params.prisonerNumber, res.locals.user)

    res.locals.prisonerProfile = {
      ...prisoner,
      earliestReleaseDate: determineEarliestReleaseDate(prisoner),
      workplaceRiskAssessment: determineWorkplaceRiskAssessment(prisoner),
      location: determineLocation(prisoner),
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
