import { smokeArea } from './support/run'
import { appointmentJourney, stubAppointments } from './support/appointments'

smokeArea('appointments/create-and-edit', stubAppointments, appointmentJourney)
