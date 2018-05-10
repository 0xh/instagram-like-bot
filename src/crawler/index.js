import path from 'path'
import _ from 'lodash'
import redis from 'redis'
import dotenv from 'dotenv'
import Promise from 'bluebird'
import ora from 'ora'
import { V1 as Client } from 'instagram-private-api'

dotenv.config()

Promise.promisifyAll(redis)
const redisClient = redis.createClient({ db: 2 })

const { BOT_IG_USERNAME, BOT_IG_PASSWORD, BOT_TARGET_USERNAME,
  BOT_MEDIA_LIMIT, BOT_LIKER_LIMIT, BOT_TARGET_INDEX, REDIS_KEY_PREFIX } = process.env

const device = new Client.Device(`GOOGLE_PIXEL_PANDA_${BOT_IG_USERNAME}`)
const storage = new Client.CookieFileStorage(path.resolve(__dirname, `../../cookies/${BOT_IG_USERNAME}.json`))

const getUserMedia = (session, id, limit = false) => {
  spinner.start(`Fetching ${id} media`)
  let feed = new Client.Feed.UserMedia(session, id, limit)
  feed.map = medium => medium.params
  return feed.all().catch((error) => error && Promise.resolve(undefined))
}

const getLikers = async (session, id) => {
  try {
    const likers = await Client.Media.likers(session, id)
    return Promise.resolve(likers.map(liker => liker.params))
  } catch (error) {
    return Promise.resolve(undefined)
  }
}

const getLikersMedia = async (session, media, index = 1) => {
  try {
    const likers = await Promise.map(media, (medium) => getLikers(session, medium.id), { concurrency: 5 })
    const userMedia = await Promise.map(_.compact(_.slice(_.uniq(_.flatten(likers)), 0, BOT_LIKER_LIMIT)), (liker) => getUserMedia(session, liker.id, 1), { concurrency: 5 })
    return Promise.resolve(_.compact(userMedia).map(medium => (_.nth(medium, index)) ? _.nth(medium, index).id : undefined))
  } catch (error) {
    return Promise.reject(error)
  }
}

const storeMediaToRedis = (client, key, media) => {
  spinner.start(`Saving media to redis`)
  return client.rpushAsync.apply(client, [key].concat(_.compact(media)))
}

const spinner = ora('Starting crawler bot').start();

(async () => {
  try {
    const session = await Client.Session.create(device, storage, BOT_IG_USERNAME, BOT_IG_PASSWORD)
    const account = await Client.Account.searchForUser(session, BOT_TARGET_USERNAME)
    const userMedia = await getUserMedia(session, account.params.id, BOT_MEDIA_LIMIT)
    const likersMedia = await getLikersMedia(session, userMedia, BOT_TARGET_INDEX)
    await storeMediaToRedis(redisClient, REDIS_KEY_PREFIX + BOT_IG_USERNAME, likersMedia)

    spinner.succeed(`Successfully save ${likersMedia.length} media`)
    return process.exit(0)
  } catch (error) {
    console.log(error)
    return process.exit(1)
  }
})()
