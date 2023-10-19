import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToTitleCase } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

export default class ViewAllocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    const allocation = await this.activitiesService.getAllocation(+allocationId, user)

    const [activity, prisoner]: [Activity, Prisoner] = await Promise.all([
      this.activitiesService.getActivity(allocation.activityId, user),
      this.prisonService.getInmateByPrisonerNumber(allocation.prisonerNumber, user),
    ])

    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    const isOnlyPay =
      activity.pay.filter(p => p.incentiveLevel === prisoner.currentIncentive?.level?.description).length === 1
    const pay = activity.pay.find(
      a =>
        a.prisonPayBand.id === allocation.prisonPayBand.id &&
        a.incentiveLevel === prisoner.currentIncentive?.level?.description,
    )

    const isStarted = new Date(allocation.startDate) <= new Date()

    res.render('pages/activities/manage-allocations/view-allocation', {
      allocation,
      prisonerName,
      pay,
      isStarted,
      isOnlyPay,
    })
  }
}
