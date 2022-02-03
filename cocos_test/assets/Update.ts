

const { ccclass, property } = cc._decorator;

export function findPrimeNumber(n: number): number {
    let count = 0;
    let a = 2;
    while (count < n) {
        let b = 2;
        let prime = 1;// to check if found a prime
        while (b * b <= a) {
            if (a % b == 0) {
                prime = 0;
                break;
            }
            b++;
        }
        if (prime > 0) {
            count++;
        }
        a++;
    }
    return (--a);
}

@ccclass
export default class Update extends cc.Component {
    prime: number;

    update(dt) {
        this.prime = 10;
    }
}
