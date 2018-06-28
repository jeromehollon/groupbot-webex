var spark = require('ciscospark/env');
var sparkController = require("./controllers/spark-controller.js");

var webhookId;

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

  if(body.id != webhookId) {
    spark.webhooks.remove(body.id).catch(function(e){});
    return;
  }

  sparkController.addRomm(body.data.roomId);

  spark.messages.get(body.data.id).then(function(message) {
    var parsed = /^\s*Groupbot\s([a-zA-Z0-9]*) (.*)$/.exec(message.text);
    if(parsed == null) {
      // might be a single token command
      parsed = /^\s*Groupbot\s([a-zA-Z0-9]*)$/.exec(message.text);
    }

    if(parsed && parsed[1] && 'function' === typeof(sparkController[parsed[1]])) {
      sparkController[parsed[1]](message, parsed[2]);
    } else if(message.text.match(/^\s*Groupbot\s/)){
      sparkController.unknown(message);
    }
  });
};
