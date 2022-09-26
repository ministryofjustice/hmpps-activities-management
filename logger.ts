import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'

const formatOut = bunyanFormat({ outputMode: 'short', color: true })

const logger = bunyan.createLogger({ name: 'Hmpps Activities Management', stream: formatOut, level: 'debug' })

if (process.env.NODE_ENV === 'unit-test') {
  logger.level(bunyan.FATAL + 1)
}

export default logger
