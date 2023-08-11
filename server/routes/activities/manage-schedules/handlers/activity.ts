import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import PrisonService from '../../../../services/prisonService'
import activitySessionToDailyTimeSlots from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import { getTimeSlotFromTime } from '../../../../utils/utils'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityId = +req.params.activityId
    const activity = await this.activitiesService.getActivity(activityId, user)

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
    } as unknown as SimpleDate
    if (activity.endDate) {
      req.session.createJourney.endDate = {
        day: Number(activity.endDate.substring(8, 10)),
        month: Number(activity.endDate.substring(5, 7)),
        year: Number(activity.endDate.substring(0, 4)),
      } as unknown as SimpleDate
    }
    req.session.createJourney.minimumIncentiveLevel = activity.minimumIncentiveLevel
    const activitySchedule = activity.schedules[0]

    req.session.createJourney.scheduleWeeks = activitySchedule.scheduleWeeks
    req.session.createJourney.slots ??= {}
    activitySchedule.slots.forEach(slot => {
      daysOfWeek.forEach(day => {
        const dayLowerCase = day.toLowerCase()
        req.session.createJourney.slots[slot.weekNumber] ??= {
          days: [],
        }
        req.session.createJourney.slots[slot.weekNumber][`timeSlots${day}`] ??= []

        if (slot[`${dayLowerCase}Flag`]) {
          req.session.createJourney.slots[slot.weekNumber].days.push(dayLowerCase)
          req.session.createJourney.slots[slot.weekNumber][`timeSlots${day}`].push(
            getTimeSlotFromTime(slot.startTime).toUpperCase(),
          )
        }
      })
    })
    req.session.createJourney.runsOnBankHoliday = activitySchedule.runsOnBankHoliday
    if (activitySchedule.internalLocation) {
      req.session.createJourney.location = {
        id: activitySchedule.internalLocation.id,
        name: activitySchedule.internalLocation.description,
      }
    }
    req.session.createJourney.currentCapacity = activitySchedule.capacity
    req.session.createJourney.capacity = activitySchedule.capacity
    req.session.createJourney.allocationCount = allocationCount
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
      this.activitiesService.getDefaultScheduleOfActivity(activity, user),
    ])

    const richStartDate = plainToInstance(SimpleDate, req.session.createJourney.startDate).toRichDate()
    const currentWeek = calcCurrentWeek(richStartDate, req.session.createJourney.scheduleWeeks)

    res.render('pages/activities/manage-schedules/view-activity', {
      activity,
      schedule,
      dailySlots: activitySessionToDailyTimeSlots(
        req.session.createJourney.scheduleWeeks,
        req.session.createJourney.slots,
      ),
      incentiveLevelPays,
      attendanceCount,
      currentWeek,
    })
  }
}
