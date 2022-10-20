import { Request, Response } from 'express'
import { mapToTableRow } from './activityListHelper'

export default class ActivityListRouteHandler {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityScheduleAllocations } = res.locals
    const viewContext = {
      locationId: req.query.locationId,
      date: req.query.date as string,
      period: req.query.period as string,
      rowData: activityScheduleAllocations.map(mapToTableRow),
    }
    res.render('pages/activityListAm/index', viewContext)
  }
}
