const { Firestore } = require("@google-cloud/firestore");

// Create a new client
const firestore = new Firestore();
let channelMapper = {};

channelMapper.addMapping = async (conversationId, flexChannelSid) => {
  console.log(`adding mapping for C:${conversationId} and F:${flexChannelSid}`);
  await firestore.collection("channelmappings").add({
    ConversationId: conversationId,
    FlexChannelSid: flexChannelSid,
  });
};

channelMapper.getFlexChannelSid = async (conversationId) => {
  const mapping = await firestore
    .collection("channelmappings")
    .where("ConversationId", "==", conversationId)
    .get();
  if (mapping.docs.length > 0) {
    console.log("[CHANNEL MAPPER] Found!");
    return mapping.docs[0].get("FlexChannelSid");
  } else {
    console.log("[CHANNEL MAPPER] Not found!");
    return undefined;
  }
};

channelMapper.getConversationId = async (flexChannelSid) => {
  const mapping = await firestore
    .collection("channelmappings")
    .where("FlexChannelSid", "==", flexChannelSid)
    .get();
  if (mapping.docs.length > 0) {
    console.log("[CHANNEL MAPPER] Found!");
    return mapping.docs[0].get("ConversationId");
  } else {
    console.log("[CHANNEL MAPPER] Not found!");
    return undefined;
  }
};

channelMapper.deleteMapping = async (conversationId, flexChannelSid) => {
  let mapping = undefined;
  if (conversationId !== null && conversationId !== undefined) {
    mapping = await firestore
      .collection("channelmappings")
      .where("ConversationId", "==", conversationId)
      .get();
  } else if (flexChannelSid !== null && flexChannelSid !== undefined) {
    mapping = await firestore
      .collection("channelmappings")
      .where("FlexChannelSid", "==", flexChannelSid)
      .get();
  }
  if (mapping !== undefined) {
    mapping.docs.forEach((doc) => {
      doc.ref.delete();
      console.log("[CHANNEL MAPPER] Mapping deleted");
    });
  }
};

module.exports = channelMapper;
