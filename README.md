![github-things-icons](https://user-images.githubusercontent.com/54012/35299834-5fb23eee-003b-11e8-92f0-eb2ea78c7247.png)

> GitHub + Things, is a standalone app to sync assigned issues to your [Things](https://culturedcode.com/things/) inbox.

## Installation

The script searches the GitHub api for new items assigned to you and uses [mailgun][mailgun] to email the issues to your [Things email][thingsmail] resulting in your inbox being filled up with these todos.

![image](https://user-images.githubusercontent.com/54012/35371538-9216d412-0149-11e8-9961-d3e17872201f.png)

### Setup

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) or Manual Setup 👇

#### 1) Heroku

This app is running on heroku with two add-ons.

- _Heroku Redis_ The default configuration is fine for this.
- _Heroku Scheduler_ The scheduler is used to run a cron job every 10 minutes hitting the `node .` script.

![image](https://user-images.githubusercontent.com/54012/35371919-d721e55e-014b-11e8-9ea3-dd3419967a6e.png)

#### 2) GitHub

Setup a [GitHub personal access token][ghtoken] and add it as `GH_TOKEN` [config variable][configv] on your Heroku instance. Add a `GH_USERNAME` [config variable][configv] to Heroku to search for your issues.

#### 3) Mailgun

Setup a [Mailgun account][mailgun] and add your API key as `MG_API` [config variable][configv]. Add your email domain as `MG_DOMAIN` [config variable][configv].

#### 4) Mail to Things

Setup your Things cloud account and [Mail to Things][thingsmail] add your email to Heroku as `THINGS_EMAIL` [config variable][configv].

### Optional configuration

By default, this app emails Assigned issues and Pull Requests you have been requested as reviewer. If you would like to turn them off, you can add `ASSIGNED` or `REVIEWS` [config variables][configv] with `false` value.

[thingsmail]:https://support.culturedcode.com/customer/en/portal/articles/2908262-using-mail-to-things
[mailgun]:https://documentation.mailgun.com/en/latest/quickstart-sending.html#how-to-start-sending-email
[ghtoken]:https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
[configv]:https://devcenter.heroku.com/articles/config-vars
