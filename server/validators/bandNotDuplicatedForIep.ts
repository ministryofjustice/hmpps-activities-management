/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function IsNotDuplicatedForIep(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'bandNotDuplicatedForIep',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney', 'incentiveLevels'],
      options: validationOptions,
      validator: {
        validate(bandId: number, args: ValidationArguments) {
          const existingPay = args.object['createJourney'].pay
          return (
            existingPay?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (pay: any) => pay.bandId === bandId && args.object['incentiveLevels'].includes(pay.incentiveLevel),
            ) === undefined
          )
        },
      },
    })
  }
}
