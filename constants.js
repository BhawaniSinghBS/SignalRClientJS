let nameOfTheApp = "signarhub";
let hubURLFromAppsettings = `https://www.hubbaseurl.com/signalRHub`;
const signalRHubURL = () => { return `${hubURLFromAppsettings}?an=${nameOfTheApp}`; };

const SignalRReceiveType = {
    Unknown :-1,
    Ping : 10,
    Data1 : 20,
    Data2 : 30,
    Data3 : 40,
    Data4 : 50,// above byte.Max
    Data5 : 60,
    Data6 : 70,
};

const SignalRDataReciveTimeInterval = {
    Unknown: -1,
    GetResponceOnlyOnce: 0,
    Default: 200,
    Milliseconds10: 10,
    Milliseconds50: 50, 
};


//// Create a reverse mapping object
const ReverseSignalRReceiveType = {};
const ReverseSignalRDataReciveTimeInterval = {};

for (const prop in SignalRReceiveType) {
    const value = SignalRReceiveType[prop];
    ReverseSignalRReceiveType[value] = prop;
}

for (const prop in ReverseSignalRDataReciveTimeInterval) {
    const value = SignalRReceiveType[prop];
    ReverseSignalRDataReciveTimeInterval[value] = prop;
}


 
