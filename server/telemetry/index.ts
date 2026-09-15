// Initialise instrumentation before diagnostics import the application logger.
import './azureAppInsights'

import installConnectionResetDiagnostics from './connectionResetDiagnostics'

installConnectionResetDiagnostics()
