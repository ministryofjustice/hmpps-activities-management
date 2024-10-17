import { Request, Response } from 'express'
import { plainToInstance, Transform } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { createSessionSlots, mapActivityScheduleSlotsToSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { DaysAndSlotsInRegime } from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Activity, ActivityUpdateRequest, PrisonRegime, Slot } from '../../../../@types/activitiesAPI/types'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { ServiceUser } from '../../../../@types/express'

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
    const defaultRegime = this.defaultPrisonRegime(user.activeCaseLoadId)

    let createMode = false
    let regimeTimes
    try {
      regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    } catch (error) {
      if (error.status === 404) regimeTimes = defaultRegime
      createMode = true
    }

    const regimeSlots = await this.getDaysAndSlots(regimeTimes)

    res.render('pages/activities/administration/regime-times', {
      regimeTimes,
      regimeSlots,
      createMode,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startTimes, endTimes }: RegimeTimes = req.body
    const defaultRegime = this.defaultPrisonRegime(user.activeCaseLoadId)

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

    let regimeTimes
    try {
      regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    } catch (error) {
      if (error.status === 404) regimeTimes = defaultRegime
    }

    const updatedRegimeTimes: PrisonRegime[] = getPrisonRegimes(startTimes, endTimes, regimeTimes)

    // validate slots
    if (this.validateSlots(updatedRegimeTimes, res)) {
      return res.validationFailed()
    }

    await this.activitiesService.updatePrisonRegime(updatedRegimeTimes, user.activeCaseLoadId, user)

    await this.updateActivities(user)

    const successMessage = `You've updated the regime schedule`
    return res.redirectWithSuccess(`/activities/admin`, 'Regime updated', successMessage)
  }

  // the activity slots need updating to represent the new prison regimes and correct future sessions
  updateActivities = async (user: ServiceUser): Promise<void> => {
    // update activities to recreate the scheduled instances with the new session times
    const activities = await this.activitiesService.getActivities(false, user)

    const filterActivities = activities.filter(act => act.activityState === 'LIVE')

    // eslint-disable-next-line no-restricted-syntax
    for (const act of filterActivities) {
      // eslint-disable-next-line no-await-in-loop
      const activity: Activity = await this.activitiesService.getActivity(act.id, user)
      if (activity.schedules[0].usePrisonRegimeTime === true) {
        const slots: Slot[] = mapActivityScheduleSlotsToSlots(activity.schedules[0].slots)
        // eslint-disable-next-line no-await-in-loop
        await this.activitiesService.updateActivity(
          act.id,
          {
            slots,
          } as ActivityUpdateRequest,
          user,
        )
      }
    }
  }

  private validateSlots(updatedRegimeTimes: PrisonRegime[], res: Response): boolean {
    let failed = false
    const slotsWithStartAfterEndAm: PrisonRegime[] = updatedRegimeTimes.filter(
      regimeSlot => regimeSlot.amStart.localeCompare(regimeSlot.amFinish) >= 0,
    )

    const slotsWithStartAfterEndPm: PrisonRegime[] = updatedRegimeTimes.filter(
      regimeSlot => regimeSlot.pmStart.localeCompare(regimeSlot.pmFinish) >= 0,
    )

    const slotsWithStartAfterEndEd: PrisonRegime[] = updatedRegimeTimes.filter(
      regimeSlot => regimeSlot.edStart.localeCompare(regimeSlot.edFinish) >= 0,
    )

    const slotsWithStartTimesAfterEarlierSession: PrisonRegime[] = updatedRegimeTimes.filter(
      regimeSlot =>
        regimeSlot.amStart.localeCompare(regimeSlot.pmStart) >= 0 ||
        regimeSlot.pmStart.localeCompare(regimeSlot.edStart) >= 0 ||
        regimeSlot.amStart.localeCompare(regimeSlot.edStart) >= 0,
    )

    if (slotsWithStartTimesAfterEarlierSession.length > 0) {
      slotsWithStartTimesAfterEarlierSession.forEach(regimeSlot => {
        res.addValidationError(
          `startTimes-prisonRegimeTimes-${regimeSlot.dayOfWeek}-AM`,
          'Start time must be before any later session start times',
        )
      })
      failed = true
    }

    if (slotsWithStartAfterEndAm.length > 0) {
      slotsWithStartAfterEndAm.forEach(regimeSlotAM => {
        res.addValidationError(
          `endTimes-prisonRegimeTimes-${regimeSlotAM.dayOfWeek}-AM`,
          'Select an end time after the start time',
        )
      })
      failed = true
    }

    if (slotsWithStartAfterEndPm.length > 0) {
      slotsWithStartAfterEndPm.forEach(regimeSlotPM => {
        res.addValidationError(
          `endTimes-prisonRegimeTimes-${regimeSlotPM.dayOfWeek}-PM`,
          'Select an end time after the start time',
        )
      })
      failed = true
    }

    if (slotsWithStartAfterEndEd.length > 0) {
      slotsWithStartAfterEndEd.forEach(regimeSlotED => {
        res.addValidationError(
          `endTimes-prisonRegimeTimes-${regimeSlotED.dayOfWeek}-ED`,
          'Select an end time after the start time',
        )
      })
      failed = true
    }
    return failed
  }

  private getDaysAndSlots = async (regimeTimes: PrisonRegime[]): Promise<Map<string, DaysAndSlotsInRegime[]>> => {
    const regimeSlots = new Map<string, DaysAndSlotsInRegime[]>()

    regimeSlots.set('prisonRegimeTimes', createSessionSlots(regimeTimes))

    return regimeSlots
  }

  private defaultPrisonRegime(prisonCode: string): PrisonRegime[] {
    return [
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'MONDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'TUESDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'WEDNESDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'THURSDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'FRIDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'SATURDAY',
      },
      {
        id: 0,
        prisonCode,
        amStart: '-',
        amFinish: '-',
        pmStart: '-',
        pmFinish: '-',
        edStart: '-',
        edFinish: '-',
        dayOfWeek: 'SUNDAY',
      },
    ]
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
