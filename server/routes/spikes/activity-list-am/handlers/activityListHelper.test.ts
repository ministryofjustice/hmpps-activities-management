import { getAlertValues, mapToTableRow } from './activityListHelper'
import activityScheduleAllocation1 from '../../../../services/fixtures/activity_schedule_allocation_1.json'

describe('activityListHelper', () => {
  describe('mapToTableRow', () => {
    it('Success', async () => {
      const row = mapToTableRow(activityScheduleAllocation1[0])
      expect(row).toEqual({
        activity: 'Wednesday AM Houseblock 3',
        id: 3,
        location: 'MDI-3-3-006',
        name: 'Daniels, Jack',
        prisonNumber: 'G3439UH',
        relevantAlerts: ['ACCT'],
      })
    })
  })
  describe('getAlertValues', () => {
    it('Success', async () => {
      const alertValues = getAlertValues(activityScheduleAllocation1[0].prisoner.alerts, 'A')
      expect(alertValues.length).toEqual(2)
    })
  })
})
