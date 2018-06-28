const spark = require('ciscospark/env');
const sparkController = require("./controllers/spark-controller.js");

let webhookId;

// --------------- WEBHOOKS --------------
spark.webhooks.create({
  resource: 'messages',
  event: 'created',
  targetUrl: 'https://groupbot.hollonconsulting.com:10001/webhook',
  name: 'Message Webhook'
})
.catch(function(reason) {
  console.error(reason);
  process.exit(1);
})
.then(function(webhook) {
  console.log("Webhook attached");
  webhookId = webhook.id;
});

module.exports.messages = function(body) {

  if(body.id !== webhookId) {
    spark.webhooks.remove(body.id).catch(function(e){});
    return;
  }

  sparkController.addRomm(body.data.roomId);

  spark.messages.get(body.data.id).then(function(message) {
    // let's make sure it wasn't a mesasge from groupbot
    if(!message.text.match("Groupbot")) {
      // groupbot was never tagged, means a message from groupbot
      return;
    }

    // trim the message to just the stuff concerning groupbot
    let input = message.text.replace(/.*?Groupbot/i);
    let command = /^\s+([a-zA-Z0-9]+)/.exec(input);
    if(command != null && command[1] != null) {
      command = command[1];
    }
    let directive = /^\s+([a-zA-Z0-9]+)\s+(.*)$/.exec(input);
    if(directive != null && directive[2] != null) {
      directive = directive[2];
    }

    if(command && 'function' === typeof(sparkController[command])) {
      sparkController[command](message, directive);
    } else {
      sparkController.unknown(message);
    }
  });
};
