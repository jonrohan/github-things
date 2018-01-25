const {promisify} = require("util")
const crypto = require("crypto")

// API connection to GitHub
// https://github.com/octokit/rest.js
const octokit = require("@octokit/rest")()
octokit.authenticate({
  type: "token",
  token: process.env.GH_TOKEN
})

// API connection to mailgun
// https://github.com/bojand/mailgun-js
const mailgun = require("mailgun-js")({
  apiKey: process.env.MG_API,
  domain: process.env.MG_DOMAIN
})

const redis = require("redis")
const client = redis.createClient(process.env.REDIS_URL)

// Setup promise redis classes
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)

// Creating a redis key hex sha
const redisKey = crypto.createHmac("sha256", process.env.GH_USERNAME)
                   .update("githubthings")
                   .digest("hex")

const queries = [
  // Assigned issues
  {
    "name": "Assigned",
    "q": `is:open is:issue assignee:${process.env.GH_USERNAME} archived:false`,
    "enabled": (process.env.ASSIGNED || "true")
  },

  // Review requested
  {
    "name": "Review Requested",
    "q": `is:open is:pr review-requested:${process.env.GH_USERNAME} archived:false`,
    "enabled": (process.env.REVIEWS || "true")
  }
]

const debug = (...args) => {
  if (process.env.DEBUG == "true") {
    if (args.length > 0) {
      console.info(args.join("\n"))
    }
    return true
  }
  return false
}

// Construct the email and send it.
const emailItem = (item, queryType) => {

  // Email subject
  const subject = `<${queryType}> ${item.title} · ${item.repository_url.replace("https://api.github.com/repos/", "")}`

  // Email body
  const body = `${item.html_url}\n\n` +
               `Author: ${item.user.login}` +
               `\nOpened: ${(new Date(item.created_at)).toLocaleDateString("en-US", { "timeZone": "America/Los_Angeles" })}` +
               (item.labels.length > 0 ? `\nLabels: ${item.labels.map(l => { return `<${l.name}>`}).join(" ")}` : "")

  debug(subject + "\n--\n" + body + "\n\n-------------------------------\n\n")

  if(debug()) {
    return Promise.resolve(`${item.id}`)
  }

  return Promise.resolve(mailgun.messages().send({
      from: `GitHub Things <github-things@${process.env.MG_DOMAIN}>`,
      to: process.env.THINGS_EMAIL,
      subject: subject,
      text: body
    }))
    .then(() => `${item.id}`)
}

// Get all the queried items
Promise.all(queries.map(q => {
  if (q["enabled"] == "false") {
    return { "items": [], "type": q["name"] }
  }
  return octokit.search.issues({
    q: q["q"]
  }).then( results => {
    return { "items": results.data.items, "type": q["name"] }
  })
})).then( resultsArray => {
  return getAsync(redisKey).then(oldItems => {
    if (oldItems == null) {
      oldItems = []
    } else {
      oldItems = debug() ? [] : oldItems.split(",")
    }
    debug("OLD ITEMS: ", oldItems);
    return Promise.all(resultsArray.map( results => {
      const queryType = results["type"]

      // Remove any already sent
      return Promise.resolve(results["items"].filter(item => !oldItems.includes(`${item.id}`)))
        .then( newItems => {
          // Send issues, return ids
          return Promise.all(newItems.map(item => {
            return emailItem(item, queryType)
          }))
        }).then( sentItems => {
          if(debug("NEW ITEMS: ", sentItems)) {
            return
          }
          return setAsync(redisKey, oldItems.concat(sentItems).toString())
        })
    }))
  })
}).then(() => client.quit())
