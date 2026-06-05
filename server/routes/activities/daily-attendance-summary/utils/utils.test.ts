import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import filterByLocation from './utils'

describe('daily attendance summary utils', () => {
  const mockAttendances: AllAttendance[] = [
    {
      outsideWork: false,
      paid: false,
      categoryName: 'Education',
    } as AllAttendance,
    {
      outsideWork: true,
      paid: true,
      categoryName: 'Work',
    } as AllAttendance,
    {
      outsideWork: true,
      paid: false,
      categoryName: 'Work',
    } as AllAttendance,
    {
      outsideWork: false,
      paid: false,
      categoryName: 'Workshop',
    } as AllAttendance,
    {
      outsideWork: true,
      paid: true,
      categoryName: 'Paid Work',
    } as AllAttendance,
    {
      outsideWork: true,
      paid: false,
      categoryName: 'Unpaid Work',
    } as AllAttendance,
  ]

  describe('with single location filter', () => {
    it('should filter by inPrison location', () => {
      const result = filterByLocation(mockAttendances, ['inPrison'])

      expect(result).toHaveLength(2)
      expect(result[0].outsideWork).toBe(false)
      expect(result[1].outsideWork).toBe(false)
    })

    it('should filter by outsidePrison location (paid by prison)', () => {
      const result = filterByLocation(mockAttendances, ['outsidePrison'])

      expect(result).toHaveLength(2)
      expect(result[0].outsideWork).toBe(true)
      expect(result[0].paid).toBe(true)
      expect(result[1].outsideWork).toBe(true)
      expect(result[1].paid).toBe(true)
    })

    it('should filter by outsideEmployer location (paid by employer)', () => {
      const result = filterByLocation(mockAttendances, ['outsideEmployer'])

      expect(result).toHaveLength(2)
      expect(result[0].outsideWork).toBe(true)
      expect(result[0].paid).toBe(false)
      expect(result[1].outsideWork).toBe(true)
      expect(result[1].paid).toBe(false)
    })
  })

  describe('with multiple location filters', () => {
    it('should filter by inPrison and outsidePrison', () => {
      const result = filterByLocation(mockAttendances, ['inPrison', 'outsidePrison'])

      expect(result).toHaveLength(4)
      expect(result.filter(a => !a.outsideWork)).toHaveLength(2)
      expect(result.filter(a => a.outsideWork && a.paid)).toHaveLength(2)
    })

    it('should filter by inPrison and outsideEmployer', () => {
      const result = filterByLocation(mockAttendances, ['inPrison', 'outsideEmployer'])

      expect(result).toHaveLength(4)
      expect(result.filter(a => !a.outsideWork)).toHaveLength(2)
      expect(result.filter(a => a.outsideWork && !a.paid)).toHaveLength(2)
    })

    it('should filter by all location types', () => {
      const result = filterByLocation(mockAttendances, ['inPrison', 'outsidePrison', 'outsideEmployer'])

      expect(result).toHaveLength(mockAttendances.length)
    })
  })

  describe('with empty filters', () => {
    it('should return an empty array when no filters are provided', () => {
      const result = filterByLocation(mockAttendances, [])

      expect(result).toHaveLength(0)
    })
  })

  describe('with empty attendance array', () => {
    it('should return an empty array when attendance array is empty', () => {
      const result = filterByLocation([], ['inPrison', 'outsidePrison', 'outsideEmployer'])

      expect(result).toHaveLength(0)
    })
  })

  describe('with invalid filters', () => {
    it('should return an empty array when filters do not match any attendance', () => {
      const result = filterByLocation(mockAttendances, ['invalidFilter'])

      expect(result).toHaveLength(0)
    })

    it('should ignore invalid filters and apply valid ones', () => {
      const result = filterByLocation(mockAttendances, ['inPrison', 'invalidFilter'])

      expect(result).toHaveLength(2)
      expect(result[0].outsideWork).toBe(false)
      expect(result[1].outsideWork).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should correctly differentiate between paid and unpaid outside work', () => {
      const paidOutsideWork = mockAttendances.filter(a => a.outsideWork && a.paid)
      const unpaidOutsideWork = mockAttendances.filter(a => a.outsideWork && !a.paid)

      expect(paidOutsideWork).toHaveLength(2)
      expect(unpaidOutsideWork).toHaveLength(2)

      const paidResult = filterByLocation(mockAttendances, ['outsidePrison'])
      const unpaidResult = filterByLocation(mockAttendances, ['outsideEmployer'])

      expect(paidResult).toEqual(paidOutsideWork)
      expect(unpaidResult).toEqual(unpaidOutsideWork)
    })
  })

  describe('filter combinations that cover all attendance types', () => {
    it('should return all records when all filter types are selected', () => {
      const result = filterByLocation(mockAttendances, ['inPrison', 'outsidePrison', 'outsideEmployer'])

      expect(result).toHaveLength(mockAttendances.length)
    })
  })
})
