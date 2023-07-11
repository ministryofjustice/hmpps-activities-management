/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

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
          const existingPayWithSamePayBand = [
            ...args.object['createJourney'].pay,
            ...args.object['createJourney'].flat,
          ].filter((pay: any) => pay.bandId === bandId)

          // Fails if trying to add a flat rate and a single rate for that pay band already exists
          if (
            args.object['pathParams'].payRateType === 'flat' &&
            existingPayWithSamePayBand.find((p: any) => p.incentiveLevel !== undefined)
          ) {
            return false
          }

          // Fails if trying to add a flat rate and the same flat rate already exists
          if (
            args.object['pathParams'].payRateType === 'flat' &&
            existingPayWithSamePayBand.find((p: any) => p.incentiveLevel === undefined) &&
            +args.object['query'].bandId !== bandId
          ) {
            return false
          }

          // Fails if trying to add a single rate and a flat rate for that pay band already exists
          if (
            args.object['pathParams'].payRateType === 'single' &&
            existingPayWithSamePayBand.find((p: any) => p.incentiveLevel === undefined)
          ) {
            return false
          }

          // Fails if trying to add a single rate and the same single rate already exists
          if (
            args.object['pathParams'].payRateType === 'single' &&
            existingPayWithSamePayBand.find((p: any) => p.incentiveLevel === args.object['incentiveLevel']) &&
            (+args.object['query'].bandId !== bandId || args.object['query'].iep !== args.object['incentiveLevel'])
          ) {
            return false
          }

          return true
        },
      },
    })
  }
}
