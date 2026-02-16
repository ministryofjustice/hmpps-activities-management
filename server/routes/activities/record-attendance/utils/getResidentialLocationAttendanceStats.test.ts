import { getResidentialLocationAttendanceStats, AttendanceStats } from './getResidentialLocationAttendanceStats'
import { PrisonerWithAttendanceRecord } from '../../../../@types/attendanceRecords'
import AttendanceReason from '../../../../enum/attendanceReason'

describe('getAttendanceNumbers', () => {
  describe('ZERO attendees ', () => {
    it('should return all zeros for empty list', () => {
      const result = getResidentialLocationAttendanceStats([])

      expect(result).toEqual<AttendanceStats>({
        totalAttendees: 0,
        totalAttendanceRecords: 0,
        totalAttended: 0,
        totalAbsences: 0,
        totalNotRecorded: 0,
      })
    })
  })

  describe('totalAttendees', () => {
    it('should count the number of prisoners', () => {
      const prisoners = [
        { prisoner: { prisonerNumber: 'AA11AA' }, instanceIds: [1, 2], attendances: [] },
        { prisoner: { prisonerNumber: 'BB22BB' }, instanceIds: [3], attendances: [] },
        { prisoner: { prisonerNumber: 'CC33CC' }, instanceIds: [4], attendances: [] },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttendees).toBe(3)
    })
  })

  describe('totalAttendanceRecords', () => {
    it('should count total instances for all prisoners', () => {
      const prisoners = [
        { prisoner: { prisonerNumber: 'AA11AA' }, instanceIds: [1, 2, 3], attendances: [] },
        { prisoner: { prisonerNumber: 'BB22BB' }, instanceIds: [4, 5], attendances: [] },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttendanceRecords).toBe(5)
    })
  })

  describe('totalAttended', () => {
    it('should count attendances with ATTENDED as the reason code', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1, 2],

          attendances: [
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
          ],
        },
        {
          prisoner: { prisonerNumber: 'BB22BB' },
          instanceIds: [3],
          attendances: [{ attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' }],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttended).toBe(3)
    })

    it('should ignore non-ATTENDED reasons', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1, 2, 3],
          attendances: [
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
            { attendanceReason: { code: AttendanceReason.SICK }, status: 'COMPLETED' },
            { attendanceReason: null },
          ],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttended).toBe(1)
    })

    it('should handle null attendanceReasons', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1],
          attendances: [{ attendanceReason: null }],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttended).toBe(0)
    })
  })

  describe('totalAbsences', () => {
    it('should count attendances that are not ATTENDED', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1, 2, 3],
          attendances: [
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
            { attendanceReason: { code: AttendanceReason.SICK }, status: 'COMPLETED' },
            { attendanceReason: { code: AttendanceReason.SUSPENDED }, status: 'COMPLETED' },
          ],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAbsences).toBe(2)
    })

    it('should handle null attendanceReason', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1],
          attendances: [{ attendanceReason: null }],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAbsences).toBe(0)
    })
  })

  describe('totalNotRecorded', () => {
    it('should count attendances with null attendanceReason', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1, 2, 3],
          attendances: [
            { attendanceReason: null },
            { attendanceReason: null },
            { attendanceReason: { code: AttendanceReason.SICK } },
          ],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalNotRecorded).toBe(2)
    })

    it('should not count recorded attendances', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1],
          attendances: [{ attendanceReason: { code: AttendanceReason.ATTENDED } }],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalNotRecorded).toBe(0)
    })
  })

  describe('multiple prisoners', () => {
    it('should aggregate stats across all prisoners', () => {
      const prisoners = [
        {
          prisoner: { prisonerNumber: 'AA11AA' },
          instanceIds: [1, 2],
          attendances: [
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
            { attendanceReason: null },
          ],
        },
        {
          prisoner: { prisonerNumber: 'BB22BB' },
          instanceIds: [3, 4, 5],
          attendances: [
            { attendanceReason: { code: AttendanceReason.ATTENDED }, status: 'COMPLETED' },
            { attendanceReason: { code: AttendanceReason.SICK }, status: 'COMPLETED' },
            { attendanceReason: null },
          ],
        },
      ] as PrisonerWithAttendanceRecord[]

      const result = getResidentialLocationAttendanceStats(prisoners)

      expect(result.totalAttendees).toBe(2)
      expect(result.totalAttendanceRecords).toBe(5)
      expect(result.totalAttended).toBe(2)
      expect(result.totalAbsences).toBe(1)
      expect(result.totalNotRecorded).toBe(2)
    })
  })
})
