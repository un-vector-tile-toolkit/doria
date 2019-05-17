const config = require('config')
const fs = require('fs')
const express = require('express')
const MBTiles = require('@mapbox/mbtiles')
const vtpbf = require('vt-pbf')
const zlib = require('zlib')
const vtcomposite = require('@mapbox/vtcomposite')

const farms = require(config.get('farmsPath'))
const port = config.get('port')
const htdocsPath = config.get('htdocsPath')

const emptyTile = zlib.gzipSync(vtpbf({ features: [] }))
const etag = 'a'
const compositeOp = { compress: true }

let mbtilesPool = {}

const buildStyle = (stylePath) => {
  let style = require(stylePath)
  style.sources.v.tiles[0] = config.get('templateUrl')
  style.sources.v.attribution = config.get('attribution')
  return JSON.stringify(style, null, 2)
}

const style = buildStyle(config.get('stylePath'))

const tile2long = (x, z) => {
  return x / 2 ** z * 360 - 180
}

const tile2lat = (y, z) => {
  const n = Math.PI - 2 * Math.PI * y / 2 ** z
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

const app = express()
app.use(express.static(htdocsPath))

const openMbtiles = (mbtilesPath) => {
  return new Promise((resolve, reject) => {
    new MBTiles(`${mbtilesPath}?mode=ro`, (err, mbtiles) => {
      if (err) {
        reject(err)
      }
      resolve(mbtiles)
    })
  })
}

const getMbtiles = (mbtilesPath) => {
  let mbtiles = mbtilesPool[mbtilesPath]
  if (!mbtiles) {
    try {
      mbtiles = mbtilesPool[mbtilesPath] = openMbtiles(mbtilesPath)
    } catch (e) {
      console.error(e)
    }
  }
  return mbtiles
}

const getEachTile = (mbtiles, z, x, y) => {
  return new Promise((resolve, reject) => {
    mbtiles.getTile(z, x, y, (err, tile, headers) => {
      if (err) reject(err)
      resolve(tile)
    })
  })
}

const getConcatenatedTile = (z, x, y) => {
  return new Promise(async (resolve, reject) => {
    let tiles = []
    for (let key in farms) {
      const mbtilesPath = farms[key].getMbtilesPath(z, x, y)
      let mbtiles = getMbtiles(mbtilesPath)
      try {
        let tile = await getEachTile(await mbtiles, z, x, y)
        if (tile) tiles.push({ buffer: tile, z: z, x: x, y: y })
      } catch (e) {
        continue
      }
    }
    if (tiles.length === 0) resolve(emptyTile)
    vtcomposite(tiles, { z: z, x: x, y: y }, compositeOp, (err, result) => {
      if (err) {
        reject(err)
      }
      resolve(result)
    })
  })
}

app.get(`/zxy/:z/:x/:y.pbf`, async (req, res) => {
  const z = parseInt(req.params.z)
  const x = parseInt(req.params.x)
  const y = parseInt(req.params.y)
  getConcatenatedTile(z, x, y).then(tile => {
    res.set('content-type', 'application/vnd.mapbox-vector-tile')
    res.set('content-encoding', 'gzip')
    res.send(tile)
  }).catch(e => {
    res.status(404).send(`tile not found /zxy/${z}/${z}/${y}.pbf: ${e}`)
  })
})

app.get('/style.json', async (req, res) => {
  res.send(style)
})

app.listen(port)

