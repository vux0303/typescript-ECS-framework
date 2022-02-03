import { ecs } from "../../index";

import RepAttachmentComponent from "./RepAttachmentComponent";

export default class ReplicationComponent extends ecs.Component {
    repID: number = 0;

    clientIDs: string[] = [];

    repAttachmentMapID: Map<number, RepAttachmentComponent> = new Map();
}
