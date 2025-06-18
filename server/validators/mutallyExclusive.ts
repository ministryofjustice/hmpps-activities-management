import { ValidationArguments, ValidationOptions, ValidationTypes, registerDecorator } from 'class-validator'
import 'reflect-metadata'

// Must not conflict with other existing properties in the application
const MUTUALLY_EXCLUSIVE_KEY = (tag: string) => `validator_mutually_exclusive_${tag}`

function MutuallyExclusive(validationOptions?: ValidationOptions, tag = 'default') {
  // eslint-disable-next-line func-names
  return function (object: object, propertyName: string) {
    const key = MUTUALLY_EXCLUSIVE_KEY(tag)
    const existing = Reflect.getMetadata(key, object) || []

    // We add the decorated property to the list of mutually exclusive properties
    Reflect.defineMetadata(key, [...existing, propertyName], object)

    // This decorator is used to cut the validation chain when we only have one property defined
    registerDecorator({
      name: ValidationTypes.CONDITIONAL_VALIDATION,
      target: object.constructor,
      propertyName,
      constraints: [
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (object: never, value: never) => {
          const mutuallyExclusiveProps: string[] = Reflect.getMetadata(key, object)
          const definedCount = mutuallyExclusiveProps.reduce(
            // eslint-disable-next-line no-plusplus,no-param-reassign
            (p, c) => (object[c as keyof object] !== undefined ? ++p : p),
            0,
          )
          return !(definedCount === 1 && value === undefined)
        },
      ],
      options: validationOptions,
      validator: () => true,
    })

    registerDecorator({
      name: 'MutuallyExclusive',
      target: object.constructor,
      propertyName,
      constraints: [tag],
      options: validationOptions,
      validator: {
        validate(_value: never, args: ValidationArguments) {
          const mutuallyExclusiveProps: string[] = Reflect.getMetadata(key, args.object)
          return (
            // eslint-disable-next-line no-plusplus,no-param-reassign
            mutuallyExclusiveProps.reduce((p, c) => (args.object[c as keyof object] !== undefined ? ++p : p), 0) === 1
          )
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          if (!validationArguments) {
            return 'Mutually exclusive validation failed'
          }
          const mutuallyExclusiveProps: string[] = Reflect.getMetadata(key, validationArguments.object)
          return `Exactly one of the following properties must be defined: ${mutuallyExclusiveProps.join(', ')}`
        },
      },
    })
  }
}

// eslint-disable-next-line import/prefer-default-export
export { MutuallyExclusive }
