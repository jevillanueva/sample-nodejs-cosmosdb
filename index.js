global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express')
const { MessagingResponse } = require('twilio').twiml;
// const ENV_FILE = path.join(__dirname, '.env');
// dotenv.config({ path: ENV_FILE });

const { BotFrameworkAdapter } = require('botbuilder');
const { DirectLine } = require('botframework-directlinejs');
const { EchoBot } = require('./bot');

const app = express()
const port = process.env.port || process.env.PORT || 3978

app.listen(port,'0.0.0.0', () => console.log(`Example app listening at http://0.0.0.0:${port}`))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req, res) => res.send('Hello World!'))

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights. See https://aka.ms/bottelemetry for telemetry 
    //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

adapter.onTurnError = onTurnErrorHandler;

// Create the main dialog.
const myBot = new EchoBot();

// Listen for incoming requests.
app.post('/api/messages', (req, res) => {
    console.log("POST#MESSAGE");
    console.log(req.body);
    console.log("POST#MESSAGE");
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
    });
});



const goodBoyUrl = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?'
  + 'ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80';

app.post('/whatsapp', async (req, res) => {
    try {
    var directLine = new DirectLine({
        token: process.env.BotSecretID
        // token: /* or put your Direct Line token here (supply secret OR token, not both) */,
        // domain: /* optional: if you are not using the default Direct Line endpoint, e.g. if you are using a region-specific endpoint, put its full URL here */
        // webSocket: /* optional: false if you want to use polling GET to receive messages. Defaults to true (use WebSocket). */,
        // pollingInterval: /* optional: set polling interval in milliseconds. Defaults to 1000 */,
        // timeout: /* optional: a timeout in milliseconds for requests to the bot. Defaults to 20000 */,
    });
        
    const { body } = req;
    console.log("POST#WP");
    console.log(body);
    console.log("POST#WP");
    let messageTwilio;
    
    if (body.NumMedia > 0) {
        messageTwilio = new MessagingResponse().message("Thanks for the image! Here's one for you!");
        messageTwilio.media(goodBoyUrl);
        res.set('Content-Type', 'text/xml');
        res.send(messageTwilio.toString()).status(200);
    } else {
        if (body.Latitude != undefined || body.Longitude != undefined){
            messageTwilio = new MessagingResponse().message('THanks for your POsition');
            res.set('Content-Type', 'text/xml');
            res.send(messageTwilio.toString()).status(200);
        }else{
            
            directLine.postActivity({
                from: { id: body.From}, // required (from.name is optional)
                type: 'message',
                text: body.Body
            }).subscribe(
                id => console.log("Posted activity, assigned ID ", id),
                error => console.log("Error posting activity", error)
                );
                    
            directLine.activity$
                .filter(activity => activity.type === 'message'&& activity.from.id === process.env.ID_BOT_DIRECT_LINE )
                .subscribe(
                    message => {
                        console.log("received message ", message);
                        console.log(message.text)
                        messageTwilio = new MessagingResponse().message(message.text);
                        res.set('Content-Type', 'text/xml');
                        res.send(messageTwilio.toString()).status(200);
                    });

        }
    }
    // res.set('Content-Type', 'text/xml');
    // res.send(messageTwilio.toString()).status(200);

    } catch (error) {
        console.log(error);
        messageTwilio = new MessagingResponse().message("Algo salio mal");
        res.set('Content-Type', 'text/xml');
        res.send(messageTwilio.toString()).status(200);
        
    }
});

// app.on('upgrade', (req, socket, head) => {
//     // Create an adapter scoped to this WebSocket connection to allow storing session data.
//     const streamingAdapter = new BotFrameworkAdapter({
//         appId: process.env.MicrosoftAppId,
//         appPassword: process.env.MicrosoftAppPassword
//     });
//     // Set onTurnError for the BotFrameworkAdapter created for each connection.
//     streamingAdapter.onTurnError = onTurnErrorHandler;

//     streamingAdapter.useWebSocket(req, socket, head, async (context) => {
//         // After connecting via WebSocket, run this logic for every request sent over
//         // the WebSocket connection.
//         await myBot.run(context);
//     });
// });
