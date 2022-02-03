import { ecs } from "../../index";
export declare type KeyAddress = {
    repAttachmentID: number;
    aliasKey: string;
};
export default class ReceivingMessageComponent extends ecs.Component {
    isReadyToApply: boolean;
    keyAddress: {
        [key: string]: KeyAddress;
    };
    processor: {
        [key: string]: string[];
    };
    content: {
        [key: string]: any;
    };
}
