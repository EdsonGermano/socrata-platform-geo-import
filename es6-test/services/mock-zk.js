import {EventEmitter} from 'events';


class MockZKClient extends EventEmitter {
  constructor(corePort) {
    super();
    if(!corePort) throw new Error('MockZKClient needs a core port');
    this._corePort = corePort;
  }

  enableErrors() {
    this._broken = true;
  }

  disableErrors(){
    this._broken = false;
  }

  get corePort() {
    return this._corePort;
  }

  _err(message) {
    return {
        toJSON : () => ({
        statusCode: 503,
        body: message
      })
    };
  }

  getCore(cb) {
    if(!this._isConnected) return cb(this._err("zk not yet connected"));
    if(this._broken) return cb(this._err("zk connection is dead"));
    return cb(false, `http://localhost:${this.corePort}`);
  }

  connect() {
    setTimeout(function() {
      this._isConnected = true;
      this.emit('connected');
    }.bind(this), 20);

  }
}



export default MockZKClient;