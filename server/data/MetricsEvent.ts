import { ServiceUser } from '../@types/express'

export default class MetricsEvent {
  properties: Record<string, string | number>

  measurements: Record<string, number>

  name: string

  constructor(eventName: string, user?: ServiceUser) {
    this.name = eventName

    if (user) {
      this.properties = {
        user: user.username,
        prisonCode: user.activeCaseLoadId,
      }
    }
  }

  addProperty(name: string, value: string | number) {
    return this.addProperties({ [name]: value })
  }

  addProperties(properties: Record<string, string | number>) {
    this.properties = { ...this.properties, ...properties }
    return this
  }

  addMeasurement(name: string, value: number) {
    return this.addMeasurements({ [name]: value })
  }

  addMeasurements(measurements: Record<string, number>) {
    this.measurements = { ...this.measurements, ...measurements }
    return this
  }
}
