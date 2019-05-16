const config = require('config')
const fs = require('fs')
const express = require('express')
const MBTiles = require('@mapbox/mbtiles')
const vtpbf = require('vt-pbf')
const zlib = require('zlib')

const farms = require(config.get('farmsPath'))
const port = config.get('port')
const htdocsPath = config.get('htdocsPath')

const emptyTile = vtpbf({ features: [] })
const etag = 'a'

let mbtilesPool = {}

const tile2long = (x, z) => {
  return x / 2 ** z * 360 - 180
}

const tile2lat = (y, z) => {
  const n = Math.PI - 2 * Math.PI * y / 2 ** z
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

const app = express()
app.use(express.static(htdocsPath))


app.listen(port)

