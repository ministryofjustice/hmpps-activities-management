import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentCountSummary } from '../../../../@types/activitiesAPI/types'

export class AppointmentPreview {}

export default class AppointmentPreviewRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { fromDate, categories } = req.query

    const appointmentMigrationSummaries: AppointmentCountSummary[] =
      await this.activitiesService.getAppointmentMigrationSummary(
        user.activeCaseLoadId,
        fromDate as string,
        categories as string,
        user,
      )

    const totalAppointments = appointmentMigrationSummaries.reduce((n, { count }) => n + count, 0)

    res.render('pages/activities/administration/appointment-preview', {
      appointmentMigrationSummaries,
      fromDate,
      totalAppointments,
      categories,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { categories, fromDate } = req.body

    const categoryList: string[] = categories.split(',')

    for (let i = 0; i < categoryList.length; i += 1) {
      const category = categoryList[i]
      // eslint-disable-next-line no-await-in-loop
      await this.activitiesService.deleteMigratedAppointments(user.activeCaseLoadId, fromDate, category, user)
    }

    const successMessage =
      'Wait up to 15 minutes, then use the appointments service to check the appointments have been deleted.' +
      'If you have database access you can check the ‘job’ table for success or failure of the deletion along with start and end times.' +
      'Failure messages will be recorded in Sentry and should be posted to the #activities-and-appointments-alerts slack channel'

    return res.redirectWithSuccess(`/activities/admin`, 'Appointment deletion has started', successMessage)
  }
}
