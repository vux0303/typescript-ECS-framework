import { ecs } from "../../index";
import DeliveringMessageComponent from "../Components/DeliveringMessageComponent";
import ReceivingMessageComponent from "../Components/ReceivingMessageComponent";
import RepAttachmentComponent from "../Components/RepAttachmentComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
import { g_messageProcessorCtors, g_repMetaData, KeyRepDirection, MessageProcessSystemCtor } from "../Decorator";
import { repConfig, RepEnv } from "../ReplicationConfig";
import { MessageApplySystem } from "./MessageApplySystem";
import { MessageDecodeSystem } from "./MessageDecodeSystem";
import MessageProcessSystem from "./MessageProcessSystem";

export default class ReplicationSystem extends ecs.System {
    //config: ReplicationConfig;
    repInfo: ReplicationComponent;
    deliveringMsg: DeliveringMessageComponent;
    singletonAttachments: RepAttachmentComponent[] = [];

    onRegister() {
        //create entity

        //this.config = this.admin.addSingleton(ReplicationConfig);
        this.deliveringMsg = this.admin.addSingleton(DeliveringMessageComponent);
        this.admin.addSingleton(ReceivingMessageComponent);
        this.repInfo = this.admin.addSingleton(ReplicationComponent);

        this.registerSubSystem();

        this.scanSingleton();
        this.scanNetEntities();
    }

    registerSubSystem() {
        this.admin.registerSystem(new MessageDecodeSystem());

        let reuseSystem: Map<MessageProcessSystemCtor, MessageProcessSystem> = new Map();
        g_messageProcessorCtors.forEach((systemCtor) => {
            if (reuseSystem.has(systemCtor)) {
                this.admin.registerSystem(reuseSystem.get(systemCtor))
            } else {
                let sys = new systemCtor();
                reuseSystem.set(systemCtor, sys);
                this.admin.registerSystem(sys);
            }
        })

        // //this.admin.queryAll([ReplicationConfig], ([config]) => {
        //     if (repConfig.repEnv == RepEnv.client) {
        //         if (repConfig.messageShipSystem) {
        //             this.admin.registerSystem(new repConfig.clientShipSystem());
        //         } else {
        //             console.warn("[REP] clientShipSystem is undefined");
        //         }
        //     } else {
        //         if (repConfig.serverShipSystem) {
        //             this.admin.registerSystem(new repConfig.clientShipSystem());
        //         } else {
        //             console.warn("[REP] serverShipSystem is undefined");
        //         }
        //     }

        // //})

        if (repConfig.messageShipSystem) {
            this.admin.registerSystem(new repConfig.messageShipSystem());
        } else {
            console.warn("[REP] messageShipSystem is undefined, you must config this processor for ReplicationSystem to work");
        }

        this.admin.registerSystem(new MessageApplySystem());
    }

    scanSingleton() {
        let singletonInst;
        g_repMetaData.forEach((keyMap, ctorName) => {
            singletonInst = this.admin.getSingleton(ctorName)
            if (singletonInst) {
                this.admin.createEntity([], () => { }, {
                    signals: new ecs.Signal([RepAttachmentComponent], ([attachment]) => {
                        this.attachToNetComponent(singletonInst, attachment);
                        this.assignAttachmentID(attachment);
                        attachment.isAssocciateWithSingleton = true;
                    })
                })
            }
        })
    }

    scanNetEntities() {
        this.admin.queryAll([RepAttachmentComponent, ecs.Sibling], ([repAttachment, sibling]) => {
            this.lookForDecoratedComponent(repAttachment, sibling);
        })
    }

    lookForDecoratedComponent(
        repAttachment: RepAttachmentComponent,
        sibling: ecs.Sibling,
    ) {
        if (repAttachment.isAssocciateWithSingleton) { //these rep already took care by scanSingleton
            return;
        }
        if (repConfig.useNumericAliasKey) {
            repAttachment.aliasKeyIndex = 0;
        } else {
            repAttachment.aliasKeyIndex = 32; //first ascii character
        }
        //check for each component if they contain decorated properties
        let hasNetComponent: boolean = false;
        sibling.all().forEach((component) => {
            if (g_repMetaData.has(component.constructor.name)) {
                this.attachToNetComponent(component, repAttachment);
                hasNetComponent = true;
            }
        })

        if (hasNetComponent) {
            this.assignAttachmentID(repAttachment);
        } else {
            console.warn("[REP] using RepAttachmentComponent on entity with no decorated key");
        }
    }

    assignAttachmentID(attachment: RepAttachmentComponent) {
        attachment.repID = this.repInfo.repID;
        attachment.isValid = true;
        this.repInfo.repAttachmentMapID.set(this.repInfo.repID, attachment);
        this.repInfo.repID++;
    }

