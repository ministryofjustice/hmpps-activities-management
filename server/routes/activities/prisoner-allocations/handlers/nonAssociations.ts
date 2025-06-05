import { Request, Response } from 'express'
import config from '../../../../config'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import { PrisonerAllocations, PrisonerNonAssociation } from '../../../../@types/activitiesAPI/types'
import { ServiceUser } from '../../../../@types/express'

export default class NonAssociationsHandler {
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

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerNonAssociations = await this.nonAssociationsService.getNonAssociationByPrisonerId(
      prisonerNumber,
      user,
    )
    const nonAssociationPrns = prisonerNonAssociations.nonAssociations.map(na => na.otherPrisonerDetails.prisonerNumber)
    const prisonerAllocations = await this.activitiesService.getActivePrisonPrisonerAllocations(
      nonAssociationPrns,
      user,
    )

    const enhancedNonAssociations = await this.enhanceNonAssociations(
      prisonerNonAssociations.nonAssociations,
      prisonerAllocations,
      user,
    )

    const viewPrisoner = {
      ...prisoner,
      enhancedNonAssociations,
    }

    return res.render('pages/activities/prisoner-allocations/non-associations', { prisoner: viewPrisoner })
  }

  private enhanceNonAssociations = async (
    nonAssociations: PrisonerNonAssociation[],
    prisonerAllocations: PrisonerAllocations[],
    user: ServiceUser,
  ) => {
    const updatedPrisonerAllocations = await Promise.all(
      prisonerAllocations.map(async prisoner => {
        const updatedAllocations = await Promise.all(
          prisoner.allocations.map(async allocation => {
            const activity = await this.activitiesService.getActivity(allocation.activityId, user)

            return {
              ...allocation,
              schedule: activity.schedules[0],
            }
          }),
        )

        return {
          ...prisoner,
          allocations: updatedAllocations,
        }
      }),
    )
    const naAllocations = new Map(updatedPrisonerAllocations.map(naAll => [naAll.prisonerNumber, naAll.allocations]))
    return nonAssociations.map(na => {
      return {
        ...na,
        allocations: naAllocations.get(na.otherPrisonerDetails.prisonerNumber) || [],
      }
    })
  }
}
