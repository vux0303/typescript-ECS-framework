import MessageProcessSystem from "./Systems/MessageProcessSystem";


export type MessageProcessSystemCtor = new () => MessageProcessSystem;
//type using for decorator param when collecting info
type ClientDeliverOption = {
    //isBroadcast?: boolean,
    processors: MessageProcessSystemCtor[]
}

type ClientReceiveOption = {
    processors: MessageProcessSystemCtor[]
}

type ServerDeliverOption = {
    isBroadcast?: boolean,
    processors: MessageProcessSystemCtor[]
}

type ServerReceiveOption = {
    processors: MessageProcessSystemCtor[]
}


//type using for storing data
type ClientDeliverData = {
    isBroadcast?: boolean,
    processors: string[],
}

type ClientReceiveData = {
    processors: string[],
}

type ServerDeliverData = {
    isBroadcast?: boolean,
    processors: string[],
}

type ServerReceiveData = {
    processors: string[],
}

export enum KeyRepDirection {
    clientToServer,
    serverToClient,
}

type KeyInfo = {
    type: KeyRepDirection,
    deliverData: ClientDeliverData | ServerDeliverData,
    receiveData: ServerReceiveData | ClientReceiveData,
}

type ReplicationKeyMap = { [key: string]: KeyInfo }

export var g_repMetaData: Map<string, ReplicationKeyMap> = new Map();

export var g_messageProcessorCtors: MessageProcessSystemCtor[] = [];

export function serverToClient(server: ServerDeliverOption, client: ClientReceiveOption) {
    return function (target: any, key: string) {
        if (isInvalidDecoratedKey(target, key)) {
            console.warn(`[ECS] bypass key ${key} of ${target.constructor.name}, can not use decorator on getter/setter/function/reference type`);
        }

        //record class name
        if (!g_repMetaData.has(target.constructor.name)) {
            g_repMetaData.set(target.constructor.name, {})
        }

        if (!g_repMetaData.get(target.constructor.name)[key]) {
            let keyInfo: KeyInfo = {
                type: KeyRepDirection.serverToClient,
                deliverData: {
                    isBroadcast: undefined,
                    processors: undefined,
                },
                receiveData: {
                    processors: undefined,
                },
            }

            keyInfo.deliverData.isBroadcast = server.isBroadcast ? true : false;

            keyInfo.deliverData.processors = processProcessorOption(server.processors);
            keyInfo.receiveData.processors = processProcessorOption(client.processors);

            g_repMetaData.get(target.constructor.name)[key] = keyInfo;
        } else {
            console.error(`[REP] a decorator on key ${key} of ${target.constructor.name} is omitted`);
        }
    }
}


export function clientToServer(client: ClientDeliverOption, server: ServerReceiveOption) {
    return function (target: any, key: string) {
        if (isInvalidDecoratedKey(target, key)) {
            console.warn(`[ECS] bypass key ${key} of ${target.constructor.name}, can not use decorator on getter/setter/function/reference type`);
        }

        //record class name
        if (!g_repMetaData.has(target.constructor.name)) {
            g_repMetaData.set(target.constructor.name, {})
        }

        if (!g_repMetaData.get(target.constructor.name)[key]) {
            let keyInfo: KeyInfo = {
                type: KeyRepDirection.clientToServer,
                deliverData: {
                    isBroadcast: false,
                    processors: undefined,
                },
                receiveData: {
                    processors: undefined,
                },
            }

            //keyInfo.deliverData.isBroadcast = client.isBroadcast ? true : false;

            keyInfo.deliverData.processors = processProcessorOption(client.processors);
            keyInfo.receiveData.processors = processProcessorOption(server.processors);

            g_repMetaData.get(target.constructor.name)[key] = keyInfo;
        } else {
            console.error(`[REP] a decorator on key ${key} of ${target.constructor.name} is omitted`);
        }
    }
}

function processProcessorOption(processors: MessageProcessSystemCtor[]): string[] {
    let processorNames = processors.map((processor) => {
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
function recordProcessors(processors: MessageProcessSystemCtor[]) {
    let k = 0;
    for (let i = 0; i < g_messageProcessorCtors.length; i++) {
        if (g_messageProcessorCtors[i] == processors[k]) k++;
    }

    for (; k < processors.length; k++) {
        g_messageProcessorCtors.push(processors[k]);
    }
}

function isInvalidDecoratedKey(obj, prop) {
    return Object.getOwnPropertyDescriptor(obj, prop) && !!Object.getOwnPropertyDescriptor(obj, prop)['get'] //not a getter
        || Object.getOwnPropertyDescriptor(obj, prop) && !!Object.getOwnPropertyDescriptor(obj, prop)['set'] //not a setter
        || (typeof obj[prop] == 'function') //or reference type
        || (typeof obj[prop] == 'object'); //
}