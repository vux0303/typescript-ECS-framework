import { Admin } from "./Admin";

export abstract class System {
    admin: Admin;
    //abstract readonly filter: Filter;

    onRegister() {
    }

    update(dt) {
    }

    lateUpdate(dt) {
    }
}