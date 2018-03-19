# Instagram Like Bot

![logo](https://cloud.githubusercontent.com/assets/1809268/15931032/2792427e-2e56-11e6-831e-ffab238cc4a2.png)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

> **I DO NOT USE THIS FOR SPAM, HOPE YOU WILL NOT EITHER.**

### How it actually works

Basicly this bot contains two main services. First is crawler, this service will fetch Instagram post Ids and save it to redis. Next services is spammer, this is just a cron which perform like to Instagram post saved in redis one-by-one. In a nutshell, this bot will do these following things :

  - Fetch @instagram post
  - For each @instagram post, fetch its likers
  - For each likers, fetch his/her first post
  - Save all likers' post to redis
  - For each cron tick, like an instagram post
  
### Prerequisites

What things you need to install the software and how to install them. Make sure you have installed all of the following prerequisites on your development machine:

**Redis** - Go through [Redis Official](https://redis.io) website and proceed to their [Official Quickstart](https://redis.io/topics/quickstart), which should help you install and understand Redis better.

Additionally, it's highly recomended for you to install these package as a global module.

```
$ npm install -g yarn standard nodemon pm2
```

### Installing

A step by step series of examples that tell you have to get a development env running. The easiest way to get started is to clone the repository.

```
$ git clone https://github.com/husnulhamidiah/instagram-like-bot.git instagram-bot
$ cd instagram-bot
$ yarn
$ cp .env.example .env
```

Edit this bot configuration in `.env` file you just copied. This file must have this following keys.

```
# Your instagram credentials
BOT_IG_USERNAME=
BOT_IG_PASSWORD=

# Instagram account as a target
BOT_TARGET_USERNAME=

# Target post's limit
BOT_TARGET_LIMIT=10

# Liker's post index
BOT_TARGET_INDEX=2

# Interval (in hours) if you get banned
BOT_TARGET_INTERVAL=1

# Likers to get limit
BOT_MEDIA_LIMIT=100

# Cron to run instagram like
BOT_SPAM_CRON=* * * * *

# Unique identifier for instagram session
BOT_DEVICE_PREFIX=
```

Once you've installed all the prerequisites and configure your bot, you're just one command away to run it.

Run crawler to get liker's ids and save it to Redis. It may takes a while depending on your configuration and hardware resources.

```
$ yarn start src/crawler
```

After it done, now you can run the actual instagram like bot.

```
$ yarn start src/spammer
```

## Frequently Asked Question (FAQ)

#### Why I cannot login

  - There's a typo in your credentials. Double check yours in `.env` file.

  - Instagram detect as an unsual login. This probably happens if you are loged in from a device then you are running this bot on a VPS that has IP originate from different country or even continent from your device. Usually you need to confirm your login on your mobile device.

  - Your device is not unique because somehow Instagram check device that we used to login. If this happens try to change `BOT_DEVICE_PREFIX` value in `.env` file.

  - Last but not least, you probably banned permanently by Instagram.

#### Why my account cannot like any post

  - This probably you hit the Instagram like limit. You have to wait for 24 hours before be able to like again. It will be good if you set your cron with longer interval.


## Contribution

As I use this for my own projects, I know this might not be the perfect approach for all the projects out there.
If you have ideas or feature requests please feel free to open an issue on this Github page. Pull requests are welcome also.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.






