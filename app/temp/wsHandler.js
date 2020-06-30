//const censusServiceId = require('../config/census.serviceid');
const WebSocket = require('ws');
const db = require('./models');
const eventStore = require('./eventStoreHandler');
const alertHandler = require('./alertHandler');
const activeWorldValidator = require('./validators/activeWorld.js');
const activeZoneValidator = require('./validators/activeZone.js');
const api_key = require('./api_key');

function createStream() {
    console.log('Creating Websocket Stream...');
    const ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + api_key.KEY);
    ws.on('open', function open() {
        console.log('Connected to Census Api');
        subscribe(ws);
    });
    ws.on('message', function incoming(data) {
        handleWsResponse(data);
    });
}

function subscribe(ws) {
    console.log('Subscribing to DBG websocket..');

    const obj1 = {
        service: 'event',
        action:  'subscribe',
        characters: ['all'],
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['Death','PlayerLogin','PlayerLogout','PlayerFacilityDefend',
                        'PlayerFacilityCapture', ,'BattleRankUp','VehicleDestroy'],
        //logicalAndCharactersWithWorlds: true
    }
    const obj2 = {
        service: 'event',
        action:  'subscribe',
        characters: ['all'],
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['GainExperience','ItemAdded'],
        //logicalAndCharactersWithWorlds: true
    }
    const obj3 = {
        service: 'event',
        action:  'subscribe',
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['FacilityControl','MetagameEvent','ContinentLock','ContinentUnlock'],
        //logicalAndCharactersWithWorlds: true
    }

    ws.send(JSON.stringify((obj1)));
    console.log('Subscribed to - deats,login,captures,vehicles');
    ws.send(JSON.stringify((obj2)));
    console.log('Subscribed to xp and items');
    ws.send(JSON.stringify((obj3)));
    console.log('Subscribed successfully to Census Websocket Stream!');
}

function handleWsResponse(raw) {
    //console.log(raw);



}


module.exports = {
    createStream
}
