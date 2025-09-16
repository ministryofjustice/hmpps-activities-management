import { isNotEmpty, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isEmpty } from 'lodash'

export default function CvpLinkOneOrTheOther(
  property: string,
  otherProperty: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'cvpLinkOneOrTheOther',
      target: object.constructor,
      propertyName,
      constraints: [property, otherProperty],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const thisProperty: never = args.constraints[0] as never
          const thatProperty: never = args.constraints[1] as never

          // Utility function to access keys of the unknown object type
          const getKeyValue = <T extends object, U extends keyof T>(obj: T, key: U) => {
            return obj[key]
          }

          // Value contains the conditional trigger to validate (e.g. cvpRequired) must be a yes/no string
          if (value !== 'yes') {
            return true
          }

          // Check that one or the other, but not both, values are not empty
          return (
            (isNotEmpty(getKeyValue(args.object, thisProperty)) && isEmpty(getKeyValue(args.object, thatProperty))) ||
            (isNotEmpty(getKeyValue(args.object, thatProperty)) && isEmpty(getKeyValue(args.object, thisProperty)))
          )
        },
      },
    })
  }
}
