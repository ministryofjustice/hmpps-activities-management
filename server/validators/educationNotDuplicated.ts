import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { CreateAnActivityJourney } from '../routes/activities/create-an-activity/journey'

export default function EducationNotDuplicated(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'EducationNotDuplicated',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(referenceCode: string, args: ValidationArguments) {
          const { createJourney, studyAreaCode } = args.object as {
            createJourney: CreateAnActivityJourney
            studyAreaCode: string
          }

          return !createJourney.educationLevels?.find(
            educationLevel =>
              educationLevel.educationLevelCode === referenceCode && educationLevel.studyAreaCode === studyAreaCode,
          )
        },
      },
    })
  }
}
