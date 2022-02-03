import { ecs } from "../../index";

export type KeyAddress = {
    repAttachmentID: number;
    aliasKey: string;
}

export default class ReceivingMessageComponent extends ecs.Component {
    isReadyToApply: boolean = false;
    keyAddress: { [key: string]: KeyAddress } = {};
    processor: { [key: string]: string[] } = {};
    content: { [key: string]: any } = {};
}