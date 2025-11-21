import {
  parseSelectedAttendances,
  getPrisonerNumberFromAttendance,
  getInstanceIdsFromAttendance,
} from './attendanceParsingUtils'

describe('attendanceParsingUtils', () => {
  describe('parseSelectedAttendances', () => {
    it('should parse single attendance with single instance ID', () => {
      const result = parseSelectedAttendances(['123-attendance-A1234BC'])

      expect(result.instanceIds).toEqual([123])
      expect(result.prisonerNumbers).toEqual(['A1234BC'])
    })

    it('should parse multiple attendances with single instance IDs each', () => {
      const result = parseSelectedAttendances(['123-attendance-A1234BC', '456-attendance-B5678EF'])

      expect(result.instanceIds).toEqual([123, 456])
      expect(result.prisonerNumbers).toEqual(['A1234BC', 'B5678EF'])
    })

    it('should parse attendance with multiple instance IDs (comma-separated)', () => {
      const result = parseSelectedAttendances(['123,456-attendance-A1234BC'])

      expect(result.instanceIds).toEqual([123, 456])
      expect(result.prisonerNumbers).toEqual(['A1234BC'])
    })

    it('should handle mixed single and multiple instance IDs', () => {
      const result = parseSelectedAttendances(['123,456-attendance-A1234BC', '789-attendance-B5678EF'])

      expect(result.instanceIds).toEqual([123, 456, 789])
      expect(result.prisonerNumbers).toEqual(['A1234BC', 'B5678EF'])
    })

    it('should remove duplicate instance IDs', () => {
      const result = parseSelectedAttendances(['123-attendance-A1234BC', '123-attendance-B5678EF'])

      expect(result.instanceIds).toEqual([123])
      expect(result.prisonerNumbers).toEqual(['A1234BC', 'B5678EF'])
    })

    it('should remove duplicate prisoner numbers', () => {
      const result = parseSelectedAttendances(['123-attendance-A1234BC', '456-attendance-A1234BC'])

      expect(result.instanceIds).toEqual([123, 456])
      expect(result.prisonerNumbers).toEqual(['A1234BC'])
    })

    it('should return empty arrays for empty input', () => {
      const result = parseSelectedAttendances([])

      expect(result.instanceIds).toEqual([])
      expect(result.prisonerNumbers).toEqual([])
    })
  })

  describe('getPrisonerNumberFromAttendance', () => {
    it('should extract prisoner number from single instance attendance', () => {
      const result = getPrisonerNumberFromAttendance('123-attendance-A1234BC')

      expect(result).toEqual('A1234BC')
    })

    it('should extract prisoner number from multiple instance attendance', () => {
      const result = getPrisonerNumberFromAttendance('123,456,789-attendance-B5678EF')

      expect(result).toEqual('B5678EF')
    })
  })

  describe('getInstanceIdsFromAttendance', () => {
    it('should extract single instance ID', () => {
      const result = getInstanceIdsFromAttendance('123-attendance-A1234BC')

      expect(result).toEqual([123])
    })

    it('should extract multiple comma-separated instance IDs', () => {
      const result = getInstanceIdsFromAttendance('123,456,789-attendance-A1234BC')

      expect(result).toEqual([123, 456, 789])
    })

    it('should parse instance IDs as numbers', () => {
      const result = getInstanceIdsFromAttendance('100,200,300-x-Z9999ZZ')

      expect(result).toEqual([100, 200, 300])
      expect(result.every(id => typeof id === 'number')).toBe(true)
    })

    it('should maintain order of instance IDs', () => {
      const result = getInstanceIdsFromAttendance('5,3,1,4,2-attendance-C1111CC')

      expect(result).toEqual([5, 3, 1, 4, 2])
    })
  })
})
