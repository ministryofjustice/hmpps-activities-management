import { Request, Response } from 'express'
import { addHours, startOfDay } from 'date-fns'

export default class CalendarSpikeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : new Date()

    // Mocked up some data - this will come from API in reality
    const activities = [
      {
        start: addHours(startOfDay(new Date('2022-12-13')), 13),
        end: addHours(startOfDay(new Date('2022-12-13')), 15),
        description: 'Maths',
      },
      {
        start: addHours(startOfDay(new Date('2022-12-13')), 9),
        end: addHours(startOfDay(new Date('2022-12-13')), 10),
        description: 'Literature and mathematics with social studies',
      },
      {
        start: addHours(startOfDay(new Date('2022-12-13')), 9),
        end: addHours(startOfDay(new Date('2022-12-13')), 10),
        description: 'Barbering',
        isClashing: true,
      },
      {
        start: addHours(startOfDay(new Date('2022-12-15')), 9),
        end: addHours(startOfDay(new Date('2022-12-15')), 10),
        description: 'Gym',
      },
    ]

    res.render('pages/spikes/calendarSpike', { referenceDate, activities })
  }
}
