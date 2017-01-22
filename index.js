var exec = require('child_process').exec;
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-pwm-light", "PWM-Light", PWMLightAccessory);
}

function PWMLightAccessory(log, config) {
    // global vars
    this.log = log;

    // configuration vars
    this.name = config["name"];
    this.pin = config["pin"];

    log(`${this.name} on pin #${this.pin}`);

    // init pwm
    exec(`gpio -g mode ${this.pin} pwm`);
    exec(`gpio -g pwm ${this.pin} 0`, (error, stdout, stderr) => {});

    // state vars
    this.on = 0;
    this.brightness = 100;

    // register the service and provide the functions
    this.service = new Service.Lightbulb(this.name);

    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L493
    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
	.on('set', this.setOn.bind(this));

    this.service
        .getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
}

PWMLightAccessory.prototype.control = function(brightness, on) {
    if(!on) {
        brightness = 0;
    }

    brightness = Math.round(brightness * 1024 / 100);
    exec(`gpio -g pwm ${this.pin} ${brightness}`, (error, stdout, stderr) => {});
}

PWMLightAccessory.prototype.getOn = function(callback) {
    this.log("Requested On: %s", this.on);
    callback(null, this.on);
}

PWMLightAccessory.prototype.getBrightness = function(callback) {
    this.log("Requested Brightness: %s", this.brightness);
    callback(null, this.brightness);
}

PWMLightAccessory.prototype.setOn = function(on, callback) {
    this.log("Set On: %s", on);

    this.on = on;
    this.control(this.brightness, this.on);

    callback(null);
}

PWMLightAccessory.prototype.setBrightness = function(brightness, callback) {
    this.log("Set Brightness: %s", brightness);

    this.brightness = brightness;
    this.control(this.brightness, this.on);

    callback(null);
}

PWMLightAccessory.prototype.getServices = function() {
    return [this.service];
}