    //to watch for changes and notify our replication attachment
    attachToNetComponent(component: any, attachment: RepAttachmentComponent) {
        Object.keys(g_repMetaData.get(component.constructor.name)).forEach((key) => {
            let aliasKey = this.generateAliasKey(component.constructor.name, key, attachment);
            let keyInfo = g_repMetaData.get(component.constructor.name)[key];

            //for delivering side
            if (repConfig.repEnv == RepEnv.client && keyInfo.type == KeyRepDirection.clientToServer
                || repConfig.repEnv == RepEnv.server && keyInfo.type == KeyRepDirection.serverToClient) {
                Object.defineProperty(attachment, aliasKey, {
                    value: component[key],
                    enumerable: true,
                    configurable: true,
                    writable: true,
                })

                attachment[aliasKey] = component[key];
                let singletonAttachments = this.singletonAttachments;

                //this can be trouble if remove the repAttachment
                Object.defineProperty(component, key, {
                    set(value) {
                        let prevValue = component[key];
                        attachment[aliasKey] = value;
                        if (prevValue != value) { //only send key changed in value
                            attachment.activeKey.push(aliasKey);
                            singletonAttachments.push(attachment);
                        }
                    },
                    get() {
                        return attachment[aliasKey];
                    }
                })

                attachment.keyProcessors[aliasKey] = g_repMetaData.get(component.constructor.name)[key].deliverData.processors;
                attachment.keyBroadcastIndex[aliasKey] = g_repMetaData.get(component.constructor.name)[key].deliverData.isBroadcast;
            } else { //for processing side
                Object.defineProperty(attachment, aliasKey, {
                    set(value) {
                        component[key] = value
                    },
                    get() {
                        return component[key];
                    }
                })

                attachment.keyProcessors[aliasKey] = g_repMetaData.get(component.constructor.name)[key].receiveData.processors;
            }
        })
    }

    generateAliasKey(component: string, key: string, attachment: RepAttachmentComponent): string {
        if (repConfig.debug) {
            return component + "_" + key;
        } else {
            let aliasKey: string;
            if (repConfig.useNumericAliasKey) {
                aliasKey = attachment.aliasKeyIndex.toString();
            } else {
                if (attachment.aliasKeyIndex > 126) { //last ascii character
                    throw new Error("[REP] exceeded maximum ascii character for alias key, use useNumericAliasKey config instead");
                }
                aliasKey = String.fromCharCode(attachment.aliasKeyIndex);
            }
            attachment.aliasKeyIndex += 1;
            return aliasKey;
        }
    }

    encodeMessageKey(repKey: string, repID: number): string {
        if (repConfig.debug) {
            return repKey + "/" + repID.toString();
        } else {
            return repKey + repID.toString();
        }

    }

    updateDeliveringMessage(attachment: RepAttachmentComponent) {
        let msgKey: string;
        attachment.activeKey.forEach((key) => {
            msgKey = this.encodeMessageKey(key, attachment.repID);
            this.deliveringMsg.content[msgKey] = attachment[key];
            this.deliveringMsg.processor[msgKey] = Object.assign([], attachment.keyProcessors[key]);
            if (!attachment.keyBroadcastIndex[key] && attachment.targetClientID) {
                this.deliveringMsg.targetClient[msgKey] = attachment.targetClientID;
            }
        })
    }

    update() {
        this.admin.queryActive([RepAttachmentComponent, ecs.Sibling], ([attachment, sibling]) => {
            if (attachment.repID == -1) { //if this entity is added later on and have not been check for rep keys
                this.lookForDecoratedComponent(attachment, sibling);
            } else {
                this.updateDeliveringMessage(attachment);
                // let msgKey: string;
                // attachment.activeKey.forEach((key) => {
                //     msgKey = this.encodeMessageKey(key, attachment.repID, config);
                //     message.content[msgKey] = attachment[key];
                //     message.processor[msgKey] = Object.assign([], attachment.keyProcessors[key]);
                //     if (!attachment.keyBroadcastIndex[key] && attachment.targetClientID) {
                //         message.targetClient[msgKey] = attachment.targetClientID;
                //     }
                // })
            }
        })

        this.singletonAttachments.forEach((attachment)=>{
            if (attachment.activeKey.length > 0) {
                this.updateDeliveringMessage(attachment);
            }
        })
    }

    lateUpdate() {
        this.admin.queryActive([DeliveringMessageComponent, ReceivingMessageComponent], ([deliveringMessage, receivedMessage]) => {
            if (deliveringMessage.isReadyToShip) {
                deliveringMessage.isReadyToShip = false;
                deliveringMessage.content = {};
                deliveringMessage.processor = {};
            }

            if (receivedMessage.isReadyToApply) {
                receivedMessage.keyAddress = {};
                receivedMessage.content = {};
                receivedMessage.processor = {};
                receivedMessage.isReadyToApply = false;
            }
        })
        this.singletonAttachments.length = 0;
    }
}