import { addDays, subDays } from 'date-fns'
import { activityRows, filterItems } from './activitiesPageUtils'
import TimeSlot from '../../../../enum/timeSlot'

const attendanceSummaryResponse = [
  {
    scheduledInstanceId: 144,
    activityId: 1,
    activityScheduleId: 1,
    summary: 'Math 1',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '13:00',
    endTime: '16:30',
    inCell: true,
    onWing: false,
    offWing: false,
    timeSlot: TimeSlot.PM,
    attendanceRequired: true,
    cancelled: false,
    attendanceSummary: {
      allocations: 1,
      attendees: 1,
      notRecorded: 0,
      attended: 1,
      absences: 0,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 189,
    activityId: 5,
    activityScheduleId: 5,
    summary: 'Packing',
    categoryId: 2,
    sessionDate: '2023-08-22',
    startTime: '09:00',
    endTime: '12:00',
    timeSlot: TimeSlot.AM,
    inCell: false,
    onWing: false,
    offWing: false,
    attendanceRequired: false,
    internalLocation: {
      id: 100,
      code: 'MDI-WORK-1',
      description: 'WORKSHOP 1',
    },
    cancelled: false,
    attendanceSummary: {
      allocations: 2,
      attendees: 2,
      notRecorded: 1,
      attended: 1,
      absences: 0,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 236,
    activityId: 10,
    activityScheduleId: 10,
    summary: 'English 2',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '13:00',
    endTime: '16:30',
    timeSlot: TimeSlot.PM,
    inCell: false,
    onWing: true,
    offWing: false,
    attendanceRequired: true,
    cancelled: false,
    attendanceSummary: {
      allocations: 4,
      attendees: 4,
      notRecorded: 3,
      attended: 1,
      absences: 2,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 444,
    activityId: 11,
    activityScheduleId: 11,
    summary: 'Math 2',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '18:00',
    endTime: '19:00',
    timeSlot: TimeSlot.ED,
    inCell: false,
    onWing: false,
    offWing: true,
    attendanceRequired: true,
    cancelled: false,
    attendanceSummary: {
      allocations: 5,
      attendees: 4,
      notRecorded: 3,
      attended: 1,
      absences: 2,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 244,
    activityId: 12,
    activityScheduleId: 12,
    summary: 'Math 3',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '18:00',
    endTime: '19:00',
    timeSlot: TimeSlot.ED,
    inCell: false,
    onWing: false,
    offWing: true,
    attendanceRequired: true,
    cancelled: true,
    attendanceSummary: {
      allocations: 6,
      attendees: 5,
      notRecorded: 1,
      attended: 1,
      absences: 2,
      paid: 1,
    },
  },
]

const categories = [
  {
    id: 1,
    code: 'SAA_EDUCATION',
    name: 'Education',
    description: 'Education',
  },
  {
    id: 2,
    code: 'SAA_INDUSTRIES',
    name: 'Packing',
    description: 'Packing',
  },
]

describe('filterItems', () => {
  it('should return the correctly constructed filter items', () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM', 'PM'],
    }

    const result = filterItems(categories, filterValues, null, 'ALL')

    expect(result).toEqual({
      categoryFilters: [
        { value: 'SAA_EDUCATION', text: 'Education', checked: true },
        { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
      ],
      sessionFilters: [
        { value: 'AM', text: 'Morning (AM)', checked: true },
        { value: 'PM', text: 'Afternoon (PM)', checked: true },
        { value: 'ED', text: 'Evening (ED)', checked: false },
      ],
      locationType: 'ALL',
      locationId: null,
    })
  })
})

describe('activityRows', () => {
  it('should filter the activities based on the search term - today', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM', 'PM', 'ED'],
    }

    const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'ALL', 'english')

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[2],
        session: 'PM',
        allowSelection: true,
      },
    ])
  })

  it('should filter the activities based on the search term - yesterday', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM', 'PM', 'ED'],
    }

    const result = activityRows(
      subDays(new Date(), 1),
      categories,
      attendanceSummaryResponse,
      filterValues,
      null,
      'ALL',
      'english',
    )

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[2],
        session: 'PM',
        allowSelection: true,
      },
    ])
  })

  it('should filter the activities based on the search term - tomorrow', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM', 'PM', 'ED'],
    }

    const result = activityRows(
      addDays(new Date(), 1),
      categories,
      attendanceSummaryResponse,
      filterValues,
      null,
      'ALL',
      'english',
    )

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[2],
        session: 'PM',
        allowSelection: true,
      },
    ])
  })

  it('should filter the activities based on the time slot - today', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM'],
    }

    const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'ALL', '')

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[1],
        session: 'AM',
        allowSelection: false,
      },
    ])
  })

  it('should filter the activities based on the time slot - yesterday', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM'],
    }

    const result = activityRows(
      subDays(new Date(), 1),
      categories,
      attendanceSummaryResponse,
      filterValues,
      null,
      'ALL',
      '',
    )

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[1],
        session: 'AM',
        allowSelection: false,
      },
    ])
  })

  it('should filter the activities based on the time slot - tomorrow', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM'],
    }

    const result = activityRows(
      addDays(new Date(), 1),
      categories,
      attendanceSummaryResponse,
      filterValues,
      null,
      'ALL',
      '',
    )

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[1],
        session: 'AM',
        allowSelection: false,
      },
    ])
  })

  it('should filter the activities based on the category', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION'],
      sessionFilters: ['AM', 'PM', 'ED'],
    }

    const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'ALL', '')

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[0],
        session: 'PM',
        allowSelection: true,
      },
      {
        ...attendanceSummaryResponse[2],
        session: 'PM',
        allowSelection: true,
      },
      {
        ...attendanceSummaryResponse[3],
        session: 'ED',
        allowSelection: true,
      },
      {
        ...attendanceSummaryResponse[4],
        session: 'ED',
        allowSelection: false,
      },
    ])
  })

  describe('Filter by location', () => {
    it('should filter IN_CELL activities', async () => {
      const filterValues = {
        categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
        sessionFilters: ['AM', 'PM', 'ED'],
      }

      const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'IN_CELL', '')

      expect(result).toEqual([
        {
          ...attendanceSummaryResponse[0],
          session: 'PM',
          allowSelection: true,
        },
      ])
    })

    it('should filter ON_WING activities', async () => {
      const filterValues = {
        categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
        sessionFilters: ['AM', 'PM', 'ED'],
      }

      const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'ON_WING', '')

      expect(result).toEqual([
        {
          ...attendanceSummaryResponse[2],
          session: 'PM',
          allowSelection: true,
        },
      ])
    })

    it('should filter OFF_WING activities', async () => {
      const filterValues = {
        categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
        sessionFilters: ['AM', 'PM', 'ED'],
      }

      const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'OFF_WING', '')

      expect(result).toEqual([
        {
          ...attendanceSummaryResponse[3],
          session: 'ED',
          allowSelection: true,
        },
        {
          ...attendanceSummaryResponse[4],
          session: 'ED',
          allowSelection: false,
        },
      ])
    })

    it('should filter OUT_OF_CELL activities', async () => {
      const filterValues = {
        categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
        sessionFilters: ['AM', 'PM', 'ED'],
      }

      const result = activityRows(
        new Date(),
        categories,
        attendanceSummaryResponse,
        filterValues,
        '100',
        'OUT_OF_CELL',
        '',
      )

      expect(result).toEqual([
        {
          ...attendanceSummaryResponse[1],
          session: 'AM',
          allowSelection: false,
        },
      ])
    })
  })

  it('should only return cancelled instances for uncancel page', async () => {
    const filterValues = {
      categoryFilters: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
      sessionFilters: ['AM', 'PM', 'ED'],
    }

    const result = activityRows(new Date(), categories, attendanceSummaryResponse, filterValues, null, 'ALL', '', true)

    expect(result).toEqual([
      {
        ...attendanceSummaryResponse[4],
        session: 'ED',
        allowSelection: true,
      },
    ])
  })
})
