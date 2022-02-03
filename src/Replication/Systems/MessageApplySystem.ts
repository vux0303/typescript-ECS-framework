import ReceivingMessageComponent from "../Components/ReceivingMessageComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
import MessageProcessSystem from "./MessageProcessSystem";

export class MessageApplySystem extends MessageProcessSystem {
    applyMessage() {
        this.admin.queryAll([ReceivingMessageComponent, ReplicationComponent], ([receivingMessage, repInfo]) => {
            if (receivingMessage.isReadyToApply) {
                console.log("applying msg");
                Object.keys(receivingMessage.content).forEach((key) => {
                    let address = receivingMessage.keyAddress[key];
                    let attachment = repInfo.repAttachmentMapID.get(address.repAttachmentID);
                    attachment[address.aliasKey] = receivingMessage.content[key];
                })
            }
        })
    }
}

