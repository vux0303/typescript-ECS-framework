"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientToServer = exports.serverToClient = exports.g_messageProcessorCtors = exports.g_repMetaData = exports.KeyRepDirection = void 0;
var KeyRepDirection;
(function (KeyRepDirection) {
    KeyRepDirection[KeyRepDirection["clientToServer"] = 0] = "clientToServer";
    KeyRepDirection[KeyRepDirection["serverToClient"] = 1] = "serverToClient";
})(KeyRepDirection = exports.KeyRepDirection || (exports.KeyRepDirection = {}));
exports.g_repMetaData = new Map();
exports.g_messageProcessorCtors = [];
function serverToClient(server, client) {
    return function (target, key) {
        if (isInvalidDecoratedKey(target, key)) {
            console.warn("[ECS] bypass key " + key + " of " + target.constructor.name + ", can not use decorator on getter/setter/function/reference type");
        }
        //record class name
        if (!exports.g_repMetaData.has(target.constructor.name)) {
            exports.g_repMetaData.set(target.constructor.name, {});
        }
        if (!exports.g_repMetaData.get(target.constructor.name)[key]) {
            var keyInfo = {
                type: KeyRepDirection.serverToClient,
                deliverData: {
                    isBroadcast: undefined,
                    processors: undefined,
                },
                receiveData: {
                    processors: undefined,
                },
            };
            keyInfo.deliverData.isBroadcast = server.isBroadcast ? true : false;
            keyInfo.deliverData.processors = processProcessorOption(server.processors);
            keyInfo.receiveData.processors = processProcessorOption(client.processors);
            exports.g_repMetaData.get(target.constructor.name)[key] = keyInfo;
        }
        else {
            console.error("[REP] a decorator on key " + key + " of " + target.constructor.name + " is omitted");
        }
    };
}
exports.serverToClient = serverToClient;
function clientToServer(client, server) {
    return function (target, key) {
        if (isInvalidDecoratedKey(target, key)) {
            console.warn("[ECS] bypass key " + key + " of " + target.constructor.name + ", can not use decorator on getter/setter/function/reference type");
        }
        //record class name
        if (!exports.g_repMetaData.has(target.constructor.name)) {
            exports.g_repMetaData.set(target.constructor.name, {});
        }
        if (!exports.g_repMetaData.get(target.constructor.name)[key]) {
            var keyInfo = {
                type: KeyRepDirection.clientToServer,
                deliverData: {
                    isBroadcast: false,
                    processors: undefined,
                },
                receiveData: {
                    processors: undefined,
                },
            };
            //keyInfo.deliverData.isBroadcast = client.isBroadcast ? true : false;
            keyInfo.deliverData.processors = processProcessorOption(client.processors);
            keyInfo.receiveData.processors = processProcessorOption(server.processors);
            exports.g_repMetaData.get(target.constructor.name)[key] = keyInfo;
        }
        else {
            console.error("[REP] a decorator on key " + key + " of " + target.constructor.name + " is omitted");
        }
    };
}
exports.clientToServer = clientToServer;
function processProcessorOption(processors) {
    var processorNames = processors.map(function (processor) {
        return processor.name;
    });
    recordProcessors(processors);
    return processorNames.reverse();
}
/*
    To process message pipeline in order that defined by decorator while ecs.system only execute once in register order
    we have to duplicate some system instance to archive that
    Example: for these pipeline:
        [a, b, c]
        [b, c]      //output at this point [a, b, c]
        [c, b, a]   //output at this point [a, b, c, b, a]
        [a, d]
        [a, c, d]

    output g_messageProcessorCtors should be: [a, b, c, b, a, d]
 */
function recordProcessors(processors) {
    var k = 0;
    for (var i = 0; i < exports.g_messageProcessorCtors.length; i++) {
        if (exports.g_messageProcessorCtors[i] == processors[k])
            k++;
    }
    for (; k < processors.length; k++) {
        exports.g_messageProcessorCtors.push(processors[k]);
    }
}
function isInvalidDecoratedKey(obj, prop) {
    return Object.getOwnPropertyDescriptor(obj, prop) && !!Object.getOwnPropertyDescriptor(obj, prop)['get'] //not a getter
        || Object.getOwnPropertyDescriptor(obj, prop) && !!Object.getOwnPropertyDescriptor(obj, prop)['set'] //not a setter
        || (typeof obj[prop] == 'function') //or reference type
        || (typeof obj[prop] == 'object'); //
}
