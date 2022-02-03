import { ecs } from "../../index";
import DeliveringMessageComponent from "../Components/DeliveringMessageComponent";
import ReceivingMessageComponent, { KeyAddress } from "../Components/ReceivingMessageComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
import { repConfig, RepEnv } from "../ReplicationConfig";
import { RepUtils } from "../RepUtils";


export default abstract class MessageProcessSystem extends ecs.System {

    repInfo: ReplicationComponent;

    onRegister() {
        this.admin.queryAll([ReplicationComponent], ([repInfo]) => {
            this.repInfo = repInfo;
        })
    }
    update() {
        this.admin.queryActive([DeliveringMessageComponent], ([deliveringMessage]) => {
            this.checkUpDeliveringMessage(deliveringMessage);
        })
        this.admin.queryActive([ReceivingMessageComponent], ([receivingMessage]) => {
            this.checkUpReceivingMessage(receivingMessage);
        })
    }

    checkUpDeliveringMessage(deliveringMessage: DeliveringMessageComponent) {
        let contentKeys = Object.keys(deliveringMessage.content);
        if (contentKeys.length == 0) {
            return;
        }
        if (deliveringMessage.isReadyToShip) {
            this._shipMessage(deliveringMessage);
            return;
        }
        let matchedKeys: string[] = [];
        let lastIdx;
        let numCompletedKey: number = 0;
        contentKeys.forEach((key) => {
            if (deliveringMessage.processor[key].length == 0) {
                numCompletedKey++;
                return;
            }
            lastIdx = deliveringMessage.processor[key].length - 1;
            if (deliveringMessage.processor[key][lastIdx] == this.constructor.name) { //check if this key will be process by this system
                matchedKeys.push(key);

                //remove the processor so it won't guess process again
                deliveringMessage.processor[key].pop();
                if (deliveringMessage.processor[key].length == 0) {
                    numCompletedKey++
                    if (numCompletedKey == contentKeys.length) {
                        deliveringMessage.isReadyToShip = true;
                        console.log("READY to ship");
                    }
                }
            }
        })
        if (matchedKeys.length > 0) {
            this._process(deliveringMessage.content, matchedKeys);
        }
    }

    checkUpReceivingMessage(receivingMessage: ReceivingMessageComponent) {
        let contentKeys = Object.keys(receivingMessage.processor);
        if (contentKeys.length == 0) {
            return;
        }
        if (receivingMessage.isReadyToApply) {
            this.applyMessage();
            //this._resetReceivedMessage(receivingMessage);
            return;
        }
        let matchedKeys: string[] = [];
        let lastIdx;
        let numCompletedKey: number = 0;
        contentKeys.forEach((key) => {
            if (receivingMessage.processor[key].length == 0) {
                numCompletedKey++;
                return;
            }
            lastIdx = receivingMessage.processor[key].length - 1;
            if (receivingMessage.processor[key][lastIdx] == this.constructor.name) { //check if this key will be process by this system
                matchedKeys.push(key);

                //remove the processor so it won't guess process again
                receivingMessage.processor[key].pop();
                if (receivingMessage.processor[key].length == 0) {
                    numCompletedKey++
                    if (numCompletedKey == contentKeys.length) {
                        receivingMessage.isReadyToApply = true;
                        console.log("READY to apply");
                    }
                }
            }
        })
        if (matchedKeys.length > 0) {
            this._process(receivingMessage.content, matchedKeys);
        }
    }

    _shipMessage(deliveringMessage: DeliveringMessageComponent) {
        if (repConfig.repEnv == RepEnv.client) {
            this.shipMessageAtClient(deliveringMessage.content);
        } else { //server
            let personalMsg: { [clientID: string]: { [key: string]: any } } = {};
            let broadcastContent = {}
            Object.keys(deliveringMessage.content).forEach((key) => {
                let clientID: string = deliveringMessage.targetClient[key]
                if (clientID) {
                    if (!personalMsg[clientID]) {
                        personalMsg[clientID] = {};
                    }
                    personalMsg[clientID][key] = deliveringMessage.content[key];
                } else { //no client mean this key will be broadcast
                    broadcastContent[key] = deliveringMessage.content[key];
                }
            })
            this.shipMessageAtServer(personalMsg, broadcastContent);
        }
    };

    shipMessageAtClient(content: any) {

    };

    shipMessageAtServer(personalMsg: any, broadcastContent: any) {

    }

    applyMessage() {

    }

    private _process(content: any, matchedKeys: string[]) {
        let matchedContent = {};
        matchedKeys.forEach((key) => {
            matchedContent[key] = content[key];
        })

        this.process(matchedContent);

        matchedKeys.forEach((key) => {
            content[key] = matchedContent[key];
        })
    };

    process(content: any) {

    }

    getKeyCurrentValue(key: string) {
        let keyAddress: KeyAddress = RepUtils.decodeKey(key, repConfig.debug);
        let repAttachment = this.repInfo.repAttachmentMapID.get(keyAddress.repAttachmentID);
        return repAttachment[keyAddress.aliasKey];
    }
}
