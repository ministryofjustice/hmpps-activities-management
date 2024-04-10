import AlertsFilterService from './alertsFilterService'
import { PrisonerAlert } from '../@types/prisonerOffenderSearchImport/types'

const alertsFilterService = new AlertsFilterService()

describe('Alerts Filter service', () => {
  describe('Categories', () => {
    it('should only return a category if it matches the supplied filters', async () => {
      const filteredCategory = alertsFilterService.getFilteredCategory(['CAT_A'], 'E')

      expect(filteredCategory).toEqual('E')
    })

    it('should not return a category if it does not match the supplied filters', async () => {
      const filteredCategory = alertsFilterService.getFilteredCategory(['CAT_A'], 'H')

      expect(filteredCategory).toBeUndefined()
    })

    it('should not return a category if it is unknown', async () => {
      const filteredCategory = alertsFilterService.getFilteredCategory(['CAT_A'], 'X')

      expect(filteredCategory).toBeUndefined()
    })

    it('should not return a category if filter is unknown', async () => {
      const filteredCategory = alertsFilterService.getFilteredCategory(['JUNK'], 'A')

      expect(filteredCategory).toBeUndefined()
    })
  })

  describe('Alerts', () => {
    it('should only return alerts if they matches the supplied filters', async () => {
      const prisonerAlerts = [{ alertCode: 'XEL' }, { alertCode: 'PEEP' }] as PrisonerAlert[]
      const filteredCategory = alertsFilterService.getFilteredAlerts(['ALERT_HA', 'ALERT_XEL'], prisonerAlerts)

      expect(filteredCategory).toEqual([{ alertCode: 'XEL' }])
    })

    it('should return empty alerts if they are not in the filter', async () => {
      const prisonerAlerts = [{ alertCode: 'XEL' }, { alertCode: 'PEEP' }] as PrisonerAlert[]
      const filteredCategory = alertsFilterService.getFilteredAlerts(['ALERT_HA'], prisonerAlerts)

      expect(filteredCategory).toHaveLength(0)
    })

    it('should not return any unrecognised alerts', async () => {
      const prisonerAlerts = [{ alertCode: 'XEL' }, { alertCode: 'JUNK' }] as PrisonerAlert[]
      const filteredCategory = alertsFilterService.getFilteredAlerts(['ALERT_HA', 'ALERT_XEL'], prisonerAlerts)

      expect(filteredCategory).toEqual([{ alertCode: 'XEL' }])
    })

    it('should handle empty alerts', async () => {
      const filteredCategory = alertsFilterService.getFilteredAlerts(['ALERT_HA', 'ALERT_XEL'], [])

      expect(filteredCategory).toHaveLength(0)
    })

    it('should handle undefined alerts', async () => {
      const filteredCategory = alertsFilterService.getFilteredAlerts(['ALERT_HA', 'ALERT_XEL'], undefined)

      expect(filteredCategory).toBeUndefined()
    })
  })
})
