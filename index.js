var app = require("./router.js");

var greenlock = require('greenlock-express').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, switch to staging to debug
  // https://acme-staging-v02.api.letsencrypt.org/directory

  // You MUST change this to a valid email address
, email: 'jerome.hollon.contractor@hilton.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, approveDomains: [ 'groupbot.hollonconsulting.com' ]

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

, app: app 

  // Join the community to get notified of important updates and help me make greenlock better
, communityMember: true

  // Contribute telemetry data to the project
, telemetry: true

//, debug: true
}).listen(10000,10001);
