import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import PrisonService from '../../../../services/prisonService'
import { scheduleSlotsToDailyTimeSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { getTimeSlotFromTime } from '../../../../utils/utils'
import AttendanceStatus from '../../../../enum/attendanceStatus'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityId = +req.params.activityId
    const activity = await this.activitiesService.getActivity(activityId, user)

    let attendanceCount = 0
    let allocationCount = 0

    activity.schedules.forEach(schedule => {
      allocationCount += schedule.allocations.length
      schedule.instances.forEach(instance => {
        instance.attendances.forEach(attendance => {
          if (attendance.status !== AttendanceStatus.WAITING) {
            attendanceCount += 1
          }
        })
      })
    })

    req.session.createJourney = {}
    req.session.createJourney.activityId = activity.id
    req.session.createJourney.category = activity.category
    req.session.createJourney.name = activity.summary
    req.session.createJourney.inCell = activity.inCell
    req.session.createJourney.onWing = activity.onWing
    req.session.createJourney.riskLevel = activity.riskLevel
    req.session.createJourney.startDate = {
      day: Number(activity.startDate.substring(8, 10)),
      month: Number(activity.startDate.substring(5, 7)),
      year: Number(activity.startDate.substring(0, 4)),
      toIsoString(): string {
        return undefined
      },
      toRichDate(): Date {
        return undefined
      },
      toString(): string {
        return ''
      },
    }
    if (activity.endDate) {
      req.session.createJourney.endDate = {
        day: Number(activity.endDate.substring(8, 10)),
        month: Number(activity.endDate.substring(5, 7)),
        year: Number(activity.endDate.substring(0, 4)),
        toIsoString(): string {
          return undefined
        },
        toRichDate(): Date {
          return undefined
        },
        toString(): string {
          return ''
        },
      }
    }
    req.session.createJourney.minimumIncentiveLevel = activity.minimumIncentiveLevel
    req.session.createJourney.days = []
    req.session.createJourney.timeSlotsMonday = []
    req.session.createJourney.timeSlotsTuesday = []
    req.session.createJourney.timeSlotsWednesday = []
    req.session.createJourney.timeSlotsThursday = []
    req.session.createJourney.timeSlotsFriday = []
    req.session.createJourney.timeSlotsSaturday = []
    req.session.createJourney.timeSlotsSunday = []
    activity.schedules.forEach(schedule =>
      schedule.slots.forEach(slot => {
        if (slot.mondayFlag) {
          req.session.createJourney.days.push('monday')
          req.session.createJourney.timeSlotsMonday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.tuesdayFlag) {
          req.session.createJourney.days.push('tuesday')
          req.session.createJourney.timeSlotsTuesday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.wednesdayFlag) {
          req.session.createJourney.days.push('wednesday')
          req.session.createJourney.timeSlotsWednesday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.thursdayFlag) {
          req.session.createJourney.days.push('thursday')
          req.session.createJourney.timeSlotsThursday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.fridayFlag) {
          req.session.createJourney.days.push('friday')
          req.session.createJourney.timeSlotsFriday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.saturdayFlag) {
          req.session.createJourney.days.push('saturday')
          req.session.createJourney.timeSlotsSaturday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        if (slot.sundayFlag) {
          req.session.createJourney.days.push('sunday')
          req.session.createJourney.timeSlotsSunday.push(getTimeSlotFromTime(slot.startTime).toUpperCase())
        }
        req.session.createJourney.runsOnBankHoliday = schedule.runsOnBankHoliday
        if (schedule.internalLocation) {
          req.session.createJourney.location = {
            id: schedule.internalLocation.id,
            name: schedule.internalLocation.description,
          }
        }
        req.session.createJourney.currentCapacity = schedule.capacity
        req.session.createJourney.capacity = schedule.capacity
        req.session.createJourney.allocationCount = allocationCount
      }),
    )
    req.session.createJourney.pay = []
    activity.pay.forEach(pay => {
      req.session.createJourney.pay.push({
        incentiveNomisCode: pay.incentiveNomisCode,
        incentiveLevel: pay.incentiveLevel,
        rate: pay.rate,
        bandId: pay.prisonPayBand.id,
        bandAlias: pay.prisonPayBand.alias,
        displaySequence: pay.prisonPayBand.displaySequence,
      })
    })
    req.session.createJourney.educationLevels = activity.minimumEducationLevel

    const [incentiveLevelPays, schedule] = await Promise.all([
      this.helper.getPayGroupedByIncentiveLevel(req.session.createJourney.pay, user, activity),
      this.activitiesService.getDefaultScheduleOfActivity(activity, user).then(s => ({
        ...s,
        dailySlots: scheduleSlotsToDailyTimeSlots(s.slots),
      })),
    ])

    res.render('pages/activities/manage-schedules/view-activity', {
      activity,
      schedule,
      incentiveLevelPays,
      attendanceCount,
    })
  }
}
