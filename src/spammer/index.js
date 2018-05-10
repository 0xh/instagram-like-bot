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
  BOT_TARGET_INTERVAL, BOT_SPAM_CRON, BOT_GUARD_CRON, BOT_DEVICE_PREFIX } = process.env
const COOKIE_FILE_PATH = path.resolve(__dirname, `../../cookies/${BOT_IG_USERNAME}.json`)
const REDIS_LIST_KEY = `_LIST__${BOT_IG_USERNAME}_${BOT_TARGET_USERNAME}`

const device = new Client.Device(`${BOT_DEVICE_PREFIX}_${BOT_IG_USERNAME}`)
const storage = new Client.CookieFileStorage(COOKIE_FILE_PATH)

const generateGuard = (ctx, cron) => new Cron({
  cronTime: cron,
  onTick: function () {
    spinner.info('Running spam guard')
    return (this.running) ? this.stop() : this.start()
  },
  context: ctx,
  start: false,
  timeZone: 'Asia/Jakarta'
})

const generateSpam = (session, cron, interval) => new Cron({
  cronTime: cron,
  onTick: async function () {
    let userMediaId = await client.lpopAsync(REDIS_LIST_KEY)
    if (!userMediaId) return this.stop()

    try {
      await Client.Like.create(session, userMediaId)
      spinner.succeed(`Media ${userMediaId} has been liked`)

      if (this.isActionSpamError) {
        this.isActionSpamError = !this.isActionSpamError
        this.setTime(new CronTime(cron))
        this.start()
      }
    } catch (error) {
      spinner.fail(`Failed to like ${userMediaId}`, error.name)
      if (!this.isActionSpamError && error.name === 'ActionSpamError') {
        this.isActionSpamError = true
        this.setTime(new CronTime(moment().add(interval, 'hours').toDate()))
        this.start()
      }
    }
  },
  onComplete: function () {
    return (this.isActionSpamError) ? spinner.info('ActionSpamError detected') : spinner.info('No more ids')
  },
  start: false,
  timeZone: 'Asia/Jakarta'
})

const spinner = ora('Start spamming...').start()

try {
  (() => new CronTime(BOT_SPAM_CRON))()
} catch (error) {
  spinner.fail('Invalid cron pattern...') && process.exit(1)
}

Client.Session.create(device, storage, BOT_IG_USERNAME, BOT_IG_PASSWORD)
  .then((session) => {
    const spam = generateSpam(session, BOT_SPAM_CRON, BOT_TARGET_INTERVAL)
    spam.start()

    const guard = generateGuard(spam, BOT_GUARD_CRON)
    guard.start()
  })
  .catch((error) => (console.error(error) && process.exit(1)))
