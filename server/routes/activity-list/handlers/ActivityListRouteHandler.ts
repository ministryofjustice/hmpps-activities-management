import { Request, Response } from 'express'
import {
  getAlertValues,
  getMainEventSummary,
  getOtherEventsSummary,
  shouldShowOtherActivities,
} from './activityListHelper'
import { ActivityByLocation, ActivityListTableRow, OffenderActivityId } from '../../../@types/dps'
import PrisonService from '../../../services/prisonService'

export default class ActivityListRouteHandler {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityList } = res.locals

    const mapToTableRow = (activity: ActivityByLocation): ActivityListTableRow => {
      const alerts = getAlertValues(activity.alertFlags, activity.category)
      const mainEventSummary = getMainEventSummary(activity)
      const otherEventsSummary = shouldShowOtherActivities(activity) ? getOtherEventsSummary(activity) : ''

      return {
        bookingId: activity.bookingId,
        eventId: activity.eventId,
        name: `${activity.lastName.charAt(0) + activity.lastName.substring(1).toLowerCase()}, ${
          activity.firstName.charAt(0) + activity.firstName.substring(1).toLowerCase()
        }`,
        location: activity.cellLocation,
        prisonNumber: activity.offenderNo,
        relevantAlerts: alerts,
        activity: mainEventSummary,
        otherActivities: otherEventsSummary,
        attended: activity.attendanceInfo?.attended,
      }
    }
    const viewContext = {
      locationId: req.query.locationId,
      date: req.query.date as string,
      period: req.query.period as string,
      rowData: activityList.map(mapToTableRow),
    }
    res.render('pages/activityList/index', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationId, date, period } = req.body
    const activitiesAttended: OffenderActivityId[] = []
    const activitiesNotAttended: OffenderActivityId[] = []
    Object.entries(req.body).forEach(([key, value]) => {
      if (key.startsWith('attended-id-')) {
        const split = key.substring(12).split('-')
        const id = {
          bookingId: +split[0],
          activityId: +split[1],
        }
        if (value === 'yes') {
          activitiesAttended.push(id)
        } else {
          activitiesNotAttended.push(id)
        }
      }
    })

    if (activitiesAttended.length > 0) {
      await this.prisonService.batchUpdateAttendance(
        user.activeCaseLoad.caseLoadId,
        locationId,
        date,
        period,
        activitiesAttended,
        true,
        true,
        undefined,
        undefined,
        user,
      )
    }

    const params = new URLSearchParams({
      locationId,
      date,
      period,
    })

    if (activitiesNotAttended.length > 0) {
      req.session.data = {
        activitiesNotAttended,
      }
      return res.redirect(`/activity-list/absences?${params.toString()}`)
    }
    return res.redirect(`/activity-list?${params.toString()}`)
  }
}
