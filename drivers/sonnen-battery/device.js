"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const homey_1 = __importDefault(require("homey"));
const POLL_INTERVAL = 10 * 1000;
let pollInterval;
class MyDevice extends homey_1.default.Device {
    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.log("MyDevice has been initialized");
        pollInterval = setInterval(this.onPoll.bind(this), POLL_INTERVAL);
        await this.addCapability("measure_battery").catch(this.error);
        await this.addCapability("measure_power.consumption").catch(this.error);
        await this.addCapability("measure_power.production").catch(this.error);
        await this.addCapability("measure_power.grid_in").catch(this.error);
        await this.addCapability("measure_power.grid_out").catch(this.error);
        await this.addCapability("measure_power.batt_in").catch(this.error);
        await this.addCapability("measure_power.batt_out").catch(this.error);
        await this.addCapability("sonnen_light").catch(this.error);
        await this.addCapability("sonnen_state.bms").catch(this.error);
        await this.addCapability("sonnen_state.core").catch(this.error);
        await this.addCapability("sonnen_state.inv").catch(this.error);
        await this.addCapability("sonnen_weather").catch(this.error);
        this.registerCapabilityListener("sonnen_weather", async (value) => {
            await this.setWeatherForecast(value);
        });
    }
    async gridInHigherThan(value) {
        return Number(this.getCapabilityValue("measure_power.grid_in")) > value;
    }
    async setWeatherForecast(on) {
        this.log("setting weather forecast to ", on);
        let config = {
            method: "put",
            maxBodyLength: Infinity,
            url: `http://${this.getStore().lanip}:80/api/v2/configurations`,
            headers: {
                "Auth-Token": this.getSettings().apikey,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: qs_1.default.stringify({
                EM_Prognosis_Charging: on ? "1" : "0",
            }),
        };
        await axios_1.default
            .request(config)
            .then(() => {
            this.log("weather forecast has been set");
        })
            .catch((err) => this.log("failed to set weather config", err));
    }
    onPoll() {
        this.log("polling Sonnen Battery");
        //this.log(this.getStore(), this.getSettings().apikey, this.getData());
        if (this.getSettings().apikey) {
            axios_1.default
                .get(`http://${this.getStore().lanip}:80/api/v2/latestdata`, {
                headers: { "Auth-Token": this.getSettings().apikey },
            })
                .then((res) => {
                this.setCapabilityValue("measure_battery", res.data.USOC);
                this.setCapabilityValue("measure_power.production", res.data.Production_W);
                this.setCapabilityValue("measure_power.consumption", res.data.Consumption_W);
                this.setCapabilityValue("measure_power.grid_in", res.data.GridFeedIn_W > 0 ? res.data.GridFeedIn_W : 0);
                this.setCapabilityValue("measure_power.grid_out", res.data.GridFeedIn_W < 0 ? -res.data.GridFeedIn_W : 0);
                this.setCapabilityValue("measure_power.batt_in", res.data.Pac_total_W > 0 ? res.data.Pac_total_W : 0);
                this.setCapabilityValue("measure_power.batt_out", res.data.Pac_total_W < 0 ? -res.data.Pac_total_W : 0);
                for (const key of Object.keys(res.data.ic_status["Eclipse Led"])) {
                    if (res.data.ic_status["Eclipse Led"][key]) {
                        this.setCapabilityValue("sonnen_light", key);
                    }
                }
                this.setCapabilityValue("sonnen_state.bms", res.data.ic_status.statebms);
                this.setCapabilityValue("sonnen_state.core", res.data.ic_status.statecorecontrolmodule);
                this.setCapabilityValue("sonnen_state.inv", res.data.ic_status.stateinverter);
            })
                .catch((err) => {
                this.log("failed to connect to Sonnen API", err);
                axios_1.default
                    .get("https://find-my.sonnen-batterie.com/find")
                    .then((res) => {
                    if (res.data) {
                        for (const e of res.data) {
                            if (this.getName() === e.info) {
                                this.log("found device and resetting", e.device, e.lanip);
                                this.setStoreValue("lanip", e.lanip);
                            }
                        }
                    }
                })
                    .catch((err) => this.log("failed to find sonnen batteries", err));
            });
            axios_1.default
                .get(`http://${this.getStore().lanip}:80/api/v2/configurations/EM_Prognosis_Charging`, {
                headers: { "Auth-Token": this.getSettings().apikey },
            })
                .then((res) => {
                this.setCapabilityValue("sonnen_weather", res.data.EM_Prognosis_Charging === "1" ? true : false);
            })
                .catch((err) => this.log("failed to connect to Sonnen API - weather", err));
        }
    }
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log("MyDevice has been added");
    }
    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys, }) {
        this.log("MyDevice settings where changed");
    }
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log("MyDevice was renamed");
    }
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log("MyDevice has been deleted");
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    }
}
module.exports = MyDevice;
