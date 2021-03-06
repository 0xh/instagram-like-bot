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

const { BOT_IG_USERNAME, BOT_IG_PASSWORD, BOT_TARGET_INTERVAL,
  BOT_SPAM_CRON, BOT_GUARD_CRON, REDIS_KEY_PREFIX } = process.env
const COOKIE_FILE_PATH = path.resolve(__dirname, `../../cookies/${BOT_IG_USERNAME}.json`)

const device = new Client.Device(`GOOGLE_PIXEL_PANDA_${BOT_IG_USERNAME}`)
const storage = new Client.CookieFileStorage(COOKIE_FILE_PATH)

const generateGuard = (ctx, cron) => new Cron({
  cronTime: cron,
  onTick: function () {
    console.log('Running spam guard')
    return (this.running) ? this.stop() : this.start()
  },
  context: ctx,
  start: false,
  timeZone: 'Asia/Jakarta'
})

const generateSpam = (session, cron, interval) => new Cron({
  cronTime: cron,
  onTick: async function () {
    let userMediaId = await client.lpopAsync(REDIS_KEY_PREFIX + BOT_IG_USERNAME)
    if (!userMediaId) return this.stop()

    try {
      await Client.Like.create(session, userMediaId)
      console.log(`Media ${userMediaId} has been liked`)

      if (this.isActionSpamError) {
        this.isActionSpamError = !this.isActionSpamError
        this.setTime(new CronTime(cron))
        this.start()
      }
    } catch (error) {
      console.error(`Failed to like ${userMediaId}`, error.name)
      if (!this.isActionSpamError && error.name === 'ActionSpamError') {
        this.isActionSpamError = true
        this.setTime(new CronTime(moment().add(interval, 'hours').toDate()))
        this.start()
      }
    }
  },
  onComplete: function () {
    return (this.isActionSpamError) ? console.log('ActionSpamError detected') : console.log('No more ids')
  },
  start: false,
  timeZone: 'Asia/Jakarta'
})

try {
  (() => new CronTime(BOT_SPAM_CRON))()
} catch (error) {
  console.error('Invalid cron pattern...') && process.exit(1)
}

Client.Session.create(device, storage, BOT_IG_USERNAME, BOT_IG_PASSWORD)
  .then((session) => {
    console.log('Start spamming')
    const spam = generateSpam(session, BOT_SPAM_CRON, BOT_TARGET_INTERVAL)
    spam.start()

    const guard = generateGuard(spam, BOT_GUARD_CRON)
    guard.start()
  })
  .catch((error) => (console.error(error) && process.exit(1)))
