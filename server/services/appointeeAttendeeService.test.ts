import { when } from 'jest-when'
import { addDays, subDays } from 'date-fns'
import { ServiceUser } from '../@types/express'
import PrisonService from './prisonService'
import atLeast from '../../jest.setup'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { formatIsoDate } from '../utils/datePickerUtils'
import AppointeeAttendeeService from './appointeeAttendeeService'

jest.mock('./prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Appointee Attendee Service', () => {
  const appointeeAttendeeService = new AppointeeAttendeeService(prisonService)
  const today = new Date()
  const yesterday = subDays(today, 1)
  const tomorrow = addDays(today, 1)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  const newPrisoner = (
    prisonerNumber: string,
    status: string,
    lastMovementTypeCode: string,
    confirmedReleaseDate: Date,
  ): Prisoner => ({
    dateOfBirth: '',
    ethnicity: '',
    firstName: '',
    gender: '',
    lastName: '',
    prisonId: 'MDI',
    maritalStatus: '',
    mostSeriousOffence: '',
    nationality: '',
    religion: '',
    restrictedPatient: false,
    status,
    youthOffender: false,
    prisonerNumber,
    lastMovementTypeCode,
    confirmedReleaseDate: formatIsoDate(confirmedReleaseDate),
  })

  let prisoners: Prisoner[]
  let prisonerA: Prisoner
  let prisonerB: Prisoner

  beforeEach(() => {
    prisonerA = newPrisoner('AAAAAAA', 'INACTIVE OUT', 'REL', yesterday)
    prisonerB = newPrisoner('BBBBBBB', 'INACTIVE OUT', 'CRT', yesterday)
    prisoners = [prisonerA, prisonerB]
  })

  it('Prisoner was not returned by search api', async () => {
    prisonerB.inOutStatus = 'OUT'
    prisonerB.prisonId = 'RSI'

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
      .mockResolvedValueOnce([prisonerB])

    const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(['AAAAAAA', 'BBBBBBB'], user)

    expect(unavailableAttendees).toEqual(['AAAAAAA', 'BBBBBBB'])
  })

  describe('Status is INACTIVE OUT', () => {
    const nonReleaseMovementCodes = ['ADM', 'CRT', null, undefined]

    afterEach(() => {
      jest.resetAllMocks()

      prisonService.searchInmatesByPrisonerNumbers.mockClear()
    })

    it("Should return attendee who's release date is today and last movement type was permanently released", async () => {
      prisonerA.confirmedReleaseDate = formatIsoDate(today)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
        .mockResolvedValueOnce(prisoners)

      const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(['AAAAAAA', 'BBBBBBB'], user)

      expect(unavailableAttendees).toEqual(['AAAAAAA'])
    })

    it("Should return attendee who's release date was yesterday and last movement type was permanently released", async () => {
      prisonerA.confirmedReleaseDate = formatIsoDate(yesterday)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
        .mockResolvedValueOnce(prisoners)

      const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(['AAAAAAA', 'BBBBBBB'], user)

      expect(unavailableAttendees).toEqual(['AAAAAAA'])
    })

    it("Should not return attendee who's release date is tomorrow and last movement type was permanently released", async () => {
      prisonerA.confirmedReleaseDate = formatIsoDate(tomorrow)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
        .mockResolvedValueOnce(prisoners)

      const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(['AAAAAAA', 'BBBBBBB'], user)

      expect(unavailableAttendees).toHaveLength(0)
    })

    it.each(nonReleaseMovementCodes)(
      "Should not return attendee who's release date is yesterday and last movement type was %s",
      async lastMovementTypeCode => {
        prisonerA.lastMovementTypeCode = lastMovementTypeCode
        prisonerA.confirmedReleaseDate = formatIsoDate(yesterday)

        when(prisonService.searchInmatesByPrisonerNumbers)
          .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
          .mockResolvedValueOnce(prisoners)

        const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(
          ['AAAAAAA', 'BBBBBBB'],
          user,
        )

        expect(unavailableAttendees).toHaveLength(0)
      },
    )
  })

  describe('Status is ACTIVE IN', () => {
    beforeEach(() => {
      prisonerA.status = 'ACTIVE IN'
      prisonerB.status = 'ACTIVE IN'
    })

    describe('is in expected prison', () => {
      it("Should not return attendee who's release date is today and last movement type was permanently released", async () => {
        prisonerA.lastMovementTypeCode = 'REL'
        prisonerA.confirmedReleaseDate = formatIsoDate(today)

        when(prisonService.searchInmatesByPrisonerNumbers)
          .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
          .mockResolvedValueOnce(prisoners)

        const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(
          ['AAAAAAA', 'BBBBBBB'],
          user,
        )

        expect(unavailableAttendees).toHaveLength(0)
      })

      it("Should not return attendee who's release date was yesterday and last movement type was permanently released", async () => {
        prisonerA.lastMovementTypeCode = 'REL'
        prisonerA.confirmedReleaseDate = formatIsoDate(yesterday)

        when(prisonService.searchInmatesByPrisonerNumbers)
          .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
          .mockResolvedValueOnce(prisoners)

        const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(
          ['AAAAAAA', 'BBBBBBB'],
          user,
        )

        expect(unavailableAttendees).toHaveLength(0)
      })
    })

    describe('Not in expected prison', () => {
      const wrongPrisonCodes = ['RSI', null, undefined]

      it('Should not return attendee where active case load id is MDI and prison id MDI', async () => {
        prisonerA.inOutStatus = 'IN'
        prisonerA.prisonId = 'MDI'

        when(prisonService.searchInmatesByPrisonerNumbers)
          .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
          .mockResolvedValueOnce(prisoners)

        const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(
          ['AAAAAAA', 'BBBBBBB'],
          user,
        )

        expect(unavailableAttendees).toHaveLength(0)
      })

      it.each(wrongPrisonCodes)(
        'Should return attendee active case load id is MDI but prison id is %s',
        async wrongPrisonCode => {
          prisonerA.prisonId = wrongPrisonCode

          when(prisonService.searchInmatesByPrisonerNumbers)
            .calledWith(atLeast(['AAAAAAA', 'BBBBBBB'], user))
            .mockResolvedValueOnce(prisoners)

          const unavailableAttendees = await appointeeAttendeeService.findUnavailableAttendees(
            ['AAAAAAA', 'BBBBBBB'],
            user,
          )

          expect(unavailableAttendees).toEqual(['AAAAAAA'])
        },
      )
    })
  })
})
