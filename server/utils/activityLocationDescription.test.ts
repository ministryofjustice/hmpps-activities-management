import { ActivitySchedule } from '../@types/activitiesAPI/types'
import activityLocationDescription from './activityLocationDescription'

describe('activityLocationDescription', () => {
  it('should return internal location description if set', () => {
    const activitySchedule = {
      activity: {
        // These shouldn't be true when internal location set, but confirms correct priority
        inCell: true,
        onWing: true,
        offWing: true,
      },
      internalLocation: {
        description: 'Location 1',
      },
    } as unknown as ActivitySchedule

    const result = activityLocationDescription(activitySchedule)
    expect(result).toEqual('Location 1')
  })

  it('should return "In cell" as location description if no internal location set, but activity is in cell', () => {
    const activitySchedule = {
      activity: {
        inCell: true,
      },
      internalLocation: null,
    } as unknown as ActivitySchedule

    const result = activityLocationDescription(activitySchedule)
    expect(result).toEqual('In cell')
  })

  it('should return "On wing" as location description if no internal location set, but activity is on wing', () => {
    const activitySchedule = {
      activity: {
        onWing: true,
      },
      internalLocation: null,
    } as unknown as ActivitySchedule

    const result = activityLocationDescription(activitySchedule)
    expect(result).toEqual('On wing')
  })

  it('should return "Off wing" as location description if no internal location set, but is off wing', () => {
    const activitySchedule = {
      activity: {
        offWing: true,
      },
      internalLocation: null,
    } as unknown as ActivitySchedule

    const result = activityLocationDescription(activitySchedule)
    expect(result).toEqual('Off wing')
  })

  it('should return "None set" when no location information is avaliable', () => {
    // This shouldn't be possible, but if for some reason it happens, provide a default
    const activitySchedule = {
      activity: {},
      internalLocation: null,
    } as unknown as ActivitySchedule

    const result = activityLocationDescription(activitySchedule)
    expect(result).toEqual('None set')
  })
})
