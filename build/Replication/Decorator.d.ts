import MessageProcessSystem from "./Systems/MessageProcessSystem";
export declare type MessageProcessSystemCtor = new () => MessageProcessSystem;
declare type ClientDeliverOption = {
    processors: MessageProcessSystemCtor[];
};
declare type ClientReceiveOption = {
    processors: MessageProcessSystemCtor[];
};
declare type ServerDeliverOption = {
    isBroadcast?: boolean;
    processors: MessageProcessSystemCtor[];
};
declare type ServerReceiveOption = {
    processors: MessageProcessSystemCtor[];
};
declare type ClientDeliverData = {
    isBroadcast?: boolean;
    processors: string[];
};
declare type ClientReceiveData = {
    processors: string[];
};
declare type ServerDeliverData = {
    isBroadcast?: boolean;
    processors: string[];
};
declare type ServerReceiveData = {
    processors: string[];
};
export declare enum KeyRepDirection {
    clientToServer = 0,
    serverToClient = 1
}
declare type KeyInfo = {
    type: KeyRepDirection;
    deliverData: ClientDeliverData | ServerDeliverData;
    receiveData: ServerReceiveData | ClientReceiveData;
};
declare type ReplicationKeyMap = {
    [key: string]: KeyInfo;
};
export declare var g_repMetaData: Map<string, ReplicationKeyMap>;
export declare var g_messageProcessorCtors: MessageProcessSystemCtor[];
export declare function serverToClient(server: ServerDeliverOption, client: ClientReceiveOption): (target: any, key: string) => void;
export declare function clientToServer(client: ClientDeliverOption, server: ServerReceiveOption): (target: any, key: string) => void;
export {};
