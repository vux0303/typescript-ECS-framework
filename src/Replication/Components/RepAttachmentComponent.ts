import { ecs } from "../../index";

export default class RepAttachmentComponent extends ecs.Component {
    activeOnCreation: boolean = true;

    repID: number = -1;

    isValid: boolean = false; //invalid if attach to entity with no decorated key

    isAssocciateWithSingleton: boolean = false;

    aliasKeyIndex: number = 32;

    keyBroadcastIndex: { [key: string]: boolean } = {};

    keyProcessors: { [key: string]: string[] } = {};

    activeKey: string[] = [];

    targetClientID: string;// will be initiate for server side solely
}
