//var bsmdataReceived = new Map();
var Data1 = new Map();
var Data2 = new Map();
var Data3 = new Map();
var Data4 = new Map();

//var connection;
let HubConnection = null;
let TagsSubscribed = [];
let SignalRConnectionID = "";

function manangeReceivedDataFromSignal(dataReceived) {

    if (dataReceived && dataReceived.hasOwnProperty("property1")) {
        processData1(dataReceived, Id);

    }
    else if (dataReceived.hasOwnProperty("property2")) {
        processData2(dataReceived, Id);
    }
    else if (dataReceived.hasOwnProperty("property3")) {
        dataReceived.signalREpochTimeStamp = new Date().getTime();
        Data4.set(id, dataReceived);
    }
    else {
        Data1.set(id, dataReceived);
    }
}
function IsConnecting() {
    let IsConnecting = HubConnection?.state === "Connecting" || HubConnection?.state === "Reconnecting";
    return IsConnecting;
}

function IsConnected() {
    let isConnected = HubConnection?.state === "Connected";
    return isConnected;
}

function IsDisconnected() {
    let IsDisconnected = HubConnection?.state === "Disconnected";
    return IsDisconnected;
}

function SubscribeToTagsIfHubIsAlreadyConnected(tagToSubscribe) {

    HubConnection = connection;
    try {
        let tagsToSubsCribeInHub = [];
        if (Array.isArray(tagToSubscribe)) {

            for (const tag of tagToSubscribe) {
                if (!TagsSubscribed.includes(tag)) {
                    connection.on(tag, (tag, jsonData) => {
                        HandleReceived(tag, jsonData);
                    });
                }
                tagsToSubsCribeInHub.push(tag);

                if (!TagsSubscribed.includes(tag)) {
                    TagsSubscribed.push(tag);
                }

            }
        }
        else {
            if (!TagsSubscribed.includes(tagToSubscribe)) {
                connection.on(tagToSubscribe, (tagToSubscribe, jsonData) => {
                    HandleReceived(tagToSubscribe, jsonData);

                });
            }
            tagsToSubsCribeInHub.push(tagToSubscribe);
            if (!TagsSubscribed.includes(tagToSubscribe)) {
                TagsSubscribed.push(tagToSubscribe);
            }
        }

        if (tagsToSubsCribeInHub?.length > 0) {
            const chunkSize = 100;
            // Split the tagstoSubscribe array into chunks
            const tagChunks = ChunkArray(tagsToSubsCribeInHub, chunkSize);
            // Subscribe to each chunk of tags separately
            tagChunks.forEach(async tags => {
                SubscribeToTagsInHub_DoNotCallThisFunction(tags);
            });


        }
        return IsConnected();
    } catch (error) {
        // Handle error/log
        return false;
    }

}

function SubscribeToTagsInHub_DoNotCallThisFunction(tagsToSubscribe) {

    try {
        if (IsConnected()) {
            HubConnection?.invoke("SubscribeToTagsInHub", tagsToSubscribe);
            return true;
        }
        return false;
    }
    catch (ex) {
        // log
        //throw;
        return false;
    }
}

function SubscribeToPing() {

    try {
        SubscribeToTagsIfHubIsAlreadyConnected("ping");
    }
    catch (ex) {
        // log
        //throw;
        return false;
    }
}

function UnSubscribeSelectedTagsIfConnected(tagsToUnSubscribe) {
    try {
        if (IsConnected()) {
            HubConnection.invoke("UnSubscribeFromTags", tagsToUnSubscribe);
            return true;
        }
        return false;
    }
    catch (ex) {
        return false;
    }
}

function Send(hubCompleteURL, appName, tagsToSend, nonSerializedDataToSend, jwtToken) {
    if (nonSerializedDataToSend && tagsToSend && tagsToSend.length > 0) {
        for (const tagToSend of tagsToSend) {
            const serializedStringObjectData = JSON.stringify(nonSerializedDataToSend);

            if (HubConnection && HubConnection.connectionId) {
                HubConnection.invoke("SendToClientsViaSignalRHub", tagToSend, serializedStringObjectData);
            } else {
                if (ConnectToHub(hubCompleteURL, appName, jwtToken, tagsToSend)) {
                    try {
                        HubConnection.invoke("SendToClientsViaSignalRHub", tagToSend, serializedStringObjectData);
                    } catch (ex) {
                        if (ConnectToHub(hubCompleteURL, appName, jwtToken, tagsToSend)) {
                            HubConnection.invoke("SendToClientsViaSignalRHub", tagToSend, serializedStringObjectData);
                        }
                    }
                }
            }
        }
        return " sent successfully.";
    } else {
        return "Not connected to hub.";
    }
}

function Disconnect() {
    try {
        SignalRConnectionID = "";
        if (HubConnection) {
            HubConnection.stop();
            return true;
        } else {
            return false;
        }
    } catch (ex) {
        return false;
    }
}


function HandleReceived(tag, jsonData) {
    try {
        if (tag == "ping" || jsonData === null || jsonData.length < 3) {
            return;
        }

        const dataReceived = JSON.parse(jsonData);
        manangeReceivedDataFromSignal(dataReceived);
        return true;

    }
    catch (ex) {
        return false;
    }
}
 

function GetEncryptedTag(receiveType, entityId, timeIntervalForRecivingData, getRadisTagWithStar = false) {
    try {
        let tag;
        let encryptedTag;
        let nonEncruptedTagOnlyToDebug;
        let data4String = ReverseSignalRReceiveType[SignalRReceiveType.Data4];
        let data5String = ReverseSignalRReceiveType[SignalRReceiveType.Data5];
        let data6String = ReverseSignalRReceiveType[SignalRReceiveType.Data6];


        if (receiveType != data4String &&
            receiveType != data5String &&
            receiveType != data6String) {

            nonEncruptedTagOnlyToDebug = `${timeIntervalForRecivingData}__${receiveType}__${entityId}`;
            // Encrypt the tag using SHA or your encryption method
            return EncryptStringWithSHA_OneSidedEncryption(nonEncruptedTagOnlyToDebug).then(hashedString => {
                encryptedTag = hashedString;
                return encryptedTag || "Invalid tag";
            }).catch(error => {
                console.error('Error:', error);
            });
        }
        else {
            if (receiveType == data4String) {
                if (getRadisTagWithStar) {
                    tag = `*:Redis_Data4-${entityId}`;
                }
                else {
                    tag = `Redis_Data4-${entityId}`;
                }
            }
            else if (receiveType == data5String) {
                if (getRadisTagWithStar) {
                    tag = `*:Redis_Data5-${entityId}`;
                }
                else {
                    tag = `Redis_Data5_-${entityId}`;
                }
            }
            else if (receiveType == data6String) {
                if (getRadisTagWithStar) {
                    tag = `*:Redis_Data6-${entityId}`;
                }
                else {
                    tag = `Redis_Data6-${entityId}`;
                }
            }
            nonEncruptedTagOnlyToDebug = tag;
            encryptedTag = tag;
            return encryptedTag || "Invalid tag";
        }

    } catch (e) {
        console.log(e);
    }
}

function EncryptStringWithSHA_OneSidedEncryption(tag) {
    return new Promise((resolve, reject) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(tag);

        crypto.subtle.digest('SHA-256', data)
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashedString = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                resolve(hashedString.toUpperCase());
            })
            .catch(error => {
                console.error('Error during encryption:', error);
                reject(null);
            });
    });
}

function ChunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
} 