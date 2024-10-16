import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'

export default class NonAssociationsRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, prisonerNumber } = req.params

    const [activity, prisoner]: [Activity, Prisoner] = await Promise.all([
      this.activitiesService.getActivity(+activityId, user),
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
    ])

    // const scheduleId = getScheduleIdFromActivity(activity)
    // const nonAssociations = await this.activitiesService.getNonAssociations(scheduleId, prisonerNumber, user)
    // const allocatedNonAssociations = nonAssociations.filter(na => na.allocated === true)
    // const unallocatedNonAssociations = nonAssociations.filter(na => na.allocated === false)

    res.render('pages/activities/non-associations/nonAssociations', {
      activity,
      prisoner,
      // allocatedNonAssociations,
      // unallocatedNonAssociations,
    })
  }
}
