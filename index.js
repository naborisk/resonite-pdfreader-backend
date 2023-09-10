const express = require('express')
const crypto = require('crypto')
const app = express()
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const { spawn } = require('child_process')
const Downloader = require('nodejs-file-downloader')
const j2e = require('json2emap')
const child_process = require('child_process')

const upload = multer({ dest: 'uploads/' })

const port = process.env.PORT || 3000

app.use(
  '/img',
  express.static('img', {
    setHeaders: (res, filename, filestats) => {
      const path = filename.split('/')
      const id = path[path.length - 2] // derive id from path
      console.log(id)
    }
  })
)

app.get('/', (req, res) => {
  const revision = child_process
    .execSync('git rev-parse --short HEAD')
    .toString()
    .trim()
  res.send('rev: ' + revision)
})

const convertToPng = (path, filename) => {
  fs.mkdirSync('img/' + filename, { recursive: true })
  const pdftoppm = spawn('pdftoppm', [path, `./img/${filename}/out`, '-png'])

  return new Promise((resolve, reject) => {
    pdftoppm.on('close', code => {
      const files = fs.readdirSync('img/' + filename)

      // return file information used for download
      resolve({
        pageCount: files.length,
        path: filename,
        files
      })

      // remove uploaded file
      spawn('rm', [path])

      // remove converted files
      //spawn('rm', ['-r', filename])
    })

    pdftoppm.on('error', err => {
      reject(err)
    })
  })
}

// load PDF from URL
app.get('/load', async (req, res) => {
  if (!req.query.url) {
    res.send('no url provided')
    return
  }

  const url = req.query.url
  const filename = crypto.createHash('md5').update(req.query.url).digest('hex')

  // return file data if exist
  if (fs.existsSync('./img/' + filename)) {
    console.log('cache found, sending to client')
    const files = fs.readdirSync('img/' + filename)
    res.send(
      j2e({
        pageCount: files.length,
        path: filename,
        files
      })
    )
    return
  }

  // if not, then download, convert, and send
  const downloader = new Downloader({
    url,
    directory: './downloads',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    fileName: filename
  })

  //download the file then process
  console.log('downloading to downloads/' + filename)
  await downloader.download()

  console.log('converting to pngs')
  const data = await convertToPng(`./downloads/${filename}`, filename)

  res.send(j2e(data))
  console.log('files information sent to client')
})

// for uploading local PDF file
app.post('/upload', upload.single('pdf'), async (req, res, next) => {
  const filename = req.file.filename
  const data = await convertToPng(req.file.path, filename)

  res.send(j2e(data))
  return
})

app.get('/delete', (req, res) => {
  if (!req.query.id) {
    res.send('no id provided')
    return
  }

  const id = req.query.id

  if (!fs.existsSync(`./img/${id}`)) {
    res.send(`pdf of id ${id} not found`)
    return
  } else {
    const rm = spawn('rm', ['-r', `./img/${id}`], { shell: true })

    rm.on('close', code => {
      res.send(`pdf of id ${id} deleted`)
    })
  }
})

app.get('/clear', (req, res) => {
  const rm = spawn('rm', ['-r', './img/*'], { shell: true })

  rm.on('close', code => {
    res.send('img cleared')
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
