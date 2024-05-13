import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import { YesNo } from '../../../../@types/activities'
import { AppointmentJourneyMode } from '../appointmentJourney'

export enum HowToCopySeriesOptions {
  ONE_OFF = 'ONE_OFF',
  SERIES = 'SERIES',
}
export class HowToCopySeriesForm {
  @Expose()
  @IsEnum(HowToCopySeriesOptions, { message: 'You must select one option' })
  howToCopy: HowToCopySeriesOptions
}

export default class HowToCopySeriesRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/copy-series', {
      appointmentJourney,
      HowToCopySeriesOptions,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { howToCopy } = req.body
    const { appointmentJourney } = req.session

    if (HowToCopySeriesOptions[howToCopy] === HowToCopySeriesOptions.ONE_OFF) {
      appointmentJourney.repeat = YesNo.NO
    } else {
      appointmentJourney.repeat = YesNo.YES
    }

    appointmentJourney.mode = AppointmentJourneyMode.COPY

    res.redirect('schedule')
  }
}
