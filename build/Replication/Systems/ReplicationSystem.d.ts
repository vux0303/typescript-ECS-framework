import { ecs } from "../../index";
import DeliveringMessageComponent from "../Components/DeliveringMessageComponent";
import RepAttachmentComponent from "../Components/RepAttachmentComponent";
import ReplicationComponent from "../Components/ReplicationComponent";
export default class ReplicationSystem extends ecs.System {
    repInfo: ReplicationComponent;
    deliveringMsg: DeliveringMessageComponent;
    singletonAttachments: RepAttachmentComponent[];
    onRegister(): void;
    registerSubSystem(): void;
    scanSingleton(): void;
    scanNetEntities(): void;
    lookForDecoratedComponent(repAttachment: RepAttachmentComponent, sibling: ecs.Sibling): void;
    assignAttachmentID(attachment: RepAttachmentComponent): void;
    attachToNetComponent(component: any, attachment: RepAttachmentComponent): void;
    generateAliasKey(component: string, key: string, attachment: RepAttachmentComponent): string;
    encodeMessageKey(repKey: string, repID: number): string;
    updateDeliveringMessage(attachment: RepAttachmentComponent): void;
    update(): void;
    lateUpdate(): void;
}
