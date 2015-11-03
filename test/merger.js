import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from './fixture';
var expect = chai.expect;


var SoQLPoint = require('../lib/soql/point'),
  SoQLLine = require('../lib/soql/line'),
  SoQLPolygon = require('../lib/soql/polygon'),
  SoQLMultiPoint = require('../lib/soql/multipoint'),
  SoQLMultiLine = require('../lib/soql/multiline'),
  SoQLMultiPolygon = require('../lib/soql/multipolygon');

var SoQLText = require('../lib/soql/text'),
  SoQLBoolean = require('../lib/soql/boolean'),
  SoQLNumber = require('../lib/soql/number'),
  SoQLArray = require('../lib/soql/array'),
  SoQLObject = require('../lib/soql/object');



var GeoJSON = require('../lib/decoders/geojson');
var merger = require('../lib/decoders/merger');

describe('unit :: merging feature streams to layers, reprojecting from scratch file', function() {


  it('soql mapping :: homogenous points, default crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_points.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        expect(f0).to.eql([
          new SoQLPoint('the_geom', {
            coordinates: [102, 0.5]
          }),
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        expect(f1).to.eql([
          new SoQLPoint('the_geom', {
            coordinates: [103, 1.5]
          }),
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous points, heterogenous non wgs84 crs', function(onDone) {


    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('multi_non_wgs84.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var l0Geom = f0[0];
        l0Geom.value.coordinates[0].should.be.approximately(-97.48, 0.01);
        l0Geom.value.coordinates[1].should.be.approximately(0.000004, 0.01);


        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        var l1Geom = f1[0];
        l1Geom.value.coordinates[0].should.be.approximately(10.78, 0.01);
        l1Geom.value.coordinates[1].should.be.approximately(45.03, 0.01);

        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous points, heterogenous crs', function(onDone) {


    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('multi_crs.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var theGeom = f0[0];
        theGeom.value.coordinates[0].should.be.approximately(-97.48, 0.01);
        theGeom.value.coordinates[1].should.be.approximately(0.000004, 0.01);


        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        expect(f1).to.eql([
          new SoQLPoint('the_geom', {
            coordinates: [103, 1.5]
          }),
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous lines, heterogenous crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_lines.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'linestring'],
        ['a_string', 'string']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var [
          [a, b],
          [c, d]
        ] = f0[0].value.coordinates;
        a.should.be.approximately(-97.48, 0.01);
        b.should.be.approximately(0, 0.01);
        c.should.be.approximately(-97.48, 0.01);
        d.should.be.approximately(0, 0.01);

        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
        ]);

        var l1Geom = f1[0];

        [
          [a, b],
          [c, d]
        ] = f1[0].value.coordinates;
        expect(a).to.equal(101.0);
        expect(b).to.equal(0.0);
        expect(c).to.equal(101.0);
        expect(d).to.equal(1.0);


        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value')
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous polygons, heterogenous crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_polygons.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'polygon'],
        ['a_string', 'string']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var [
          [
            [a, b],
            [c, d],
            [e, f],
            [g, h],
            [i, j]
          ],
          [
            [k, l],
            [m, n],
            [o, p],
            [q, r],
            [s, t]
          ]
        ] = f0[0].value.coordinates;

        a.should.be.approximately(-97.48, 0.01);
        k.should.be.approximately(-97.48, 0.01);

        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
        ]);

        expect(f1[0].value.coordinates).to.eql([
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0]
          ],
          [
            [100.2, 0.2],
            [100.8, 0.2],
            [100.8, 0.8],
            [100.2, 0.8],
            [100.2, 0.2]
          ]
        ]);

        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value')
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous multipoints, heterogenous crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_multipoints.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'multipoint'],
        ['a_string', 'string']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var [
          [a, b],
          [c, d]
        ] = f0[0].value.coordinates;
        a.should.be.approximately(-97.48, 0.01);
        b.should.be.approximately(0, 0.01);
        c.should.be.approximately(-97.48, 0.01);
        d.should.be.approximately(0, 0.01);

        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
        ]);

        expect([
          [101.0, 0.0],
          [101.0, 1.0]
        ]).to.eql(f1[0].value.coordinates);


        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value')
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous multilines, heterogenous crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_multilines.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'multilinestring'],
        ['a_string', 'string']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var [
          [
            [a, b],
            [c, d],
          ],
          [
            [e, f],
            [g, h]
          ]
        ] = f0[0].value.coordinates;

        a.should.be.approximately(-97.48, 0.01);
        b.should.be.approximately(0, 0.01);
        c.should.be.approximately(-97.48, 0.01);
        d.should.be.approximately(0, 0.01);
        e.should.be.approximately(-97.48, 0.01);
        f.should.be.approximately(0, 0.01);
        g.should.be.approximately(-97.48, 0.01);
        h.should.be.approximately(0, 0.01);

        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
        ]);

        expect(f1[0].value.coordinates).to.eql([
          [
            [101.0, 0.0],
            [102.0, 1.0]
          ],
          [
            [102.0, 2.0],
            [103.0, 3.0]
          ]
        ]);

        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value')
        ]);

        onDone();
      });
    });
  });


  it('soql mapping :: homogenous multilines, heterogenous crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_multipolygons.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'multipolygon'],
        ['a_string', 'string']
      ]);


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var [
          [
            [
              [a, b]
            ]
          ],
          [
            [
              [c, d],
            ],
            [
              [e, f],
            ]
          ]
        ] = f0[0].value.coordinates;

        a.should.be.approximately(-97.48, 0.01);
        b.should.be.approximately(0, 0.01);
        c.should.be.approximately(-97.48, 0.01);
        d.should.be.approximately(0, 0.01);
        e.should.be.approximately(-97.48, 0.01);
        f.should.be.approximately(0, 0.01);

        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
        ]);

        expect(f1[0].value.coordinates).to.eql([
          [
            [
              [103.0, 2.0],
              [102.0, 2.0],
              [103.0, 3.0],
              [102.0, 3.0],
              [103.0, 2.0]
            ]
          ],
          [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0]
            ],
            [
              [100.2, 0.2],
              [100.8, 0.2],
              [100.8, 0.8],
              [100.2, 0.8],
              [100.2, 0.2]
            ]
          ]
        ]);

        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value')
        ]);

        onDone();
      });
    });
  });

});