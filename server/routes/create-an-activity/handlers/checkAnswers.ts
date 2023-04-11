import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityCreateRequest, Slot } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import { CreateAnActivityJourney } from '../journey'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import { formatDate } from '../../../utils/utils'

export default class CheckAnswersRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(req, user)
    const startDate = formatDate(plainToInstance(SimpleDate, createJourney.startDate).toRichDate(), 'do MMMM yyyy')
    const endDate = createJourney.endDate
      ? formatDate(plainToInstance(SimpleDate, createJourney.endDate).toRichDate(), 'do MMMM yyyy')
      : 'Not set'
    const flatPay = req.session.createJourney.flat
    res.render(`pages/create-an-activity/check-answers`, {
      incentiveLevelPays,
      times: {
        monday: createJourney.timeSlotsMonday,
        tuesday: createJourney.timeSlotsTuesday,
        wednesday: createJourney.timeSlotsWednesday,
        thursday: createJourney.timeSlotsThursday,
        friday: createJourney.timeSlotsFriday,
        saturday: createJourney.timeSlotsSaturday,
        sunday: createJourney.timeSlotsSunday,
      },
      startDate,
      endDate,
      flatPay,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session

    const slots = this.mapSlots(createJourney)

    const activity = {
      prisonCode: user.activeCaseLoadId,
      summary: createJourney.name,
      categoryId: createJourney.category.id,
      riskLevel: createJourney.riskLevel,
      minimumIncentiveNomisCode: createJourney.minimumIncentiveNomisCode,
      minimumIncentiveLevel: createJourney.minimumIncentiveLevel,
      pay: createJourney.pay.map(pay => ({
        incentiveNomisCode: pay.incentiveNomisCode,
        incentiveLevel: pay.incentiveLevel,
        payBandId: pay.bandId,
        rate: pay.rate,
      })),
      minimumEducationLevel: createJourney.educationLevels?.map(educationLevel => ({
        educationLevelCode: educationLevel.educationLevelCode,
        educationLevelDescription: educationLevel.educationLevelDescription,
      })),
      description: createJourney.name,
      startDate: formatDate(plainToInstance(SimpleDate, createJourney.startDate).toRichDate(), 'yyyy-MM-dd'),
      endDate: createJourney.endDate
        ? formatDate(plainToInstance(SimpleDate, createJourney.endDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
      locationId: createJourney.location.id,
      capacity: createJourney.capacity,
      slots,
      runsOnBankHoliday: createJourney.runsOnBankHoliday,
    } as ActivityCreateRequest

    if (createJourney.flat && createJourney.flat.length > 0) {
      const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

      createJourney.flat.forEach(flatRate => {
        incentiveLevels.forEach(iep =>
          activity.pay.push({
            incentiveNomisCode: iep.iepLevel,
            incentiveLevel: iep.iepDescription,
            payBandId: flatRate.bandId,
            rate: flatRate.rate,
          }),
        )
      })
    }

    const response = await this.activitiesService.createActivity(activity, user)

    res.redirect(`confirmation/${response.schedules[0].id}`)
  }

  private mapSlots = (createJourney: CreateAnActivityJourney) => {
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

    createJourney.days.forEach(d => {
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
          if (createJourney.timeSlotsMonday) {
            createJourney.timeSlotsMonday.forEach(slotSetter())
          }
          break
        case 'tuesday':
          if (createJourney.timeSlotsTuesday) {
            createJourney.timeSlotsTuesday.forEach(slotSetter())
          }
          break
        case 'wednesday':
          if (createJourney.timeSlotsWednesday) {
            createJourney.timeSlotsWednesday.forEach(slotSetter())
          }
          break
        case 'thursday':
          if (createJourney.timeSlotsThursday) {
            createJourney.timeSlotsThursday.forEach(slotSetter())
          }
          break
        case 'friday':
          if (createJourney.timeSlotsFriday) {
            createJourney.timeSlotsFriday.forEach(slotSetter())
          }
          break
        case 'saturday':
          if (createJourney.timeSlotsSaturday) {
            createJourney.timeSlotsSaturday.forEach(slotSetter())
          }
          break
        case 'sunday':
          if (createJourney.timeSlotsSunday) {
            createJourney.timeSlotsSunday.forEach(slotSetter())
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
}
