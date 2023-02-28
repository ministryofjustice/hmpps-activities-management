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
    const activityId = +req.params.activityId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const addAllocationSummary = async (a: ActivityScheduleLite) => ({
      ...a,
      ...(await this.capacitiesService.getScheduleAllocationsSummary(a.id, user)),
    })

    const schedules = await this.activitiesService
      .getSchedulesOfActivity(activityId, user)
      .then(c => Promise.all(c.map(addAllocationSummary)))
      .then(allSchedules => allSchedules.filter(s => !s.endDate || new Date(s.endDate) >= today))

    res.render('pages/allocate-to-activity/schedules-dashboard', {
      total: this.capacitiesService.getTotalAllocationSummary(schedules),
      schedules,
    })
  }
}
