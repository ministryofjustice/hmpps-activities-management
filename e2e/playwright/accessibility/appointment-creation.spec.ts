import { accessibilityArea } from './support/run'
import { appointmentJourney, stubAppointments } from './support/appointments'

accessibilityArea('appointments/create-and-edit', stubAppointments, appointmentJourney)
