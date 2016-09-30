import {
  chai, expect
}
from 'chai';
import should from 'should';
import CoreService from '../services/mock-core';
import MockZKClient from '../services/mock-zk';
import AmqMock from '../services/mock-amq';
import config from '../../lib/config';
import Core from '../../lib/upstream/core';
import {
  Auth
}
from '../../lib/upstream/client';
import {
  bufferJs
}
from '../fixture';
import {
  parseAMQMessage
}
from '../../lib/util/hacks';

describe('core client', function() {
  var mockCore;
  var mockZk;
  var mockAmq;
  var port = 6668;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    mockZk = new MockZKClient(port);
    mockZk.on('connected', function() {
      mockCore = new CoreService(port);
      mockAmq = new AmqMock();

      onDone();
    });
    mockZk.connect();
  });

  afterEach(function() {
    mockCore.close();
  });

  it('can get cloudy file data from core', function(onDone) {
    var request = {
      headers: {
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };

    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message));
    const core = new Core(auth, mockZk);

    core.getBlob('simple_points.json', (err, res) => {
      bufferJs(res, (err, result) => {
        expect(result).to.eql({
          "type": "FeatureCollection",
          "features": [{
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [
                102,
                0.5
              ]
            },
            "properties": {
              "a_string": "first value",
              "a_num": 2,
              "a_float": 2.2,
              "a_bool": false
            }
          }, {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [
                103,
                1.5
              ]
            },
            "properties": {
              "a_string": "second value",
              "a_num": 2,
              "a_float": 2.2,
              "a_bool": true
            }
          }]
        })
        onDone();
      })
    });
  });


  it('passes headers through to core', function(onDone) {
    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      null,
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message));
    var core = new Core(auth, mockZk);

    core.create('ffff-ffff', 'my_layer', (err, res) => {
      expect(err.status()).to.equal(502);
      onDone();
    });
  });


  it("can make a create request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message));
    var core = new Core(auth, mockZk);

    core.create('pare-ntid', 'my_layer', (err, res) => {
      expect(res.id).to.equal('qs32-qpt7');
      onDone();
    });
  });

  it("can make a replace request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message));
    var core = new Core(auth, mockZk);

    core.replace('my_layer', (err, res) => {
      expect(res.id).to.equal('qs32-qpt8');
      onDone();
    });
  });


  it("can make an updateMetadata request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message));
    var core = new Core(auth, mockZk);

    const layers = [{
      "bbox": {
        "maxx": 102,
        "maxy": 0.5,
        "minx": 102,
        "miny": 0.5
      },
      "columns": [
        {
          "dataTypeName": "multipoint",
          "fieldName": "the_geom",
          "name": "the_geom"
        },
        {
          "dataTypeName": "text",
          "fieldName": "a_string",
          "name": "a_string"
        }
      ],
      "uid": "aaaa-aaaa",
      "count": 1,
      "geometry": "multipoint",
      "name": "some points",
      "projection": "WGS 84"
    },
    {
      "bbox": {
        "maxx": 101,
        "maxy": 1,
        "minx": 101,
        "miny": 0
      },
      "columns": [
        {
          "dataTypeName": "multiline",
          "fieldName": "the_geom",
          "name": "the_geom"
        },
        {
          "dataTypeName": "text",
          "fieldName": "a_string",
          "name": "a_string"
        }
      ],
      "uid": "bbbb-bbbb",
      "count": 1,
      "geometry": "multiline",
      "name": "some lines",
      "projection": "WGS 84"
    }
  ]
    const bbox = JSON.stringify({"minx":101,"miny":0,"maxx":102,"maxy":1})

    core.updateMetadata('four-four', layers, bbox, (err, res) => {
      expect(res).to.deep.eql({
        displayType: 'map',
        metadata: {
          geo: {
            owsUrl: '/api/geospatial/four-four',
            layers: 'aaaa-aaaa,bbbb-bbbb',
            isNbe: true,
            bboxCrs: 'EPSG:4326',
            namespace: '_four-four',
            featureIdAttribute: '_SocrataID',
            bbox: '{"minx":101,"miny":0,"maxx":102,"maxy":1}'
        }
      },
      privateMetadata: { foo: 'bar', childViews: [ 'aaaa-aaaa', 'bbbb-bbbb' ] } })
      onDone();
    });
  });

});