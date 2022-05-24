require("dotenv").config();

const fetch = require("node-fetch");
const { URLSearchParams } = require("url");
const base64 = require("base-64");

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

let flex = {};

/**
 * Sends the message to Flex
 *
 * @param {string} message The message to be sent to Flex
 * @param {string} chatUserName The user that wants to send a message
 * @param {string} channelSid The Channel SID where the message should be sent
 * @returns Flex result
 */
flex.sendMessage = (message, chatUserName, channelSid) => {
  console.log(
    `[FLEX] Sending message '${message}' from user '${chatUserName}' (Channel: ${channelSid})`
  );
  const params = new URLSearchParams();
  params.append("Body", message);
  params.append("From", chatUserName);
  return fetch(
    `https://chat.twilio.com/v2/Services/${process.env.FLEX_CHAT_SERVICE}/Channels/${channelSid}/Messages`,
    {
      method: "post",
      body: params,
      headers: {
        "X-Twilio-Webhook-Enabled": "true",
        Authorization: `Basic ${base64.encode(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        )}`,
      },
    }
  );
};

/**
 * Creates a channel for Flex communications
 *
 * @param {string} chatUserName The name of the user creating the channel
 * @returns The channel Sid
 */
flex.createChannel = (chatUserName) => {
  return client.flexApi.channel
    .create({
      flexFlowSid: process.env.FLEX_FLOW_SID,
      identity: chatUserName,
      chatUserFriendlyName: chatUserName,
      chatFriendlyName: "Google Business Messages",
      target: chatUserName,
    })
    .then((channel) => {
      return client.chat
        .services(process.env.FLEX_CHAT_SERVICE)
        .channels(channel.sid)
        .webhooks.create({
          type: "webhook",
          "configuration.method": "POST",
          "configuration.url": `${process.env.WEBHOOK_BASE_URL}/flex-callback?channel=${channel.sid}`,
          "configuration.filters": ["onMessageSent"],
        })
        .then(() =>
          client.chat
            .services(process.env.FLEX_CHAT_SERVICE)
            .channels(channel.sid)
            .webhooks.create({
              type: "webhook",
              "configuration.method": "POST",
              "configuration.url": `${process.env.WEBHOOK_BASE_URL}/flex-channel-update`,
              "configuration.filters": ["onChannelUpdated"],
            })
        );
    })
    .then((webhook) => {
      console.log("[FLEX] Channel Created");
      return webhook.channelSid;
    })
    .catch((error) => {
      console.error("[FLEX] Channel creation error!");
      console.error(error);
    });
};

flex.deleteChannel = (channelSid) => {
  client.flexApi.v1.channel(channelSid).remove((error, items) => {
    if (error) {
      console.error(error);
    } else {
      console.log("[FLEX] Channel deleted");
    }
  });
};

module.exports = flex;
