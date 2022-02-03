import { MessageProcessSystemCtor } from "./Decorator";
export declare enum RepEnv {
    client = 0,
    server = 1
}
declare type configType = {
    repEnv: RepEnv;
    debug: boolean;
    useNumericAliasKey: boolean;
    clientShipSystem: MessageProcessSystemCtor;
    serverShipSystem: MessageProcessSystemCtor;
};
export declare var repConfig: configType;
export {};
