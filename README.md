# Instagram Like Bot

![logo](https://cloud.githubusercontent.com/assets/1809268/15931032/2792427e-2e56-11e6-831e-ffab238cc4a2.png)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

> **I DO NOT USE THIS FOR SPAM, HOPE YOU WILL NOT EITHER.**

### Prerequisites

What things you need to install the software and how to install them. Make sure you have installed all of the following prerequisites on your development machine:

**Redis** - Go through [Redis Official](https://redis.io) website and proceed to their [Official Quickstart](https://redis.io/topics/quickstart), which should help you install and understand Redis better.

If you are using OS X you can install Redis using [Homebrew](https://brew.sh).

``` bash
brew install redis
brew services start redis
```

To check wether Redis is up and running you can simple running Redis PING command which should give you PONG result.

``` bash
redis-cli PING
```

Additionally, it's highly recomended for you to install these package as a global module.

```
npm install -g standard nodemon pm2 yarn
```

### Installing

A step by step series of examples that tell you have to get a development env running. The easiest way to get started is to clone the repository.

```
# Get the latest snapshot
git clone https://github.com/husnulhamidiah/instagram-like-bot.git instagram-bot

# Change directory
cd instagram-bot

# Install dependencies
yarn

# Copy environtment variables file
cp .env.example .env
```

Edit this bot configuration in `.env` file you just copied. This file must have this following keys.

```
# Your instagram credentials
BOT_IG_USERNAME=
BOT_IG_PASSWORD=

# Which instagram account to use as a target. This bot will fetch likers from this account.
BOT_TARGET_USERNAME=

# Limit how many post from target should this bot fetch, leave it blank to fetch all post.
BOT_TARGET_LIMIT=10

# What post should this bot pick from likers. It should be between 1 - 18.
BOT_TARGET_INDEX=2

# Like interval (in hours) in case you get banned
BOT_TARGET_INTERVAL=1

# Limit how many likers do you want to fetch
BOT_MEDIA_LIMIT=100

# Cron to run instagram like. It mush be a valid cron pattern
BOT_SPAM_CRON=* * * * *

# Unique identifier for your instagram session
BOT_DEVICE_PREFIX=
```

Once you've installed all the prerequisites and configure your bot, you're just one command away to run it.

Run crawler to get liker's ids and save it to Redis. It may takes a while depending on your configuration and hardware resources.

```
yarn start src/crawler/index.js
```

After it done, now you can run the actual instagram like bot.

```
yarn start src/spammer/index.js
```

### Run using PM2

In case you need to run this bot as a background service (which I highly recomended), you can use built-in script to run it with [PM2](http://pm2.keymetrics.io/).

```
yarn pm2-crawler
```

```
yarn pm2-spammer
```

## Frequently Asked Question (FAQ)

#### Why I cannot login

1. There's a typo in your credentials. Double check yours in `.env` file.

2. Instagram detect as an unsual login. This probably happens if you are loged in from a device then you are running this bot on a VPS that has IP originate from different country or even continent from your device. Usually you need to confirm your login on your mobile device.

3. Your device is not unique because somehow Instagram check device that we used to login. If this happens try to change `BOT_DEVICE_PREFIX` value in `.env` file.

4. Last but not least, you probably banned permanently by Instagram.

#### Why my account cannot like any post

This probably you hit the Instagram like limit. You have to wait for 24 hours before be able to like again. It will be good if you set your cron with longer interval.


## Contribution

As I use this for my own projects, I know this might not be the perfect approach for all the projects out there.
If you have ideas or feature requests please feel free to open an issue on this Github page. Pull requests are welcome also.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.






