/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function PayRateBetweenMinAndMax(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'payRateBetweenMinAndMax',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney'],
      options: validationOptions,
      validator: {
        validate(payRate: number, args: ValidationArguments) {
          const { minimumPayRate } = args.object['createJourney']
          const { maximumPayRate } = args.object['createJourney']

          return payRate !== undefined ? payRate >= minimumPayRate && payRate <= maximumPayRate : true
        },
      },
    })
  }
}
