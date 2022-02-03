import { ecs } from "../../index";
export default class RepAttachmentComponent extends ecs.Component {
    activeOnCreation: boolean;
    repID: number;
    isValid: boolean;
    isAssocciateWithSingleton: boolean;
    aliasKeyIndex: number;
    keyBroadcastIndex: {
        [key: string]: boolean;
    };
    keyProcessors: {
        [key: string]: string[];
    };
    activeKey: string[];
    targetClientID: string;
}
