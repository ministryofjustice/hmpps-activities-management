import promClient from 'prom-client'
import { createMetricsApp } from './monitoring/metricsApp'
import createApp from './app'
import services from './services'
import dataAccess from './data'

promClient.collectDefaultMetrics()

const app = createApp(services(), dataAccess())
const metricsApp = createMetricsApp()

export { app, metricsApp }
