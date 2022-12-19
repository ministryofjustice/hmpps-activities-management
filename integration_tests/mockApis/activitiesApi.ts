import { stubFor } from './wiremock'

const stubGetPrisonScheduledActivities = (prisonCode = 'LEI') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prisons/${prisonCode}/scheduled-instances?(.)*`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          id: 75,
          date: '08/12/2022',
          startTime: '10:00',
          endTime: '11:00',
          cancelled: false,
          cancelledTime: null,
          cancelledBy: null,
          attendances: [
            {
              id: 3,
              prisonerNumber: 'A5193DY',
              attendanceReason: {
                id: 1,
                code: 'ABS',
                description: 'Absent',
              },
              comment: null,
              posted: false,
              recordedTime: null,
              recordedBy: null,
              status: 'COMPLETED',
              payAmount: null,
              bonusAmount: null,
              pieces: null,
            },
            {
              id: 2,
              prisonerNumber: 'A9477DY',
              attendanceReason: null,
              comment: null,
              posted: false,
              recordedTime: null,
              recordedBy: null,
              status: 'SCHEDULED',
              payAmount: null,
              bonusAmount: null,
              pieces: null,
            },
            {
              id: 1,
              prisonerNumber: 'G4793VF',
              attendanceReason: {
                id: 3,
                code: 'ATT',
                description: 'Attended',
              },
              comment: null,
              posted: false,
              recordedTime: null,
              recordedBy: null,
              status: 'COMPLETED',
              payAmount: null,
              bonusAmount: null,
              pieces: null,
            },
          ],
          activitySchedule: {
            id: 7,
            description: 'Entry level English 3',
            startTime: '10:00',
            endTime: '11:00',
            internalLocation: {
              id: 1,
              code: 'EDU-ROOM-1',
              description: 'Education - R1',
            },
            capacity: 10,
            daysOfWeek: ['Thu'],
            activity: {
              id: 2,
              prisonCode,
              attendanceRequired: true,
              summary: 'English level 1',
              description: 'A basic english course suitable for introduction to the subject',
              category: {
                id: 1,
                code: 'EDU',
                description: 'Education',
              },
            },
          },
        },
      ],
    },
  })

const stubGetScheduledActivityById = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/scheduled-instances/(\\d)*`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        id: 75,
        date: '08/12/2022',
        startTime: '10:00',
        endTime: '11:00',
        cancelled: false,
        cancelledTime: null,
        cancelledBy: null,
        attendances: [
          {
            id: 3,
            prisonerNumber: 'A5193DY',
            attendanceReason: {
              id: 1,
              code: 'ABS',
              description: 'Absent',
            },
            comment: null,
            posted: false,
            recordedTime: null,
            recordedBy: null,
            status: 'COMPLETED',
            payAmount: null,
            bonusAmount: null,
            pieces: null,
          },
          {
            id: 2,
            prisonerNumber: 'A9477DY',
            attendanceReason: null,
            comment: null,
            posted: false,
            recordedTime: null,
            recordedBy: null,
            status: 'SCHEDULED',
            payAmount: null,
            bonusAmount: null,
            pieces: null,
          },
          {
            id: 1,
            prisonerNumber: 'G4793VF',
            attendanceReason: {
              id: 3,
              code: 'ATT',
              description: 'Attended',
            },
            comment: null,
            posted: false,
            recordedTime: null,
            recordedBy: null,
            status: 'COMPLETED',
            payAmount: null,
            bonusAmount: null,
            pieces: null,
          },
        ],
        activitySchedule: {
          id: 7,
          description: 'Entry level English 3',
          startTime: '10:00',
          endTime: '11:00',
          internalLocation: {
            id: 1,
            code: 'EDU-ROOM-1',
            description: 'Education - R1',
          },
          capacity: 10,
          daysOfWeek: ['Thu'],
          activity: {
            id: 2,
            prisonCode: 'MDI',
            attendanceRequired: true,
            summary: 'English level 1',
            description: 'A basic english course suitable for introduction to the subject',
            category: {
              id: 1,
              code: 'EDU',
              description: 'Education',
            },
          },
        },
      },
    },
  })

export default {
  stubGetPrisonScheduledActivities,
  stubGetScheduledActivityById,
}
