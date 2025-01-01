
async function ConnectToSignalR() {

    try {

        //Creating the URL and adding access token in the URL 
        let signalRHubURLWithToken = signalRHubURL() + `&access-token=Bearer ${jwtToken}`;//get jwt token from api call

        // if (connection.state == "Disconnected") {
        TagsSubscribed = [];
        connection = null;

        //Setting up the SignalR connection with its configuration
        connection = new signalR.HubConnectionBuilder()
            .withUrl(signalRHubURLWithToken, {
                "AppName": nameOfTheApp,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
            }).withAutomaticReconnect().build();

        connection.onreconnected(connectionId => {
            if (TagsSubscribed && Array.isArray(TagsSubscribed) && TagsSubscribed.length > 0) {
                TagsSubscribed.forEach(tag => {
                    SubscribeToTagsIfHubIsAlreadyConnected(tag);
                });
            }
        });

        //Followig setting will keeep checking the connection  after certain time
        connection.serverTimeoutInMilliseconds = 30000;
        connection.keepAliveIntervalInMilliseconds = 3000;

        //Finallly starting  the SignalR connection to Hub     
        connection.start().then(() => {
            if (connection && connection.state == "Disconnected") {
                setTimeout(ConnectToSignalR, 3000);
                return;
            }

            console.log("SignalR connection started successfully.");

            if (connection.state == 'Connected') {
                SubscribeToPingMessage();
               //subscribe to tags
                if (commaSepratedIDsToSubscribeOnHub) {
                    const stringArray = commaSepratedIDsToSubscribeOnHub.split(',');
                    const distinctStringArray = stringArray.filter((value, index, self) => self.indexOf(value) === index);

                    Promise.all(distinctStringArray.map(Id => {
                        let Data4String = ReverseSignalRReceiveType[SignalRReceiveType.Data4];
                        return Promise.all([
                            GetEncryptedTag(Data4String, Id, SignalRDataReciveTimeInterval.Default),
                        ]).then((comsTag) => {
                            SubscribeToTagsIfHubIsAlreadyConnected(comsTag);
                        });
                    }));
                }
            }
        }).catch(error => {
            console.error(error);
            console.log("SignalR failed to connect. Trying again after 3 seconds");  //Failed to connect priting log
            setTimeout(ConnectToSignalR, 30000); //Trying to connect after 3 seconds
        });
    }
    //  }
    catch (error) {
        console.error(error);
        console.log("SignalR failed to connect. Trying again after 3 seconds");  //Failed to connect priting log
        setTimeout(ConnectToSignalR, 30000); //Trying to connect after 3 seconds
    }
}

ConnectToSignalR(); //Starting the SignalR connection
connection.onclose(async (error) => {
    console.log(error);    //Printing the error on console
    ConnectToSignalR();  //Connection is closed  so trying to re-connect to HUB
});
