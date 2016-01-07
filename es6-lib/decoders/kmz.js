import yauzl from 'yauzl';
import KML from './kml';
import through from 'through';
import uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import es from 'event-stream';
import {
  Duplex
}
from 'stream';
import logger from '../util/logger';
import config from '../config';


/**
 * ZIP archives are dumb in that their directory structure
 * is stored in a footer, so we have to unzip it onto disk
 * and then pipe it through the KML transform UGH
 */
class KMZ extends Duplex {

  constructor(disk) {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });

    this._zName = '/tmp/kmz_' + uuid.v4() + '.zip';
    this._zBuffer = disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
    this._kmlDecoder = new KML();
  }

  static canDecode() {
    return ['application/vnd.google-earth.kmz'];
  }

  _write(chunk, encoding, done) {
    return this._zBuffer.write(chunk, null, done);
  }

  _onFinished() {
    logger.debug('Finished reading stream, closing underlying kmz buffer');
    this._zBuffer.end();
  }

  _onBuffered() {
    this.emit('readable');
  }

  _onOpenKmlStream(kmlStream, zipFile) {
    kmlStream
      .pipe(this._kmlDecoder)
      .on('error', (err) => {
        this.emit('error', err);
      })
      .on('data', (data) => {
        if (!this.push(data)) {
          kmlStream.pause();
          this._readableState.pipes.once('drain', () => {
            kmlStream.resume();
          });
        }
      })
      .on('end', () => {
        if (zipFile.entriesRead === zipFile.entryCount) {
          this.push(null);
        }
      });
  }

  _startPushing() {
    this._isPushing = true;
    yauzl.open(this._zName, (err, zipFile) => {
      if (err) return this.emit('error', err);
      zipFile
        .on('error', (err) => {
          this.emit('error', err);
        })
        .on('entry', (entry) => {
          if (path.extname(entry.fileName) !== '.kml') return;

          zipFile.openReadStream(entry, (err, kmlStream) => {
            if (err) return this.emit('error', err);
            logger.info(`Extracting kml ${entry.fileName} from kmz archive`);
            this._onOpenKmlStream(kmlStream,  zipFile);
          });
        });
    });
  }

  //just cuz
  _read() {
    if (!this._readableState.emittedReadable && !this._isPushing) {
      this.once('readable', this._startPushing.bind(this));
    } else if (!this._isPushing) {
      this._startPushing();
    }
  }

  summarize(cb) {
    return this._kmlDecoder.summarize(cb);
  }

  canSummarizeQuickly() {
    return false;
  }
}

export default KMZ;