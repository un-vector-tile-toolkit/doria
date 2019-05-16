const config = require('config')
const fs = require('fs')
const express = require('express')
const MBTiles = require('@mapbox/mbtiles')
const vtpbf = require('vt-pbf')
const mapnik = require('mapnik')
const zlib = require('zlib')

const emptyTile = vtpbf({ features: [] })
const etag = 'a'

let mbtilesPool = {}


