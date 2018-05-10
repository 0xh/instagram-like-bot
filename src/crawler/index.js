import path from 'path'
import _ from 'lodash'
import redis from 'redis'
import dotenv from 'dotenv'
import Promise from 'bluebird'
import ora from 'ora'
import { V1 as Client } from 'instagram-private-api'

dotenv.load()

Promise.promisifyAll(redis)
const client = redis.createClient({ db: 2 })

const { BOT_IG_USERNAME, BOT_IG_PASSWORD, BOT_TARGET_USERNAME,
  BOT_TARGET_LIMIT, BOT_TARGET_INDEX, BOT_MEDIA_LIMIT, BOT_DEVICE_PREFIX } = process.env
const COOKIE_FILE_PATH = path.resolve(__dirname, `../../cookies/${BOT_IG_USERNAME}.json`)
const REDIS_LIST_KEY = `_LIST__${BOT_IG_USERNAME}_${BOT_TARGET_USERNAME}`

const device = new Client.Device(`${BOT_DEVICE_PREFIX}_${BOT_IG_USERNAME}`)
const storage = new Client.CookieFileStorage(COOKIE_FILE_PATH)

const getUserMedia = async (session, id, limit = false) => {
  spinner.start(`Fetching magic ingredient #${id}...`)
  let feed = new Client.Feed.UserMedia(session, id, limit)
  feed.map = medium => medium.params
  return feed.all()
    .catch((error) => error && Promise.resolve(undefined))
}

const getLikers = (session, id) => Client.Media.likers(session, id)
  .then((likers) => Promise.resolve(likers.map((liker) => liker.params)))

const getLikersMedia = (session, media, index = 1) =>
  Promise.map(media, (medium) => getLikers(session, medium.id), { concurrency: 5 })
    .then((likers) => Promise.resolve(_.uniq(_.flatten(likers))))
    .then((likers) => Promise.map(_.slice(likers, 0, BOT_MEDIA_LIMIT), (liker) =>
      getUserMedia(session, liker.id, 1), { concurrency: 5 }))
    .then((media) => Promise.resolve(_.compact(media).map(medium =>
      (_.nth(medium, index)) ? _.nth(medium, index).id : undefined)))
    .catch((error) => console.log(error) && Promise.reject(error))

const storeMediaToRedis = (redisClient, key, media) =>
  redisClient.rpushAsync.apply(redisClient, [key].concat(_.compact(media)))

const spinner = ora('Starting magic generator machine...').start()
Client.Session.create(device, storage, BOT_IG_USERNAME, BOT_IG_PASSWORD)
  .then((session) => {
    return Client.Account.searchForUser(session, BOT_TARGET_USERNAME)
      .then((account) => getUserMedia(session, account.params.id, BOT_TARGET_LIMIT))
      .then((media) => getLikersMedia(session, media, BOT_TARGET_INDEX))
      .tap((media) => storeMediaToRedis(client, REDIS_LIST_KEY, media))
      .then((media) => {
        spinner.succeed(`${media.length} magics created at ${REDIS_LIST_KEY}...`)
        return process.exit(0)
      })
  })
  .catch((error) => (console.error(error) && process.exit(1)))
