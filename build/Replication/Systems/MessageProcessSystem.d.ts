import { ecs } from "../../index";
import DeliveringMessageComponent from "../Components/DeliveringMessageComponent";
import ReceivingMessageComponent from "../Components/ReceivingMessageComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
export default abstract class MessageProcessSystem extends ecs.System {
    repInfo: ReplicationComponent;
    onRegister(): void;
    update(): void;
    checkUpDeliveringMessage(deliveringMessage: DeliveringMessageComponent): void;
    checkUpReceivingMessage(receivingMessage: ReceivingMessageComponent): void;
    _shipMessage(deliveringMessage: DeliveringMessageComponent): void;
    shipMessageAtClient(content: any): void;
    shipMessageAtServer(personalMsg: any, broadcastContent: any): void;
    applyMessage(): void;
    private _process;
    process(content: any): void;
    getKeyCurrentValue(key: string): any;
}
