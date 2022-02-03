import { KeyAddress } from "./Components/ReceivingMessageComponent";

export class RepUtils {
    static decodeKey = function (key: string, debug: boolean): KeyAddress {
        let keyAddress: KeyAddress = {
            repAttachmentID: null,
            aliasKey: null
        }
        if (debug) {
            let info = key.split('/')
            keyAddress.aliasKey = info[0];
            keyAddress.repAttachmentID = +info[1];
        } else {
            keyAddress.aliasKey = key.charAt(0);
            keyAddress.repAttachmentID = +key.substring(1);
        }
        return keyAddress;
    }
}
