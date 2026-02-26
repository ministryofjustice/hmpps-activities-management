import { NextFunction, Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import {
  asString,
  formatDate,
  formatFirstLastName,
  formatStringToTitleCase,
  getScheduleIdFromActivity,
  parseDate,
} from '../../../../../utils/utils'
import {
  Activity,
  WaitingListApplication,
  WaitingListApplicationHistory,
} from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import WaitlistRequester from '../../../../../enum/waitlistRequester'
import config from '../../../../../config'
import UserService from '../../../../../services/userService'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'

export default class ViewApplicationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  private formatStatus(status: string): string {
    if (status === 'DECLINED') {
      return 'Rejected'
    }
    return formatStringToTitleCase(status)
  }

  private getHistoryWithChanges(
    history: WaitingListApplicationHistory[],
    application: WaitingListApplication,
    userMap: UserDetails,
  ): (WaitingListApplicationHistory & { change: string; note: string; userHistoryDetails: UserDetails })[] {
    const sortedHistory = history.sort((a, b) => {
      return new Date(b.updatedDateTime).getTime() - new Date(a.updatedDateTime).getTime()
    })

    return sortedHistory.map((item, index) => {
      const change: string[] = []
      const note: string[] = []
      const userHistoryDetails = userMap

      if (index < sortedHistory.length - 1) {
        const previousItem = sortedHistory[index + 1]
        if (item.status !== previousItem.status) {
          change.push('Status changed')
          note.push(`Changed from ${this.formatStatus(previousItem.status)} to ${this.formatStatus(item.status)}`)
        }
        if (item.comments !== previousItem.comments) {
          change.push('Comments changed')
          note.push(`Previous comment: ${previousItem.comments || 'None'}`)
        }
        if (item.requestedBy !== previousItem.requestedBy) {
          change.push('Requester changed')
          note.push(
            `Changed from ${WaitlistRequester.valueOf(previousItem.requestedBy)} to ${WaitlistRequester.valueOf(item.requestedBy)}`,
          )
        }
        if (item.applicationDate !== previousItem.applicationDate) {
          change.push('Date of request changed')
          note.push(
            `Changed from ${formatDate(previousItem.applicationDate, 'd MMMM yyyy')} to ${formatDate(item.applicationDate, 'd MMMM yyyy')}`,
          )
        }
      } else if (application.creationTime === item.updatedDateTime) {
        change.push('Application logged')
      } else {
        change.push('Application updated')
        note.push(
          'Full details are not available for the first change after December 2025. You can check with who made the change.',
        )
      }

      return {
        ...item,
        userHistoryDetails,
        change: change.length > 1 ? 'Status and comments changed' : change[0],
        note: note.join('<br>'),
      }
    })
  }

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { waitlistWithdrawnEnabled } = config
    let historyWithChanges = []

    let journeyEntry = req.query.journeyEntry ? asString(req.query.journeyEntry) : null
    journeyEntry ??= req.journeyData?.waitListApplicationJourney?.journeyEntry

    // Ensure link back to waitlist tab on prisoner allocations page - anything after the # is not sent in query params
    if (journeyEntry && journeyEntry.includes('prisoner-allocations')) journeyEntry += '#prisoner-waitlist-tab'

    const application = await this.activitiesService.fetchWaitlistApplication(+applicationId, user)

    const [prisoner, activity, allApplications]: [Prisoner, Activity, WaitingListApplication[]] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(application.prisonerNumber, user),
      this.activitiesService.getActivity(application.activityId, user),
      this.activitiesService.fetchActivityWaitlist(application.scheduleId, false, user),
    ])

    const userMap = await this.userService.getUserMap([application.createdBy], user)
    const userHistoryDetails = userMap.get(application.createdBy)

    if (waitlistWithdrawnEnabled) {
      const history = await this.activitiesService.fetchWaitlistApplicationHistory(+applicationId, user)
      historyWithChanges = this.getHistoryWithChanges(history, application, userHistoryDetails)
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
          change: 'Application logged',
          userHistoryDetails,
        })
      }
    }

    const appHistoryStartDate = new Date('2025-12-01T00:00:00')

    const createdAppPreHistory = new Date(application.creationTime) < appHistoryStartDate

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
      createdAppPreHistory,
    })
  }
}
