import fs from 'fs';

export class FileLogger {
  constructor(filePath, forwardConsole = false) {
    this.filePath = filePath;
    this.recording = '';
    this.forwardConsole = forwardConsole;
    this.callback = () => {};
  }

  log(...messages) {
    // Format the messages with a timestamp
    const timestamp = new Date().toISOString();
    const logMessages = messages.map(message => `${JSON.stringify(message)}`);

    // Append the log messages to the file
    try {
      var message = `${timestamp}: ` + logMessages.join('') + '\n'
      this.recording += message;
      this.callback(message);
      fs.appendFileSync(this.filePath, `${timestamp}: ` + logMessages.join('') + '\n');

      if (this.forwardConsole) {
        console.log(...messages);
      }
    } catch (error) {
      console.log('[FileLogger] Error writing to log file:', error);
    }
  }

  onLog(callback) {
    this.callback = callback;
  }
  
  offLog() {
    this.callback = () => {};
  }

  record(){
    this.recording = '';
  }

  recordResult(){
    return this.recording;
  }

  error(...messages) {
    this.log(`ERROR: ${messages}`);
  }
}