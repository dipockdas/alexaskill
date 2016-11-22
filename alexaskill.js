// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /*
         * prevent someone else from configuring a skill that sends requests to this function.
         * YOU Need to supply the ID of your skill - it will begin with "amzn1.ask.skill. ......"
         */

        if (event.session.application.applicationId !== "***** CHANGE-ME ******") {
             context.fail("Invalid Application ID");

        }


        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("Notify" === intentName) {
        getContact(intent, session, callback);

    } else if ("AMAZON.HelpIntent" === intentName) {
        getHelpResponse(callback);

    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);

    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = "Welcome";
    const speechOutput = "Hi. Please state your name and who you are meeting. " +
        "For example you can say, I'm Doctor Watson and I am here to meet Sherlock Holmes";

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = "You can say Hi please let Sherlock Holmes know Doctor Watson is here";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelpResponse(callback) {
    const sessionAttributes = {};
    const cardTitle = "Help";
    const speechOutput = "Please ask me for information by saying, I need help";

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = "Please ask me for information by saying, I need help";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = "Session Ended";
    const speechOutput = "Thank you. Have a good meeting!";
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


function getContact(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "I'm not sure what you said. You can say Hi please let Sherlock Holmes know Doctor Watson is here";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "Didn't catch that. You can say Hi please let Sherlock Holmes know Doctor Watson is here";
    var contactname = "";
    var guestname = "";

    // const { Contact, Visitor} = intent.slots;
    // we will just write the Contact and Visitor to the AWS log files
    console.log(intent.slots.Contact.value + "" + intent.slots.Visitor.value);

    if (typeof intent.slots.Visitor.value != 'undefined') {
          guestname = intent.slots.Visitor.value;
          console.log('Visitor: ' + guestname );
          speechOutput = "OK" + guestname + speechOutput
    }

    if (typeof intent.slots.Contact.value != 'undefined') {
      contactname = intent.slots.Contact.value;
      console.log('Meeting: ' + contactname );
      speechOutput = " we have notified " + contactname + " you are here";
      shouldEndSession = true;
    }



    callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}





// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
