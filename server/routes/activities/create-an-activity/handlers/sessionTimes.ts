import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { journeySlotsToCustomSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { Slot } from '../../../../@types/activitiesAPI/types'

export class SessionTimes {
  // @Expose()
  // @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  // usePrisonRegimeTime: boolean
}

function getHardCodedCustomSlots(): Slot[] {
  return [
    {
      customStartTime: '09:15',
      customEndTime: '11:30',
      daysOfWeek: ['MONDAY'],
      friday: false,
      monday: true,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: 'AM',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customStartTime: '18:15',
      customEndTime: '21:45',
      daysOfWeek: ['MONDAY'],
      friday: false,
      monday: true,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: 'ED',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customStartTime: '14:45',
      customEndTime: '16:00',
      daysOfWeek: ['TUESDAY'],
      friday: false,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: 'PM',
      tuesday: true,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customSartTime: '07:30',
      customEndTime: '10:14',
      daysOfWeek: ['THURSDAY'],
      friday: false,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: true,
      timeSlot: 'AM',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customStartTime: '15:12',
      customEndTime: '16:35',
      daysOfWeek: ['THURSDAY'],
      friday: false,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: true,
      timeSlot: 'PM',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customStartTime: '18:56',
      customEndTime: '19:55',
      daysOfWeek: ['THURSDAY'],
      friday: false,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: true,
      timeSlot: 'ED',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
    {
      customStartTime: '21:03',
      customEndTime: '22:54',
      daysOfWeek: ['SATURDAY'],
      friday: false,
      monday: false,
      saturday: true,
      sunday: false,
      thursday: false,
      timeSlot: 'ED',
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    },
  ] as Slot[]
}

export default class SessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
    const slots: Slots = req.session.createJourney.slots['1']
    // TODO: implement real custom slots
    const customSlots: Slot[] = journeySlotsToCustomSlots(slots)

    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(regimeTimes, slots)

    res.render(`pages/activities/create-an-activity/session-times`, {
      regimeTimes: applicableRegimeTimesForActivity,
      customSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const customSlots: Slot[] = getHardCodedCustomSlots()
    req.session.createJourney.customSlots = customSlots

    res.redirectOrReturn('location')
  }
}
