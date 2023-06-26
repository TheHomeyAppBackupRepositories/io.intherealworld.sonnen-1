"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class MyApp extends homey_1.default.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log("InTheRealWorld Sonnen has been initialized");
    }
}
module.exports = MyApp;
