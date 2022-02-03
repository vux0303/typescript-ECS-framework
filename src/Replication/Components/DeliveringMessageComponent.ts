import { ecs } from "../../index";

export default class DeliveringMessageComponent extends ecs.Component {
    isReadyToShip: boolean = false;
    targetClient: {[key:string]: string} = {};
    processor: {[key:string]: string[]} = {};
    content: {[key:string]: any} = {};
}

