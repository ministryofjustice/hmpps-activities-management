import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator'
import { format, subDays } from 'date-fns'
import logger from '../../../../logger'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import ActivitiesService from '../../../services/activitiesService'

enum PresetDateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

enum ActivitySlotOptions {
  AM = 'am',
  PM = 'pm',
  ED = 'ed',
}

export class DateAndLocation {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date for the unlock list' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  date: SimpleDate

  @Expose()
  @IsIn(Object.values(ActivitySlotOptions), { message: 'Select a time slot' })
  activitySlot: string

  @Expose()
  @IsNotEmpty({ message: 'Select one or more locations' })
  locations: string[]
}

export default class SelectDateAndLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const {
      datePresetOption = null,
      date = null,
      slot = null,
      locations = null,
    } = req.query ? req.query : { datePresetOption: null }

    const selectedLocations: string[] = typeof locations === 'string' ? locations?.split(',') : []
    const simpleDate = date !== null ? this.convertToSimpleDate(`${date}`) : null

    logger.info(`Query params ${datePresetOption} ${date} ${slot} ${selectedLocations} ${simpleDate}`)

    const locationGroups = await this.activitiesService.getLocationGroups(user.activeCaseLoadId, user)

    res.render('pages/unlock-list/select-date-and-location', {
      datePresetOption,
      simpleDate,
      slot,
      selectedLocations,
      locationGroups,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    logger.info(`Posted values are ${JSON.stringify(req.body)}`)

    const selectedDate = this.getDateValue(req)

    return res.redirect(
      `?datePresetOption=${req.body.datePresetOption}` +
        `&date=${selectedDate}` +
        `&slot=${req.body.activitySlot}` +
        `&locations=${req.body.locations}`,
    )
  }

  private getDateValue = (req: Request): string => {
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      return this.formatDate(new Date())
    }
    if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return this.formatDate(subDays(new Date(), 1)).toString()
    }
    return req.body.date
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')

  private convertToSimpleDate = (date: string): SimpleDate => {
    const dateParts = date.split('-')
    const body = {
      day: dateParts[2],
      month: dateParts[1],
      year: dateParts[0],
    }
    return plainToInstance(SimpleDate, body)
  }
}
