const flex = require("./flex");
const express = require("express");
const router = express.Router();
const gbm = require("./gbm");
const channelMapper = require("./channelMapper");

router.post("/flex-callback", function (req, res, next) {
  try {
    console.log("[FLEX] Callback (FLEX to GBM)");

    // When message comes from Flex (SDK), it is ok, when message comes from GBM (API), do nothing
    if (req.body.EventType == "onMessageSent" && req.body.Source == "SDK") {
      let flexChannelSid = req.body.ChannelSid;
      channelMapper.getConversationId(flexChannelSid).then((conversationId) => {
        console.log("[FLEX] GBM ConversationId: " + conversationId);
        gbm.sendMessage(req.body.Body, conversationId);
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    res.sendStatus(200);
  }
});

router.post("/flex-channel-update", function (req, res, next) {
  console.log("[FLEX] Channel Updated");

  if (req.body.EventType == "onChannelUpdated") {
    let channelSid = req.body.ChannelSid;
    let status = JSON.parse(req.body.Attributes).status;
    if (status == "INACTIVE") {
      console.log(`[FLEX] Channel '${channelSid}' is INACTIVE.`);
      channelMapper.deleteMapping(null, channelSid);
      flex.deleteChannel(channelSid);
    }
  }

  res.sendStatus(200);
});

router.post("/gbm-callback", function (req, res, next) {
  console.log("[GBM] Callback (GBM to Flex)");
  let requestBody = req.body;
  let conversationId = requestBody.conversationId;

  if (requestBody.message?.text !== undefined) {
    let message = requestBody.message.text;

    console.log("[GBM] conversationId: " + conversationId);
    console.log("[GBM] message: " + message);

    let username = requestBody.context.userInfo.displayName;
    console.log("[GBM] Username: " + username);

    channelMapper.getFlexChannelSid(conversationId).then((flexChannelSid) => {
      if (flexChannelSid === undefined) {
        flex.createChannel(username).then((channelSid) => {
          console.log(`[GBM] Flex Channel created (${channelSid})`);
          channelMapper.addMapping(conversationId, channelSid).then(() => {
            flex.sendMessage(message, username, channelSid);
          });
        });
      } else {
        console.log(`[GBM] Using existing Flex Channel (${flexChannelSid})`);
        flex.sendMessage(message, username, flexChannelSid);
      }
    });
  } else if (requestBody.userStatus !== undefined) {
    if (requestBody.userStatus.isTyping !== undefined) {
      console.log("[GBM] User is typing");
    } else if (requestBody.userStatus.requestedLiveAgent !== undefined) {
      console.log("[GBM] User requested transfer to live agent");
    }
  }

  res.sendStatus(200);
});

module.exports = router;
