import { stubFor } from './wiremock'

const stubGetCategories = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/activity-categories',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          id: 1,
          description: 'Education',
        },
        {
          id: 2,
          description: 'Services',
        },
        {
          id: 3,
          description: 'Leisure and social',
        },
        {
          id: 4,
          description: 'Induction',
        },
      ],
    },
  })

const stubGetCategoryCapacity = (prisonCode = 'LEI') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prison/${prisonCode}/activity-categories/(\\d)*/capacity`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        capacity: 20,
        allocated: 5,
      },
    },
  })

const stubGetActivitiesForCategory = (prisonCode = 'LEI') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prison/${prisonCode}/activity-categories/(\\d)*/activities`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          id: 1,
          prisonCode: `${prisonCode}`,
          summary: 'Maths level 1',
          description: 'A basic maths course suitable for introduction to the subject',
        },
        {
          id: 2,
          prisonCode: `${prisonCode}`,
          summary: 'English level 1',
          description: 'A basic english course suitable for introduction to the subject',
        },
      ],
    },
  })

const stubGetActivityCapacity = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/activities/(\\d)*/capacity`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        capacity: 20,
        allocated: 5,
      },
    },
  })

const stubGetActivitySchedules = (prisonCode = 'LEI') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/activities/(\\d)*/schedules`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          id: 1,
          description: 'Monday AM Houseblock 3',
          startTime: '10:00',
          endTime: '11:00',
          internalLocation: {
            id: 1,
            code: 'EDU-ROOM-1',
            description: 'Education - R1',
          },
          capacity: 10,
          daysOfWeek: ['Mon'],
          activity: {
            id: 1,
            prisonCode: `${prisonCode}`,
            summary: 'Maths level 1',
            description: 'A basic maths course suitable for introduction to the subject',
          },
        },
        {
          id: 2,
          description: 'Monday PM Houseblock 3',
          startTime: '14:00',
          endTime: '15:00',
          internalLocation: {
            id: 2,
            code: 'EDU-ROOM-2',
            description: 'Education - R2',
          },
          capacity: 10,
          daysOfWeek: ['Mon'],
          activity: {
            id: 1,
            prisonCode: `${prisonCode}`,
            summary: 'Maths level 1',
            description: 'A basic maths course suitable for introduction to the subject',
          },
        },
        {
          id: 3,
          description: 'Wednesday AM Houseblock 3',
          startTime: '10:00',
          endTime: '11:00',
          internalLocation: {
            id: 1,
            code: 'EDU-ROOM-1',
            description: 'Education - R1',
          },
          capacity: 10,
          daysOfWeek: ['Wed'],
          activity: {
            id: 1,
            prisonCode: `${prisonCode}`,
            summary: 'Maths level 1',
            description: 'A basic maths course suitable for introduction to the subject',
          },
        },
        {
          id: 4,
          description: 'Wednesday PM Houseblock 3',
          startTime: '14:00',
          endTime: '15:00',
          internalLocation: {
            id: 2,
            code: 'EDU-ROOM-2',
            description: 'Education - R2',
          },
          capacity: 10,
          daysOfWeek: ['Wed'],
          activity: {
            id: 1,
            prisonCode: `${prisonCode}`,
            summary: 'Maths level 1',
            description: 'A basic maths course suitable for introduction to the subject',
          },
        },
      ],
    },
  })

const stubGetScheduleCapacity = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/schedules/(\\d)*/capacity`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        capacity: 20,
        allocated: 5,
      },
    },
  })

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
  stubGetCategories,
  stubGetCategoryCapacity,
  stubGetActivitiesForCategory,
  stubGetActivityCapacity,
  stubGetActivitySchedules,
  stubGetScheduleCapacity,
  stubGetPrisonScheduledActivities,
  stubGetScheduledActivityById,
}
