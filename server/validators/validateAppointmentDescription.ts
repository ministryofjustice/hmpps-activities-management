/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { YesNo } from '../@types/activities'

// eslint-disable-next-line import/prefer-default-export
export function DescriptionRequired(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'descriptionRequired',
      target: object.constructor,
      propertyName,
      constraints: ['descriptionOption'],
      options: validationOptions,
      validator: {
        validate(description: string, args: ValidationArguments) {
          if (args.object['descriptionOption'] === YesNo.NO && (description === undefined || description === ''))
            return false
          return true
        },
      },
    })
  }
}

export function DescriptionMaxLength(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'descriptionMaxLength',
      target: object.constructor,
      propertyName,
      constraints: ['descriptionOption'],
      options: validationOptions,
      validator: {
        validate(description: string, args: ValidationArguments) {
          if (args.object['descriptionOption'] === YesNo.NO && description.length > 40) return false
          return true
        },
      },
    })
  }
}
