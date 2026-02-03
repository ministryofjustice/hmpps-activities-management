import { NextFunction, Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { asString, formatFirstLastName, getScheduleIdFromActivity, parseDate } from '../../../../../utils/utils'
import {
  Activity,
  WaitingListApplication,
  WaitingListApplicationHistory,
} from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import WaitlistRequester from '../../../../../enum/waitlistRequester'

export default class ViewApplicationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  private getHistoryWithChanges(
    history: WaitingListApplicationHistory[],
    application: WaitingListApplication,
  ): (WaitingListApplicationHistory & { change: string; note: string })[] {
    const sortedHistory = history.sort((a, b) => {
      return new Date(b.updatedDateTime).getTime() - new Date(a.updatedDateTime).getTime()
    })

    return sortedHistory.map((item, index) => {
      let change: string = ''
      let note: string = ''

      if (index < sortedHistory.length - 1) {
        const previousItem = sortedHistory[index + 1]
        if (item.status !== previousItem.status) {
          change = 'Status changed'
          note = `Changed from ${previousItem.status} to ${item.status}`
        } else if (item.comments !== previousItem.comments) {
          change = 'Comments changed'
          note = `Previous comment: "${previousItem.comments || ''}"`
        } else if (item.requestedBy !== previousItem.requestedBy) {
          change = 'Requester changed'
          note = `Changed from ${previousItem.requestedBy} to ${item.requestedBy}`
        } else if (item.applicationDate !== previousItem.applicationDate) {
          change = 'Date of request changed'
          note = `Changed from ${previousItem.applicationDate} to ${item.applicationDate}`
        }
      } else if (application.creationTime === item.updatedDateTime) {
        change = 'Application Logged'
      } else {
        change = 'Application Updated'
      }

      return {
        ...item,
        change,
        note,
      }
    })
  }

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals

    let journeyEntry = req.query.journeyEntry ? asString(req.query.journeyEntry) : null
    journeyEntry ??= req.journeyData?.waitListApplicationJourney?.journeyEntry

    // Ensure link back to waitlist tab on prisoner allocations page - anything after the # is not sent in query params
    if (journeyEntry && journeyEntry.includes('prisoner-allocations')) journeyEntry += '#prisoner-waitlist-tab'

    const application = await this.activitiesService.fetchWaitlistApplication(+applicationId, user)
    const history = await this.activitiesService.fetchWaitlistApplicationHistory(+applicationId, user)

    const [prisoner, activity, allApplications]: [Prisoner, Activity, WaitingListApplication[]] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(application.prisonerNumber, user),
      this.activitiesService.getActivity(application.activityId, user),
      this.activitiesService.fetchActivityWaitlist(application.scheduleId, false, user),
    ])

    const historyWithChanges = this.getHistoryWithChanges(history, application)
    if (
      historyWithChanges.length === 0 ||
      historyWithChanges[historyWithChanges.length - 1].updatedDateTime !== application.creationTime
    ) {
      historyWithChanges.push({
        id: application.id,
        status: application.status,
        applicationDate: application.requestedDate,
        requestedBy: application.requestedBy,
        comments: application.comments || '',
        updatedBy: application.createdBy,
        updatedDateTime: application.creationTime,
        note: '',
        change: 'Application Logged',
      })
    }

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

    req.journeyData.waitListApplicationJourney = {
      prisoner: {
        prisonerNumber: prisoner.prisonerNumber,
        name: formatFirstLastName(prisoner.firstName, prisoner.lastName),
      },
      requestDate: application.requestedDate,
      activity: {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        activityName: activity.description,
      },
      requester: application.requestedBy,
      status: application.status,
      comment: application.comments,
      createdTime: application.creationTime,
      journeyEntry,
    }

    return res.render(`pages/activities/waitlist-application/view-application`, {
      prisoner: req.journeyData.waitListApplicationJourney.prisoner,
      requestDate: parseDate(application.requestedDate),
      activityName: activity.description,
      requester: WaitlistRequester.valueOf(application.requestedBy),
      comment: application.comments,
      status: application.status,
      statusUpdatedTime: application.statusUpdatedTime,
      activityId: application.activityId,
      isMostRecent,
      isNotAlreadyAllocated,
      journeyEntry,
      history: historyWithChanges,
    })
  }
}
