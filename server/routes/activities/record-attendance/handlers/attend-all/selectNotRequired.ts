/* eslint-disable no-param-reassign */
import { Request, Response } from 'express'
import _ from 'lodash'
import { Transform, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, ValidateIf, ValidateNested, ValidationArguments } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { YesNo } from '../../../../../@types/activities'

const getPrisonerName = (args: ValidationArguments) => (args.object as NotRequiredData)?.prisonerName

export class NotRequiredData {
  prisonerNumber: string

  prisonerName: string

  @IsNotEmpty({ message: args => `Select the activities that ${getPrisonerName(args)} did not attend` })
  selectedInstanceIds: string[]

  @ValidateIf(o => o.selectedInstanceIds && o.selectedInstanceIds.length > 0)
  @Transform(({ value }) => value !== 'false')
  @IsEnum(YesNo, { message: (args: ValidationArguments) => `Select if ${getPrisonerName(args)} should be paid` })
  shouldBePaid: boolean
}

export class SelectNotRequiredForm {
  @Type(() => NotRequiredData)
  @ValidateNested({ each: true })
  notRequiredData: NotRequiredData[]
}

export default class SelectNotRequiredRoutes {
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
      const instances = allInstances.filter(i => {
        if (prisonerInstanceIds.includes(i.id) && !i.cancelled) {
          const hasAdvanceAttendance =
            i.advanceAttendances && i.advanceAttendances.some(a => a.prisonerNumber === prisonerNumber)
          return !hasAdvanceAttendance
        }
        return false
      })

      const isPayable = instances.some(i => i.activitySchedule.activity.paid)

      return {
        prisonerNumber,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        instances,
        isPayable,
      }
    })

    return res.render('pages/activities/record-attendance/attend-all/select-not-required', {
      attendanceDetails,
      backLink: req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const notRequiredDataForm: NotRequiredData[] = req.body.notRequiredData
    const notRequiredData = Array.isArray(notRequiredDataForm) ? notRequiredDataForm : [notRequiredDataForm]
    notRequiredData.forEach(data => {
      data.selectedInstanceIds =
        typeof data.selectedInstanceIds === 'string' ? [data.selectedInstanceIds] : data.selectedInstanceIds
    })

    const selectedPrisoners = notRequiredData.flatMap(data =>
      data.selectedInstanceIds.map(instanceId => ({
        prisonerNumber: data.prisonerNumber,
        prisonerName: data.prisonerName,
        isPaid: data.shouldBePaid,
        instanceId: Number(instanceId),
      })),
    )

    await Promise.all(
      selectedPrisoners.map(prisoner =>
        this.activitiesService.postAdvanceAttendances(
          {
            scheduleInstanceId: prisoner.instanceId,
            prisonerNumber: prisoner.prisonerNumber,
            issuePayment: prisoner.isPaid,
          },
          user,
        ),
      ),
    )

    const successMessage = `You've marked ${notRequiredData.length === 1 ? '1 person' : `${notRequiredData.length} people`} as not required at activities.`
    const redirectUrl = req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location'

    return res.redirectWithSuccess(redirectUrl, 'Not required status recorded', successMessage)
  }
}
