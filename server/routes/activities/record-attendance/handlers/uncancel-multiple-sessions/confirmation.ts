import { Expose } from 'class-transformer'
import { IsIn, ValidationArguments } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToNumberArray } from '../../../../../utils/utils'
import { UncancelConfirmForm } from '../uncancel-session/confirmation'

const getActivityName = (args: ValidationArguments) => (args.object as UncancelMultipleConfirmForm)?.activityName

export class UncancelMultipleConfirmForm {
  activityName: string

  @Expose()
  @IsIn(['yes', 'no'], {
    message: args => `Select if you want to uncancel ${getActivityName(args) ?? 'the activity sessions'}`,
  })
  confirm: string
}

export default class UncancelMultipleSessionsConfirmRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const selectedInstanceIds = convertToNumberArray(req.journeyData.recordAttendanceJourney.selectedInstanceIds)

    if (selectedInstanceIds.length === 1) {
      const activity = await this.activitiesService.getScheduledActivity(selectedInstanceIds[0], res.locals.user)

      res.render('pages/activities/record-attendance/uncancel-multiple-sessions/confirm-single', {
        activityName: activity.activitySchedule.activity.summary,
      })
    } else {
      res.render('pages/activities/record-attendance/uncancel-multiple-sessions/confirm-multiple', {
        selectedInstanceIds,
      })
    }
  }

  POST = async (req: Request, res: Response) => {
    const { activityDate, sessionFilters, selectedInstanceIds } = req.journeyData.recordAttendanceJourney
    const { user } = res.locals
    const { confirm }: UncancelConfirmForm = req.body

    const sessionFiltersString = sessionFilters ? sessionFilters.join(',') : ''
    const instanceIds = convertToNumberArray(selectedInstanceIds)

    if (confirm === 'yes') {
      await this.activitiesService.uncancelMultipleActivities(instanceIds, user)
    }

    const successMessage =
      instanceIds.length > 1
        ? `You’ve uncancelled ${instanceIds.length} activity sessions.`
        : `You’ve uncancelled one activity session.`

    const successHeading = instanceIds.length > 1 ? `Sessions uncancelled` : `Session uncancelled`

    if (confirm === 'yes') {
      return res.redirectWithSuccess(
        `../uncancel-multiple?date=${activityDate}&sessionFilters=${sessionFiltersString}`,
        successHeading,
        successMessage,
      )
    }
    return res.redirect(`../uncancel-multiple?date=${activityDate}&sessionFilters=${sessionFiltersString}`)
  }
}
