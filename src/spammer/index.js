'use strict'

import path from 'path'
import redis from 'redis'
import dotenv from 'dotenv'
import moment from 'moment'
import Promise from 'bluebird'
import ora from 'ora'
import { CronJob as Cron, CronTime } from 'cron'
import { V1 as Client } from 'instagram-private-api'

dotenv.load()

Promise.promisifyAll(redis)
const client = redis.createClient({ db: 2 })

const { BOT_IG_USERNAME, BOT_IG_PASSWORD, BOT_TARGET_USERNAME,
  BOT_TARGET_INTERVAL, BOT_SPAM_CRON, BOT_DEVICE_PREFIX } = process.env
const COOKIE_FILE_PATH = path.resolve(__dirname, `../../cookies/${BOT_IG_USERNAME}.json`)
const REDIS_LIST_KEY = `_LIST__${BOT_IG_USERNAME}_${BOT_TARGET_USERNAME}`

const device = new Client.Device(`${BOT_DEVICE_PREFIX}_${BOT_IG_USERNAME}`)
const storage = new Client.CookieFileStorage(COOKIE_FILE_PATH)

const spammerProccess = (session, cron) => new Cron({
  cronTime: cron,
  onTick: async function () {
    let userMediaId = await client.lpopAsync(REDIS_LIST_KEY)
    if (!userMediaId) return this.stop()

    return Client.Like.create(session, userMediaId)
      .then((like) => {
        spinner.succeed(`Releasing magic #${userMediaId}...`)
        if (this.isActionSpamError) {
          this.isActionSpamError = false
          this.setTime(new CronTime(cron)) && this.start()
        }
      })
      .catch((error) => {
        spinner.fail('Blocked by magic resitance %s', error.name)

        if (!this.isActionSpamError && error.name === 'ActionSpamError') {
          const cronFiller = moment().add(BOT_TARGET_INTERVAL, 'hours').toDate()
          this.isActionSpamError = true
          this.setTime(new CronTime(cronFiller)) && this.start()
        }
      })
  },
  onComplete: function () {
    return (this.isActionSpamError)
      ? spinner.info('Unblocking magic resistance...')
      : spinner.info('Running out of magic...')
  },
  start: false,
  timeZone: 'Asia/Jakarta'
})

const spinner = ora('Starting magic party...').start()

try {
  (() => new CronTime(BOT_SPAM_CRON))()
} catch (error) {
  spinner.fail('Invalid cron pattern...') && process.exit(1)
}

Client.Session.create(device, storage, BOT_IG_USERNAME, BOT_IG_PASSWORD)
  .then((session) => spammerProccess(session, BOT_SPAM_CRON).start())
  .catch((error) => (console.error(error) && process.exit(1)))
