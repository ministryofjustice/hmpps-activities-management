import { getOtherEventsSummary, mapToTableRow, getAlertValues } from './activityListHelper'
import activityListItem1 from '../../../services/fixtures/activity_list_item_1.json'

describe('activityListHelper', () => {
  describe('getOtherEventsSummary', () => {
    it('Success', async () => {
      const summary = getOtherEventsSummary(activityListItem1)
      expect(summary).toEqual(
        'Release scheduled, description1 , ' +
          'description2 (cancelled), description3 (expired), description4 (complete), description5 , ' +
          'description1 , description2 (cancelled), description3 (expired), description4 (complete), ' +
          'description5 , 13:15 - 16:15 - PICTA PM',
      )
    })
  })
  describe('mapToTableRow', () => {
    it('Success', async () => {
      const row = mapToTableRow(activityListItem1)
      expect(row).toEqual({
        activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
        bookingId: 1148278,
        eventId: 484055183,
        location: 'MDI-2-1-035',
        name: 'Colt, Barnett',
        otherActivities:
          'Release scheduled, description1 , description2 (cancelled), description3 (expired), description4 (complete), description5 , description1 , description2 (cancelled), description3 (expired), description4 (complete), description5 , 13:15 - 16:15 - PICTA PM',
        prisonNumber: 'G3577UD',
        relevantAlerts: [],
      })
    })
  })
  describe('getAlertValues', () => {
    it('Success', async () => {
      const alertFlags = ['HA', 'RCDR', 'SO']
      const alertValues = getAlertValues(alertFlags, 'A')
      expect(alertValues.length).toEqual(3)
    })
  })
})
