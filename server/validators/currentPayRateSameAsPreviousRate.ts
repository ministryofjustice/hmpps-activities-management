/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function CurrentPayRateSameAsPreviousRate(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'currentPayRateSameAsPreviousRate',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney'],
      options: validationOptions,
      validator: {
        validate(payRate: number, args: ValidationArguments) {
          const { previousPayRate } = args.object['createJourney']
          return payRate && !Number.isNaN(payRate) ? payRate !== previousPayRate : true
        },
      },
    })
  }
}
