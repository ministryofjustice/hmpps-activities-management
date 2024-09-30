import { Request, Response } from 'express'
import { plainToInstance, Transform } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { createSessionSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { DaysAndSlotsInRegime } from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { PrisonRegime } from '../../../../@types/activitiesAPI/types'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'

export class RegimeTimes {
  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  startTimes: Map<string, SimpleTime>

  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  endTimes: Map<string, SimpleTime>
}

export default class RegimeChangeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const regimeSlots = await this.getDaysAndSlots(regimeTimes)

    res.render('pages/activities/administration/regime-times', {
      regimeTimes,
      regimeSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startTimes, endTimes }: RegimeTimes = req.body

    const startTimesObj = Array.from(startTimes.keys()).reduce((acc, key) => {
      acc[key] = startTimes.get(key)
      return acc
    }, {})

    const endTimesObj = Array.from(endTimes.keys()).reduce((acc, key) => {
      acc[key] = endTimes.get(key)
      return acc
    }, {})
    req.body.startTimes = startTimesObj
    req.body.endTimes = endTimesObj

    const currentRegimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const updatedRegimeTimes: PrisonRegime[] = getPrisonRegimes(startTimes, endTimes, currentRegimeTimes)

    await this.activitiesService.updatePrisonRegime(updatedRegimeTimes, user.activeCaseLoadId, user)
    const successMessage = `You've updated the regime schedule`
    return res.redirectWithSuccess(`/activities/admin`, 'Regime updated', successMessage)
  }

  private getDaysAndSlots = async (regimeTimes: PrisonRegime[]): Promise<Map<string, DaysAndSlotsInRegime[]>> => {
    const regimeSlots = new Map<string, DaysAndSlotsInRegime[]>()

    regimeSlots.set('prisonRegimeTimes', createSessionSlots(regimeTimes))

    return regimeSlots
  }
}

export function getPrisonRegimes(
  startTimes: Map<string, SimpleTime>,
  endTimes: Map<string, SimpleTime>,
  currentRegimeTimes: PrisonRegime[],
): PrisonRegime[] {
  const prisonRegimeTimes = currentRegimeTimes
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  const amendedRegimeTimes: PrisonRegime[] = []

  daysOfWeek.forEach(day => {
    const dayRegime: PrisonRegime = prisonRegimeTimes.filter(regime => regime.dayOfWeek === day)[0]
    const newRegimeTimes: PrisonRegime = {
      id: dayRegime.id,
      prisonCode: dayRegime.prisonCode,
      amStart: startTimes.get(`prisonRegimeTimes-${day}-AM`).toIsoString(),
      amFinish: endTimes.get(`prisonRegimeTimes-${day}-AM`).toIsoString(),
      pmStart: startTimes.get(`prisonRegimeTimes-${day}-PM`).toIsoString(),
      pmFinish: endTimes.get(`prisonRegimeTimes-${day}-PM`).toIsoString(),
      edStart: startTimes.get(`prisonRegimeTimes-${day}-ED`).toIsoString(),
      edFinish: endTimes.get(`prisonRegimeTimes-${day}-ED`).toIsoString(),
      dayOfWeek: dayRegime.dayOfWeek,
    }
    amendedRegimeTimes.push(newRegimeTimes)
  })

  return amendedRegimeTimes
}
