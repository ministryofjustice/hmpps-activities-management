/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { ActivityPay } from '../@types/activitiesAPI/types'
import { parseIsoDate } from '../utils/datePickerUtils'

export default function IsNotDuplicatedForIep(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'bandNotDuplicatedForIep',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney', 'incentiveLevel'],
      options: validationOptions,
      validator: {
        validate(bandId: number, args: ValidationArguments) {
          const existingPayWithSamePayBand: ActivityPay[] = [
            ...args.object['createJourney'].pay,
            ...args.object['createJourney'].flat,
          ].filter((pay: ActivityPay) => pay.prisonPayBand.id === bandId)

          // Fails if trying to add a flat rate and a single rate for that pay band already exists
          if (
            args.object['pathParams'].payRateType === 'flat' &&
            existingPayWithSamePayBand.find(p => p.incentiveLevel !== undefined)
          ) {
            return false
          }

          // Fails if trying to add a flat rate and the same flat rate already exists
          if (
            args.object['pathParams'].payRateType === 'flat' &&
            existingPayWithSamePayBand.find(p => p.incentiveLevel === undefined) &&
            +args.object['queryParams'].bandId !== bandId
          ) {
            return false
          }

          // Fails if trying to add a single rate and a flat rate for that pay band already exists
          if (
            args.object['pathParams'].payRateType === 'single' &&
            existingPayWithSamePayBand.find(p => p.incentiveLevel === undefined)
          ) {
            return false
          }

          // Fails if trying to add a single rate and the same single rate already exists
          return !(
            args.object['pathParams'].payRateType === 'single' &&
            existingPayWithSamePayBand.find(p =>
              duplicatePay(p, args.object['startDate'], args.object['incentiveLevel'], bandId),
            ) &&
            (+args.object['queryParams'].bandId !== bandId ||
              args.object['queryParams'].iep !== args.object['incentiveLevel'])
          )
        },
      },
    })
  }
}

export function duplicatePay(pay: ActivityPay, startDate: Date, incentiveLevel: string, payBandId: number) {
  const existingPay: Date = parseIsoDate(pay.startDate)

  const payStart = existingPay === null ? -1 : existingPay.valueOf()
  const newStart = startDate === undefined || startDate === null ? -1 : startDate.valueOf()

  return pay.prisonPayBand.id === payBandId && pay.incentiveLevel === incentiveLevel && payStart === newStart
}
