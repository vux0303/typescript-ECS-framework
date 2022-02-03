import { Component } from "./Component";
import { ClassConstructor } from "./TypeDefine";
export declare class Sibling extends Component {
    get<T extends ClassConstructor>(Ctor: T): InstanceType<T>;
    all(): any[];
}
