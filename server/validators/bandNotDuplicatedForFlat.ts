/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function IsNotDuplicatedForFlat(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'bandNotDuplicatedForFlat',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney'],
      options: validationOptions,
      validator: {
        validate(bandId: number, args: ValidationArguments) {
          const existingFlat = args.object['createJourney'].flat
          return (
            existingFlat?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (pay: any) => pay.bandId === bandId && pay.bandId !== parseInt(args.object['currentPayBand'], 10),
            ) === undefined
          )
        },
      },
    })
  }
}
