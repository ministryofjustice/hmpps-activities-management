import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ActivityScheduleLite } from '../../../@types/activitiesAPI/types'

export default class SchedulesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly capacitiesService: CapacitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params

    const addAllocationSummary = async (a: ActivityScheduleLite) => ({
      ...a,
      ...(await this.capacitiesService.getScheduleAllocationsSummary(a.id, user)),
    })

    const schedules = await this.activitiesService
      .getSchedulesOfActivity(activityId as unknown as number, user)
      .then(c => Promise.all(c.map(addAllocationSummary)))

    res.render('pages/allocate-to-activity/schedules-dashboard', {
      total: this.capacitiesService.getTotalAllocationSummary(schedules),
      schedules,
    })
  }
}
