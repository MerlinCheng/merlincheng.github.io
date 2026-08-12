var serial = {};

(function() {
  'use strict';

  serial.getPorts = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => new serial.Port(device));
    });
  };

  serial.requestPort = function() {
    const filters = [
      { 'vendorId': 0x0835, 'productId': 0xFF1F }, // USB Duo
      { 'vendorId': 0x0835 }, // Action Star Boards!
    ];
    return navigator.usb.requestDevice({ 'filters': filters }).then(
      device => new serial.Port(device)
    );
  }

  serial.Port = function(device) {
    this.device_ = device;
    this.interfaceNumber_ = 2;  // original interface number of WebUSB Arduino demo
    this.endpointIn_ = 5;       // original in endpoint ID of WebUSB Arduino demo
    this.endpointOut_ = 4;      // original out endpoint ID of WebUSB Arduino demo
  };

  serial.Port.prototype.connect = function() {
    let readLoop = () => {
      this.device_.transferIn(this.endpointIn_, 64).then(result => {
        this.onReceive(result.data);
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this.device_.open()
        .then(() => {
          if (this.device_.configuration === null) {
            return this.device_.selectConfiguration(1);
          }
        })
        .then(() => {
          var configurationInterfaces = this.device_.configuration.interfaces;
          configurationInterfaces.forEach(element => {
            element.alternates.forEach(elementalt => {
              if (elementalt.interfaceClass==0xff) {
                this.interfaceNumber_ = element.interfaceNumber;
                elementalt.endpoints.forEach(elementendpoint => {
                  if (elementendpoint.direction == "out") {
                    this.endpointOut_ = elementendpoint.endpointNumber;
                  }
                  if (elementendpoint.direction=="in") {
                    this.endpointIn_ =elementendpoint.endpointNumber;
                  }
                })
              }
            })
          })
        })
        .then(() => this.device_.claimInterface(this.interfaceNumber_))
        .then(() => this.device_.selectAlternateInterface(this.interfaceNumber_, 0))
        // The vendor-specific interface provided by a device using this
        // Arduino library is a copy of the normal Arduino USB CDC-ACM
        // interface implementation and so reuses some requests defined by
        // that specification. This request sets the DTR (data terminal
        // ready) signal high to indicate to the device that the host is
        // ready to send and receive data.
		/*
        .then(() => this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x01,
            'index': this.interfaceNumber_}))
		*/
        .then(() => {
          readLoop();
        })
		;
  };

  serial.Port.prototype.disconnect = function() {
    // This request sets the DTR (data terminal ready) signal low to
    // indicate to the device that the host has disconnected.
    return this.device_.close(); 
	/*
    return this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x00,
            'index': this.interfaceNumber_})
        .then(() => this.device_.close()); 
		*/
  };

  serial.Port.prototype.send = function(data) {
    return this.device_.transferOut(this.endpointOut_, data);
  };
  
  serial.Port.prototype.sendbuf = function(data) {
//	var buf=new Array(512).join(0x00);
//	const buf = Buffer.alloc(512); // Creates a buffer of 512 bytes filled with 0x00
	var buf = new Uint8Array(64); // 512 bytes initialized to 0
//	const buf = new Array(512).fill(data[0]); // Array of 512 elements, each set to 0
//    return this.device_.transferOut(this.endpointOut_, data);
	buf.fill(0x55); 
	console.log(buf);
	var vcnt=0;
	for (let b = 0; b < 4; b++) {	// 1024 * 4 = 4K
	for (let k = 0; k < 16; k++) {	// 64 * 16 = 1024
			this.device_.transferOut(this.endpointOut_, buf);
			vcnt++;
		}
		}
	console.log(vcnt);
    return vcnt;
//    return this.device_.transferOut(this.endpointOut_, buf);
  };
  
})();
