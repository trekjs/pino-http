/*!
 * pino-http
 * Copyright(c) 2017 Fangdun Cai <cfddream@gmail.com> (https://fundon.me)
 * MIT Licensed
 */

'use strict'

module.exports = pinoHttp

const defaults = {
  level: 'info',
  skip: false
}

function pinoHttp(options, logger) {
  options = Object.assign({}, defaults, options)

  logger = logger || require('pino')()

  const { level, skip } = options

  if (skip !== false && typeof skip !== 'function') {
    throw new TypeError('option skip must be function')
  }

  return logging

  async function logging(ctx, next) {
    if (skip && skip(ctx, options)) return next()

    const start = Date.now()
    const { req, res, rawRes } = ctx

    logger[level](
      {
        req: req.toJSON()
      },
      'request started'
    )

    try {
      await next()
    } catch (err) {
      logger.error(
        {
          err,
          res: res.toJSON(),
          responseTime: Date.now() - start
        },
        'request errored'
      )
      throw err
    }

    rawRes.once('finish', done)
    rawRes.once('close', done)

    function done(err) {
      this.removeListener('finish', done)
      this.removeListener('error', done)

      if (err) {
        logger.error(
          {
            err,
            res: res.toJSON(),
            responseTime: Date.now() - start
          },
          'request errored'
        )
        return
      }

      logger[level](
        {
          res: res.toJSON(),
          responseTime: Date.now() - start
        },
        'request completed'
      )
    }
  }
}
