import createApp from './app'
import services from './services'
import dataAccess from './data'

const app = createApp(services(), dataAccess())

export default app
