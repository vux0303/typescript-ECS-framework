import { ecs } from "../index";
import { MessageProcessSystemCtor } from "./Decorator";


export enum RepEnv {
    client,
    server
}

// export default class ReplicationConfig extends ecs.Component {

//     repEnv: RepEnv = RepEnv.client;

//     debug: boolean = true;

//     useNumericAliasKey: boolean = false;

//     clientShipSystem: MessageProcessSystemCtor;
//     serverShipSystem: MessageProcessSystemCtor;
// }

type configType = {
    repEnv: RepEnv;
    debug: boolean;
    useNumericAliasKey: boolean;
    messageShipSystem: MessageProcessSystemCtor;
}

export var repConfig: configType = {
    repEnv: RepEnv.client,
    debug: true,
    useNumericAliasKey: false,
    messageShipSystem: undefined,
}
