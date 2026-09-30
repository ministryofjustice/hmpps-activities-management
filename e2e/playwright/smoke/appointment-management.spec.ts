import { smokeArea } from './support/run'
import { stubAppointments } from './support/appointments'

smokeArea('appointments/appointment', stubAppointments)
smokeArea('appointments/appointment-series', stubAppointments)
smokeArea('appointments/appointment-set', stubAppointments)
smokeArea('appointments/search', stubAppointments)
