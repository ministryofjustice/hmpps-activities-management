import { accessibilityArea } from './support/run'
import { stubAppointments } from './support/appointments'

accessibilityArea('appointments/appointment', stubAppointments)
accessibilityArea('appointments/appointment-series', stubAppointments)
accessibilityArea('appointments/appointment-set', stubAppointments)
accessibilityArea('appointments/search', stubAppointments)
