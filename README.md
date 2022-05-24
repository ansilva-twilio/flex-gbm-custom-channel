# Twilio Flex - Google Business Messages Custom Channel

This sample demonstrates how to create a custom channel (in this case GBM) within Twilio Flex using the Programmable Chat API.
This sample runs on the Google App Engine.

See the Google App Engine (https://cloud.google.com/appengine/docs/nodejs/) standard environment
documentation for more detailed instructions.

On Twilio side, this sample is based on [this blog post](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex).

## Documentation

- The documentation for Twilio Programmable Chat API can be found [here](https://www.twilio.com/docs/chat)
- The documentation for the Business Messages API can be found [here](https://developers.google.com/business-communications/business-messages/reference/rest).

## Prerequisite

You must have the following software installed on your machine:

- [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart)
- [Google Cloud SDK](https://cloud.google.com/sdk/) (aka gcloud)
- [Node.js](https://nodejs.org/en/) - version 14 or above

## Before you begin

1.  [Register with Business Messages](https://developers.google.com/business-communications/business-messages/guides/set-up/register).
1.  Once registered, follow the instructions to [enable the APIs for your project](https://developers.google.com/business-communications/business-messages/guides/set-up/register#enable-api).
1.  Open the [Create an agent](https://developers.google.com/business-communications/business-messages/guides/set-up/agent) guide and follow the instructions to create a Business Messages agent.
1.  Create a new Flex Trial Account [here](https://www.twilio.com/try-twilio)
1.  Use Twilio CLI to create a new Flex Flow for the custom channel using the following command. Don't forget to write down its ID (e.g.: FObaaaee1a4fb2a51635f2edeffe364f2d)

    ```node
    twilio api:flex:v1:flex-flows:create \
        --friendly-name="Custom Webchat Flex Flow" \
        --channel-type=custom \
        --integration.channel=studio \
        --chat-service-sid=<Flex Chat Service SID> \
        --integration.flow-sid=<Flex Studio Flow SID> \
        --contact-identity=custom \
        --enabled
    ```

- `Flex Chat Service SID` can be obtained [here](https://console.twilio.com/us1/develop/chat/manage/services?frameUrl=%2Fconsole%2Fchat%2Fservices%3Fx-target-region%3Dus1)
- `Flex Studio Flow SID` can be obtained [here](https://console.twilio.com/us1/develop/studio/flows?frameUrl=%2Fconsole%2Fstudio%2Fflows%3Fx-target-region%3Dus1). Use the 'Webchat Flow' SID

1.  Configure your `.env` file. You can use the `.env.sample` as a starting point

    ```bash
    TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    FLEX_FLOW_SID=FOXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    FLEX_CHAT_SERVICE=ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    WEBHOOK_BASE_URL=https://mywebhook.base
    ```

- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` can be recovered from [Twilio Console](https://console.twilio.com/?frameUrl=/console)
- `FLEX_FLOW_SID` was generated in the prior step.
  > **Caution**: this is the **Flex** Flow SID. Not the **Studio** Flow SID
- `FLEX_CHAT_SERVICE` was also used in the prior step.
- `WEBHOOK_BASE_URL` is your GCP App Engine Service address.

## Deploy the sample (Google Cloud Platform)

1.  In a terminal, navigate to this sample's root directory.

1.  Run the following commands:

    ```bash
    gcloud config set project PROJECT_ID
    ```

    Where PROJECT_ID is the project ID for the project you created when you registered for
    Business Messages.

    ```base
    gcloud app deploy
    ```

1.  You'll also need to have a Firestore instance on your GCP project. We'll use a collection named 'channelmappings'.

1.  On your mobile device, use the test business URL associated with the Business Messages agent you created. Open a conversation with your agent and type in "Hello". Once delivered, you should receive a new task in Twilio Flex

## Architecture

The following illustrates a very high level architecture of this sample.

![High level architecture](/assets/images/architecture.png)

The files explained:

- `app.js` - hosts the server.
- `index.js` - main file, where callbacks from GBM and FLEX are received.
- `flex.js` - contains methods to create a new channel in Flex, to delete a channel and to send a message.
- `gbm.js` - contains the method to send a message to GBM.
- `channelMapper.js` - interacts with Firestore to keep a mapping between the Flex Channel SID and the GBM Conversation ID.

To explain it in more detail, here is the complete step-by-step:

1. The customer sends a message using its mobile device (GBM in Google Maps)
1. Google Business Messages triggers the configured webhook (your app engine). This will hit `/gbm-callback` in our `index.js` file.
1. With the GBM Conversation ID, we will use `channelMapper.js` to check if there is already an active channel for this conversation. If it does not, we will use `flex.js` to create a new channel.
1. After creating the channel, we will subscribe to listen to new messages from Flex on `/flex-callback` and for channel updates on `/flex-channel-updates`, both on our `index.js` file.
1. Using the Flex Channel, we will use `flex.js` to send the message from GBM to Flex.
1. The prior actions will trigger the Twilio Studio Flow and then a new task shows up in Flex for the available agent.
1. When the agents replies back, the `flex-callback` method is invoked and we use `channelMapper.js` to identify the GBM Conversation ID.
1. With the Conversation ID, we will use `gbm.js` to send the message from Flex to GBM.
1. When the agent completes the task, `/flex-channel-update` is invoked and we use `channelMapper.js` to remove the mapping and `flex.js` to delete the Flex channel.
