/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export default class NotAttendedData {
  [key: string]: {
    notAttendedReason: string
    SICKPay: boolean
    RESTPay: boolean
    moreDetail: string
    caseNote: string
    incentiveLevelWarningIssued: boolean
    absenceReason: string
    absencePay: boolean
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

export function PayRequired(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'payRequired',
      target: object.constructor,
      propertyName,
      constraints: ['notAttendedJourney', 'selectedPrisoners'],
      options: validationOptions,
      validator: {
        validate(notAttendedData: NotAttendedData, args: ValidationArguments) {
          const { selectedPrisoners } = args.object['notAttendedJourney']
          let emptyPay: boolean
          emptyPay = false
          selectedPrisoners.forEach((selectedPrisoner: { prisonerNumber: string }) => {
            if (
              (notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'SICK' &&
                notAttendedData[selectedPrisoner.prisonerNumber].SICKPay === undefined) ||
              (notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'REST' &&
                notAttendedData[selectedPrisoner.prisonerNumber].RESTPay === undefined) ||
              (notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'OTHER' &&
                notAttendedData[selectedPrisoner.prisonerNumber].absencePay === undefined)
            )
              emptyPay = true
          })
          return !emptyPay
        },
      },
    })
  }
}

export function CaseNoteRequired(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'caseNoteRequired',
      target: object.constructor,
      propertyName,
      constraints: ['notAttendedJourney', 'selectedPrisoners'],
      options: validationOptions,
      validator: {
        validate(notAttendedData: NotAttendedData, args: ValidationArguments) {
          const { selectedPrisoners } = args.object['notAttendedJourney']
          let emptyCaseNote: boolean
          emptyCaseNote = false
          selectedPrisoners.forEach((selectedPrisoner: { prisonerNumber: string }) => {
            if (
              notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'REFUSED' &&
              notAttendedData[selectedPrisoner.prisonerNumber].caseNote === ''
            )
              emptyCaseNote = true
          })
          return !emptyCaseNote
        },
      },
    })
  }
}

export function IncentiveLevelWarningRequired(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'incentiveLevelWarningRequired',
      target: object.constructor,
      propertyName,
      constraints: ['notAttendedJourney', 'selectedPrisoners'],
      options: validationOptions,
      validator: {
        validate(notAttendedData: NotAttendedData, args: ValidationArguments) {
          const { selectedPrisoners } = args.object['notAttendedJourney']
          let emptyIncentiveLevelWarning: boolean
          emptyIncentiveLevelWarning = false
          selectedPrisoners.forEach((selectedPrisoner: { prisonerNumber: string }) => {
            if (
              notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'REFUSED' &&
              notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued === undefined
            )
              emptyIncentiveLevelWarning = true
          })
          return !emptyIncentiveLevelWarning
        },
      },
    })
  }
}

export function AbsenceReasonRequired(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'absenceReasonRequired',
      target: object.constructor,
      propertyName,
      constraints: ['notAttendedJourney', 'selectedPrisoners'],
      options: validationOptions,
      validator: {
        validate(notAttendedData: NotAttendedData, args: ValidationArguments) {
          const { selectedPrisoners } = args.object['notAttendedJourney']
          let emptyAbsenceReason: boolean
          emptyAbsenceReason = false
          selectedPrisoners.forEach((selectedPrisoner: { prisonerNumber: string }) => {
            if (
              notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === 'OTHER' &&
              notAttendedData[selectedPrisoner.prisonerNumber].absenceReason === ''
            )
              emptyAbsenceReason = true
          })
          return !emptyAbsenceReason
        },
      },
    })
  }
}
