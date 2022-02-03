import { ecs } from "../../index";
import RepAttachmentComponent from "./RepAttachmentComponent";
export default class ReplicationComponent extends ecs.Component {
    repID: number;
    clientIDs: string[];
    repAttachmentMapID: Map<number, RepAttachmentComponent>;
}
