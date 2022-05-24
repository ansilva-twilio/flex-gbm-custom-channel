const { GoogleAuth } = require("google-auth-library");
const businessmessages = require("businessmessages");
const uuidv4 = require("uuid/v4");

// Initialize the Business Messages API
const bmApi = new businessmessages.businessmessages_v1.Businessmessages({});

// Set the scope for API authentication
const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/businessmessages",
});

let authClient = false;
let gbm = {};

/**
 * Posts a message to the Business Messages API, first sending a typing
 * indicator event and sending a stop typing event after the message
 * has been sent.
 *
 * @param {string} message The message to send to the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
gbm.sendMessage = (message, conversationId) => {
  if (!authClient) {
    gbm.initCredentials();
  }

  // Create the payload for sending a typing started event
  let apiEventParams = {
    auth: authClient,
    parent: "conversations/" + conversationId,
    resource: {
      eventType: "TYPING_STARTED",
      representative: gbm.getRepresentative(),
    },
    eventId: uuidv4(),
  };

  // Send the typing started event
  bmApi.conversations.events.create(
    apiEventParams,
    { auth: authClient },
    (err, response) => {
      console.log(err);
      //console.log(response);

      let apiParams = {
        auth: authClient,
        parent: "conversations/" + conversationId,
        resource: {
          messageId: uuidv4(),
          representative: gbm.getRepresentative(),
          text: message,
        },
      };

      // Call the message create function using the
      // Business Messages client library
      bmApi.conversations.messages.create(
        apiParams,
        { auth: authClient },
        (err, response) => {
          console.log(err);
          //console.log(response);

          // Update the event parameters
          apiEventParams.resource.eventType = "TYPING_STOPPED";
          apiEventParams.eventId = uuidv4();

          // Send the typing stopped event
          bmApi.conversations.events.create(
            apiEventParams,
            { auth: authClient },
            (err, response) => {
              console.log(err);
              //console.log(response);
            }
          );
        }
      );
    }
  );
};

gbm.getRepresentative = () => {
  return {
    representativeType: "BOT",
    displayName: "Echo Bot",
    avatarImage:
      "https://storage.googleapis.com/sample-avatars-for-bm/bot-avatar.jpg",
  };
};

/**
 * Initializes the Google credentials for calling the
 * Business Messages API.
 */
gbm.initCredentials = async () => {
  authClient = await auth.getClient();

  // Initialize auth token
  authClient.refreshAccessToken();
  await authClient.getAccessToken();
};

module.exports = gbm;
