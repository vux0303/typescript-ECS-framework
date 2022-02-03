import { ecs } from "../../index";
import ReceivingMessageComponent, { KeyAddress } from "../Components/ReceivingMessageComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
import { repConfig } from "../ReplicationConfig";
import { RepUtils } from "../RepUtils";

export class MessageDecodeSystem extends ecs.System {

    update(dt) {
        this.admin.queryAll([ReceivingMessageComponent, ReplicationComponent], ([receivingMsg, repInfo]) => {
            let contentKeys = Object.keys(receivingMsg.content);
            if (contentKeys.length > 0) {
                console.log("Decode msg");
                contentKeys.forEach((key) => {
                    let keyAddress: KeyAddress = RepUtils.decodeKey(key, repConfig.debug);
                    let repAttachment = repInfo.repAttachmentMapID.get(keyAddress.repAttachmentID);
                    receivingMsg.keyAddress[key] = keyAddress;
                    receivingMsg.processor[key] = repAttachment.keyProcessors[keyAddress.aliasKey];
                })
            }
        })
    }
}