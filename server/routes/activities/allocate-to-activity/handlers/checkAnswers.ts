import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { formatDate } from '../../../../utils/utils'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney
    const { user } = res.locals

    const activityEntity = await this.activitiesService.getActivity(activity.activityId, user)

    const startDate = formatDate(
      plainToInstance(SimpleDate, req.session.allocateJourney.startDate).toRichDate(),
      'do MMMM yyyy',
    )
    const endDate = req.session.allocateJourney.endDate
      ? formatDate(plainToInstance(SimpleDate, req.session.allocateJourney.endDate).toRichDate(), 'do MMMM yyyy')
      : 'Not set'

    res.render('pages/activities/allocate-to-activity/check-answers', {
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      cellLocation: inmate.cellLocation,
      payBand: inmate.payBand.alias,
      activityName: activity.name,
      inCell: activityEntity.inCell,
      onWing: activityEntity.onWing,
      offWing: activityEntity.offWing,
      activityLocation: activity.location,
      startDate,
      endDate,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity, startDate, endDate } = req.session.allocateJourney
    const { user } = res.locals

    await this.activitiesService.allocateToSchedule(
      activity.scheduleId,
      inmate.prisonerNumber,
      inmate.payBand.id,
      user,
      formatDate(plainToInstance(SimpleDate, startDate).toRichDate(), 'yyyy-MM-dd'),
      endDate ? formatDate(plainToInstance(SimpleDate, endDate).toRichDate(), 'yyyy-MM-dd') : null,
    )

    res.redirect('confirmation')
  }
}
