import { repConfig } from "@vux0303/ecs-with-replication";
import ReceivingMessageComponent from "@vux0303/ecs-with-replication/build/Replication/Components/ReceivingMessageComponent";
import MessageProcessSystem from "@vux0303/ecs-with-replication/build/Replication/Systems/MessageProcessSystem";


export class RepDeBugSystem extends MessageProcessSystem {
    process(content) {
        console.log(this.constructor.name, Object.keys(content).map((key)=>{
            return this.getKeyCurrentValue(key);
        }));
    }
}

export class RepKeyEncodeSystem extends MessageProcessSystem {
    process(content) {
        console.log(this.constructor.name, Object.keys(content));
    }
}

export class ShipMessageSystem extends MessageProcessSystem {
    shipMessageAtClient(content: any) {
        console.log("SHIP client", content);
        this.admin.queryAll([ReceivingMessageComponent], ([receivingMsg]) => {
            receivingMsg.content = Object.assign({}, content);
        })
    };
    shipMessageAtServer(personalMsg: any, broadcastContent: any) {
        console.log("SHIP server", personalMsg, broadcastContent);
    }
}

export class ServerShipSystem extends MessageProcessSystem {
    shipMessage(content) {
    }
}

repConfig.clientShipSystem = ShipMessageSystem;
repConfig.serverShipSystem = ServerShipSystem;