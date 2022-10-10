import { Request, Response } from 'express'
import {
  getAlertValues,
  getMainEventSummary,
  getOtherEventsSummary,
  shouldShowOtherActivities,
} from './activityListHelper'
import { ActivityByLocation, ActivityListTableRow } from '../../../@types/dps'

export default class ActivityListRouteHandler {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityList } = res.locals

    const mapToTableRow = (activity: ActivityByLocation): ActivityListTableRow => {
      const alerts = getAlertValues(activity.alertFlags, activity.category)
      const mainEventSummary = getMainEventSummary(activity)
      const otherEventsSummary = shouldShowOtherActivities(activity) ? getOtherEventsSummary(activity) : ''

      return {
        name: `${activity.lastName.charAt(0) + activity.lastName.substring(1).toLowerCase()}, ${
          activity.firstName.charAt(0) + activity.firstName.substring(1).toLowerCase()
        }`,
        location: activity.cellLocation,
        prisonNumber: activity.offenderNo,
        relevantAlerts: alerts,
        activity: mainEventSummary,
        otherActivities: otherEventsSummary,
      }
    }
    const viewContext = {
      rowData: activityList.map(mapToTableRow),
    }
    res.render('pages/activityList/index', viewContext)
  }
}
