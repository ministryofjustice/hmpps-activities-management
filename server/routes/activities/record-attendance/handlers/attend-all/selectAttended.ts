/* eslint-disable no-param-reassign */
import { Request, Response } from 'express'
import _ from 'lodash'
import { Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested, ValidationArguments } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import AttendanceReason from '../../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../../enum/attendanceStatus'

const getPrisonerName = (args: ValidationArguments) => (args.object as AttendedData)?.prisonerName

export class AttendedData {
  prisonerNumber: string

  prisonerName: string

  @IsNotEmpty({ message: args => `Select the activities that ${getPrisonerName(args)} attended` })
  selectedInstanceIds: string[]
}

export class SelectAttendedForm {
  @Type(() => AttendedData)
  @ValidateNested({ each: true })
  attendedData: AttendedData[]
}

export default class SelectAttendedRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const selectedAttendances = req.journeyData.recordAttendanceJourney.selectedInstanceIds as string[]

    const instanceIds = _.uniq(
      selectedAttendances.flatMap(selectedAttendance => selectedAttendance.split('-')[0].split(',')),
    ).map(Number)
    const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

    const allInstances = await this.activitiesService.getScheduledActivities(instanceIds, user)
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const attendanceDetails = selectedAttendances.map(selectedAttendance => {
      const prisonerInstanceIds = selectedAttendance.split('-')[0].split(',').map(Number)
      const prisonerNumber = selectedAttendance.split('-')[2]

      const prisoner = prisoners.find(p => p.prisonerNumber === prisonerNumber)
      const instances = allInstances.filter(i => prisonerInstanceIds.includes(i.id))

      const filteredInstances = instances.filter(instance => {
        const attendance = instance.attendances.find(a => a.prisonerNumber === prisonerNumber)
        return !instance.cancelled && attendance && attendance.status === 'WAITING'
      })

      return {
        prisonerNumber,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        instances: filteredInstances,
      }
    })

    return res.render('pages/activities/record-attendance/attend-all/select-attended', {
      attendanceDetails,
      requiredSelections: attendanceDetails.filter(detail => detail.instances.length > 1),
      backLink: req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const attendedFormData: AttendedData[] = req.body.attendedData

    const attendedData: AttendedData[] = [...attendedFormData]
    attendedData.forEach(data => {
      data.selectedInstanceIds =
        typeof data.selectedInstanceIds === 'string' ? [data.selectedInstanceIds] : data.selectedInstanceIds
    })

    const instanceIds = _.uniq(attendedData.flatMap(data => data.selectedInstanceIds.map(Number)))
    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const attendanceUpdates = attendedData.flatMap((prisonerAttendance: AttendedData) => {
      return prisonerAttendance.selectedInstanceIds.map(selectedInstanceId => {
        const instance = instances.find(inst => inst.id === +selectedInstanceId)
        const isPaid = instance.activitySchedule.activity.paid
        return {
          id: instance.attendances.find(a => a.prisonerNumber === prisonerAttendance.prisonerNumber).id,
          prisonCode: user.activeCaseLoadId,
          status: AttendanceStatus.COMPLETED,
          attendanceReason: AttendanceReason.ATTENDED,
          issuePayment: isPaid,
        }
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)

    const successMessage = `You've saved attendance details for ${
      attendedData.length === 1 ? attendedData[0].prisonerName : `${attendedData.length} attendees`
    }`

    const returnUrl = req.journeyData.recordAttendanceJourney.returnUrl
      ? req.journeyData.recordAttendanceJourney.returnUrl
      : 'choose-details-by-residential-location'

    return res.redirectWithSuccess(returnUrl, 'Attendance recorded', successMessage)
  }
}
