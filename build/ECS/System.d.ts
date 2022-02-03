import { Admin } from "./Admin";
export declare abstract class System {
    admin: Admin;
    onRegister(): void;
    update(dt: any): void;
    lateUpdate(dt: any): void;
}
