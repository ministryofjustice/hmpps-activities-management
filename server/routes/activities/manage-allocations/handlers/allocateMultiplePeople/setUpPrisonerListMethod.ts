import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import HowToAddOptions from '../../../../../enum/allocations'
import ActivitiesService from '../../../../../services/activitiesService'
import { AllocateToActivityJourney } from '../../journey'

export class SetUpPrisonerListForm {
  @Expose()
  @IsEnum(HowToAddOptions, { message: 'Select one option' })
  howToAdd: HowToAddOptions
}

export default class SetUpPrisonerListMethodRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/manage-allocations/allocateMultiplePeople/setUpPrisonerListMethod')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { howToAdd } = req.body
    const { scheduleId } = req.query
    const { user } = res.locals

    const schedule = await this.activitiesService.getActivitySchedule(+scheduleId, user)

    req.session.allocateJourney = {
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        location: schedule.internalLocation?.description,
        inCell: schedule.activity.inCell,
        onWing: schedule.activity.onWing,
        offWing: schedule.activity.offWing,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        scheduleWeeks: schedule.scheduleWeeks,
        paid: schedule.activity.paid,
      },
    } as AllocateToActivityJourney

    // TODO: add redirects for the other options in later tickets
    if (HowToAddOptions[howToAdd] === HowToAddOptions.SEARCH) {
      res.redirect('select-prisoner')
    } else if (HowToAddOptions[howToAdd] === HowToAddOptions.CSV) {
      res.redirect('upload-prisoner-list')
    }
  }
}
