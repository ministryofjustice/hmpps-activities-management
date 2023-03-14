/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default class NotAttendedData {
  [key: string]: {
    notAttendedReason: string
    pay: boolean
    moreDetail: string
    caseNote: string
    incentiveLevelWarningIssued: boolean
    absenceReason: string
  }
}

export function ReasonEnteredForAllPrisoners(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'reasonEnteredForAllPrisoners',
      target: object.constructor,
      propertyName,
      constraints: ['notAttendedJourney', 'selectedPrisoners'],
      options: validationOptions,
      validator: {
        validate(notAttendedData: NotAttendedData, args: ValidationArguments) {
          const { selectedPrisoners } = args.object['notAttendedJourney']
          let emptyReason: boolean
          emptyReason = false
          selectedPrisoners.forEach((selectedPrisoner: { prisonerNumber: string }) => {
            if (notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === undefined) emptyReason = true
          })
          return !emptyReason
        },
      },
    })
  }
}
