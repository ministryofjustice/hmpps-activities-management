/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default function EducationLevelNotDuplicated(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'educationLevelNotDuplicated',
      target: object.constructor,
      propertyName,
      constraints: ['createJourney', 'educationLevels'],
      options: validationOptions,
      validator: {
        validate(referenceCode: string, args: ValidationArguments) {
          const existingEducationLevel = args.object['createJourney'].educationLevels
          return (
            existingEducationLevel?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (educationLevel: any) => educationLevel.educationLevelCode === referenceCode,
            ) === undefined
          )
        },
      },
    })
  }
}
