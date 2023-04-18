import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator'
import { EditApplyTo } from '../../../../@types/appointments'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'

export class Location {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  locationId: number

  @Expose()
  @IsEnum(EditApplyTo, { message: 'Select how the change should be applied' })
  applyTo: EditApplyTo
}

export default class LocationRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.prisonService.getLocationsForAppointments(user.activeCaseLoadId, user)

    res.render('pages/appointments/create-and-edit/location', {
      locations,
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const location = await this.getLocation(req, res)
    if (!location) return

    req.session.appointmentJourney.location = {
      id: location.locationId,
      description: location.userDescription,
    }

    res.redirectOrReturn(`date-and-time`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, occurrenceId } = req.params
    const { applyTo } = req.body

    const result = await this.getLocation(req, res)
    if (!result) return

    await this.activitiesService.editAppointmentOccurrence(
      +occurrenceId,
      {
        internalLocationId: result.locationId,
        applyTo,
      },
      user,
    )

    req.flash(
      'successMessage',
      JSON.stringify({
        message: `Appointment location changed successfully`,
      }),
    )

    res.redirectOrReturn(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }

  private getLocation = async (req: Request, res: Response) => {
    const { locationId } = req.body
    const { user } = res.locals

    const location = await this.prisonService
      .getLocationsForAppointments(user.activeCaseLoadId, user)
      .then(locations => locations.find(l => l.locationId === locationId))

    if (!location) {
      res.validationFailed('locationId', `Selected location not found`)
      return false
    }

    return location
  }
}
