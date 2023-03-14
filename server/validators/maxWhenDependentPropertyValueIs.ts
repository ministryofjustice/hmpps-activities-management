import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function MaxWhenDependentPropertyValueIs(
  maxValue: number,
  dependentPropertyName: string,
  validDependentPropertyValue: unknown,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'maxWhenDependentPropertyValueIs',
      target: object.constructor,
      propertyName,
      constraints: [maxValue, dependentPropertyName, validDependentPropertyValue],
      options: validationOptions,
      validator: {
        validate(value: number, args: ValidationArguments) {
          const dependentPropertyValue = args.object[dependentPropertyName]
          return dependentPropertyValue === validDependentPropertyValue && value !== undefined
            ? value <= maxValue
            : true
        },
      },
    })
  }
}
