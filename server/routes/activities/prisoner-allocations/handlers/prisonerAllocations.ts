import { Request, Response } from 'express'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToArray } from '../../../../utils/utils'

export default class PrisonerAllocationsHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const addPrisoner = convertToArray(prisonerNumber)

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerAllocations = await this.activitiesService.getActivePrisonPrisonerAllocations(addPrisoner, user)
    const allocationsData = prisonerAllocations[0]?.allocations.flat(1)

    const prisonerNonAssociations = await this.nonAssociationsService.getNonAssociationByPrisonerId(
      prisonerNumber,
      user,
    )
    const hasNonAssociations = prisonerNonAssociations.nonAssociations.length > 0

    return res.render('pages/activities/prisoner-allocations/dashboard', {
      prisoner,
      hasNonAssociations,
      allocationsData,
      locationStatus: getLocationStatus(prisoner),
    })
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}

function getLocationStatus(prisonerData: Prisoner) {
  if (prisonerData.status === 'ACTIVE OUT') {
    return `Temporarily out from ${prisonerData.prisonName}`
  }
  return null
}
