import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import ActivitiesService from '../../../../../services/activitiesService'
import { simpleDateFromDate } from '../../../../../commonValidationTypes/simpleDate'
import PrisonService from '../../../../../services/prisonService'
import { convertToTitleCase, getScheduleIdFromActivity, parseDate } from '../../../../../utils/utils'
import { Activity, WaitingListApplication } from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

export default class ViewApplicationRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals

    const application = await this.activitiesService.fetchWaitlistApplication(+applicationId, user)

    if (!['APPROVED', 'DECLINED', 'PENDING'].includes(application.status)) {
      return next(createHttpError.NotFound())
    }

    const [prisoner, activity, allApplications]: [Prisoner, Activity, WaitingListApplication[]] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(application.prisonerNumber, user),
      this.activitiesService.getActivity(application.activityId, user),
      this.activitiesService.fetchActivityWaitlist(application.scheduleId, user),
    ])

    const isMostRecent =
      allApplications.find(
        w =>
          w.prisonerNumber === prisoner.prisonerNumber &&
          (w.updatedTime || w.creationTime) > (application.updatedTime || application.creationTime),
      ) === undefined

    const isNotAlreadyAllocated =
      activity.schedules[0].allocations.find(
        a => a.prisonerNumber === prisoner.prisonerNumber && a.status !== 'ENDED',
      ) === undefined

    req.session.waitListApplicationJourney = {
      prisoner: {
        prisonerNumber: prisoner.prisonerNumber,
        name: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      },
      requestDate: simpleDateFromDate(parseDate(application.requestedDate)),
      activity: {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        activityName: activity.description,
      },
      requester: application.requestedBy,
      status: application.status,
      comment: application.comments,
      createdTime: application.creationTime,
    }

    return res.render(`pages/activities/waitlist-application/view-application`, {
      prisoner: req.session.waitListApplicationJourney.prisoner,
      requestDate: parseDate(application.requestedDate),
      activityName: activity.description,
      requester: application.requestedBy,
      comment: application.comments,
      status: application.status,
      lastUpdated: application.updatedTime || application.creationTime,
      activityId: application.activityId,
      isMostRecent,
      isNotAlreadyAllocated,
    })
  }
}
