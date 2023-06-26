"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const homey_1 = __importDefault(require("homey"));
class MyDriver extends homey_1.default.Driver {
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log("MyDriver has been initialized");
        const gridToCondition = this.homey.flow.getConditionCard("to-grid-watt");
        gridToCondition.registerRunListener(async (args) => {
            this.log("to grid condition");
            return await args.device.gridInHigherThan(args.Wattage);
        });
        const weatherForecastOn = this.homey.flow.getConditionCard("weather-forecast-is-on");
        weatherForecastOn.registerRunListener(async (args) => {
            this.log("sonnen weather forecast condition");
            return await args.device.getCapabilityValue("sonnen_weather");
        });
        const turnOnWeatherForecast = this.homey.flow.getActionCard("turn-on-weather-forecast");
        turnOnWeatherForecast.registerRunListener(async (args) => {
            this.log("weather forecast activated action to ON");
            await args.device.setWeatherForecast(true);
        });
        const turnOffWeatherForecast = this.homey.flow.getActionCard("turn-off-weather-forecast");
        turnOffWeatherForecast.registerRunListener(async (args) => {
            this.log("activating weather forecast action to OFF");
            await args.device.setWeatherForecast(false);
        });
    }
    /**
     * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    async onPairListDevices() {
        try {
            const response = await axios_1.default.get("https://find-my.sonnen-batterie.com/find");
            if (response.data) {
                this.log("results found", response.data);
                const results = [];
                for (const e of response.data) {
                    results.push({
                        name: e.info,
                        data: {
                            id: e.device,
                        },
                        store: {
                            lanip: e.lanip,
                        },
                    });
                }
                return results;
            }
        }
        catch (error) {
            console.error(error);
        }
        return [];
    }
}
module.exports = MyDriver;
