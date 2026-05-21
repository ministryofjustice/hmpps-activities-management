import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { StartDateOption } from '../../journey'

export default class CheckAndConfirmMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { inmates } = req.journeyData.allocateJourney

    const hasPayBand = inmates.some(inmate => inmate.payBand !== undefined)
    res.render('pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple', {
      showPayRates: hasPayBand,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmates, activity, scheduledInstance, startDate, endDate, startDateOption } =
      req.journeyData.allocateJourney
    const { user } = res.locals

    const allocationRequests = inmates.map(inmate => ({
      prisonerNumber: inmate.prisonerNumber,
      payBandId: inmate.payBand?.id || null,
      startDate,
      endDate,
      exclusions: [],
      scheduleInstanceId: startDateOption === StartDateOption.NEXT_SESSION ? scheduledInstance?.id : null,
    }))

    await this.activitiesService.postBulkAllocations(activity.scheduleId, { allocations: allocationRequests }, user)

    res.redirect('confirmation')
  }
}
