import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import { formatDate } from '../../../../utils/utils'
import { ActivityScheduleCreateRequest, Slot } from '../../../../@types/activitiesAPI/types'
import { CreateScheduleJourney } from '../journey'

function mapSlots(createScheduleJourney: CreateScheduleJourney) {
  const slots = [] as Slot[]
  const slotMap: Map<string, Slot> = new Map()
  const setSlot = (key: string, property: string) => {
    if (slotMap.has(key)) {
      slotMap.get(key)[property] = true
    } else {
      slotMap.set(key, { timeSlot: key } as Slot)
      slotMap.get(key)[property] = true
    }
  }

  createScheduleJourney.days.forEach(d => {
    function slotSetter() {
      return (ts: string) => {
        switch (ts) {
          case 'AM':
            setSlot('AM', d)
            break
          case 'PM':
            setSlot('PM', d)
            break
          case 'ED':
            setSlot('ED', d)
            break
          default:
          // no action
        }
      }
    }

    switch (d) {
      case 'monday':
        if (createScheduleJourney.timeSlotsMonday) {
          createScheduleJourney.timeSlotsMonday.forEach(slotSetter())
        }
        break
      case 'tuesday':
        if (createScheduleJourney.timeSlotsTuesday) {
          createScheduleJourney.timeSlotsTuesday.forEach(slotSetter())
        }
        break
      case 'wednesday':
        if (createScheduleJourney.timeSlotsWednesday) {
          createScheduleJourney.timeSlotsWednesday.forEach(slotSetter())
        }
        break
      case 'thursday':
        if (createScheduleJourney.timeSlotsThursday) {
          createScheduleJourney.timeSlotsThursday.forEach(slotSetter())
        }
        break
      case 'friday':
        if (createScheduleJourney.timeSlotsFriday) {
          createScheduleJourney.timeSlotsFriday.forEach(slotSetter())
        }
        break
      case 'saturday':
        if (createScheduleJourney.timeSlotsSaturday) {
          createScheduleJourney.timeSlotsSaturday.forEach(slotSetter())
        }
        break
      case 'sunday':
        if (createScheduleJourney.timeSlotsSunday) {
          createScheduleJourney.timeSlotsSunday.forEach(slotSetter())
        }
        break
      default:
    }
  })

  slotMap.forEach(slot => {
    slots.push(slot)
  })
  return slots
}

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { createScheduleJourney } = req.session
    const startDate = formatDate(
      plainToInstance(SimpleDate, createScheduleJourney.startDate).toRichDate(),
      'do MMMM yyyy',
    )
    const endDate = createScheduleJourney.endDate
      ? formatDate(plainToInstance(SimpleDate, createScheduleJourney.endDate).toRichDate(), 'do MMMM yyyy')
      : 'Not set'

    const times = {
      monday: createScheduleJourney.timeSlotsMonday ? createScheduleJourney.timeSlotsMonday.join(' ') : undefined,
      tuesday: createScheduleJourney.timeSlotsTuesday ? createScheduleJourney.timeSlotsTuesday.join(' ') : undefined,
      wednesday: createScheduleJourney.timeSlotsWednesday
        ? createScheduleJourney.timeSlotsWednesday.join(' ')
        : undefined,
      thursday: createScheduleJourney.timeSlotsThursday ? createScheduleJourney.timeSlotsThursday.join(' ') : undefined,
      friday: createScheduleJourney.timeSlotsFriday ? createScheduleJourney.timeSlotsFriday.join(' ') : undefined,
      saturday: createScheduleJourney.timeSlotsSaturday ? createScheduleJourney.timeSlotsSaturday.join(' ') : undefined,
      sunday: createScheduleJourney.timeSlotsSunday ? createScheduleJourney.timeSlotsSunday.join(' ') : undefined,
    }

    res.render('pages/manage-schedules/create-schedule/check-answers', {
      startDate,
      endDate,
      days: createScheduleJourney.days,
      times,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityId = req.params.id as unknown as number
    const { createScheduleJourney } = req.session
    const slots = mapSlots(createScheduleJourney)

    const activitySchedule = {
      description: createScheduleJourney.name,
      startDate: formatDate(plainToInstance(SimpleDate, createScheduleJourney.startDate).toRichDate(), 'yyyy-MM-dd'),
      endDate: createScheduleJourney.endDate
        ? formatDate(plainToInstance(SimpleDate, createScheduleJourney.endDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
      locationId: createScheduleJourney.location.id,
      capacity: createScheduleJourney.capacity,
      slots,
      runsOnBankHoliday: createScheduleJourney.runsOnBankHoliday,
    } as ActivityScheduleCreateRequest

    const response = await this.activitiesService.createScheduleActivity(activityId, activitySchedule, user)
    res.redirect(`confirmation/${response.id}`)
  }
}
