import {
  getDecoderForContentType
}
from '../decoders';
import Disk from '../decoders/disk';
import Merger from '../decoders/merger';
import _ from 'underscore';
import logger from '../util/logger';
import DevNull from '../util/devnull';
import config from '../config';
const conf = config();

class SummaryService {
  _fullSummary(req) {
    //Not content length because the core http was sometimes omitting it and sometimes
    //including it? It would crash when setting it twice.
    var rSize = req.headers['x-blob-length'];
    if (!rSize) return logger.warn("X-Blob-Length omitted, going with abbreviated summary");
    return (rSize < conf.abbreviateSummarySize);
  }


  post(req, res) {
    var disk = new Disk(res);
    //;_; see the note in service/spatial for why
    //this exists
    var onErr = _.once((err) => {
      req.log.error(err.toJSON(), "Failed to generate summary");
      return res.status(err.status()).send(err.toJSON());
    });

    var [err, decoder] = getDecoderForContentType(req, disk);
    if (err) return onErr(err);

    var ok = (layers) => {
      res.status(200).send(JSON.stringify({
        layers: layers
      }));
    };

    if (this._fullSummary(req) && !decoder.canSummarizeQuickly()) {
      req.log.info("Making full summary");

      req
        .pipe(decoder)
        .on('error', onErr)
        .pipe(new Merger(disk, [], true))
        .on('error', onErr)
        .on('end', (layers) => {
          ok(layers.map((layer) => layer.toJSON()));
        });

    } else if (!decoder.canSummarizeQuickly()) {
      decoder.summarize((err, summary) => {
        if (err) return onErr(err);
        return ok(summary);
      });
    } else {
      req.log.info("Making abbreviated summary");

      req
        .pipe(decoder)
        .once('data', (_datum) => {
          decoder.pause();
          decoder.summarize((err, summary) => {
            if (err) return onErr(err);
            return ok(summary);
          });
        })
        .on('error', (err) => {
          if (err.code === 'EPIPE') return;
          return onErr(err);
        });
    }


  }
}

export
default SummaryService;