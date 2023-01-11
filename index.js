const express = require('express')
const crypto = require('crypto')
const app = express()
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const {spawn} = require('child_process')
const Downloader = require('nodejs-file-downloader')
const j2e = require('json2emap')

const upload = multer({dest: 'uploads/'})

const port = 3000

app.use('/img', express.static('img', {
  setHeaders: (res, filename, filestats) => {
    const path = filename.split('/')
    const id = path[path.length-2] // derive id from path
    console.log(id)
  }
}))

app.get('/', (req, res) => {
  res.send('up!')
})

const convertToPng = (filename) => {
  fs.mkdirSync('img/' + filename)
  console.log('spawning pdftoppm')
  const pdftoppm = spawn('pdftoppm', [`./downloads/${filename}`, `./img/${filename}/out`, '-png'])

  return new Promise((resolve, reject) => {
    pdftoppm.on('close', (code) => {

      console.log('pdftoppm process closed')

      const files = fs.readdirSync('img/' + filename)

      // return file information used for download
      resolve({
        pageCount: files.length,
        path: filename,
        files
      })

      console.log('files infortmation sent to client, cleaning up...')

      // remove uploaded file
      spawn('rm', [`./downloads/${filename}`])

      // remove converted files
      //spawn('rm', ['-r', filename])
    })

    pdftoppm.on('error', err => {reject(err)})
  })
}

// load PDF from URL
app.get('/load', async (req, res) => {
  if(!req.query.url) {
    res.send('no url provided')
    return
  }

  const url = req.query.url
  const filename = crypto.createHash('md5').update(req.query.url).digest('hex')

  if(fs.existsSync('./img/' + filename)) {
      const files = fs.readdirSync('img/' + filename)
      res.send({
        pageCount: files.length,
        path: filename,
        files
      })
    return
  }

  const downloader = new Downloader({
    url,
    directory: './downloads',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    fileName: filename,
  })

  //download the file then process
  console.log('downloading to downloads/' + filename)
  await downloader.download()

  const data = convertToPng(filename)

  res.send(j2e(data))
})

// for uploading local PDF file
app.post('/upload', upload.single('pdf'), (req, res, next) => {
  const filename = req.file.filename

  // create working directory
  fs.mkdirSync('img/' + filename)

  // spawn pdftoppm process to convert pdf to png
  const pdftoppm = spawn('pdftoppm', [req.file.path, `./img/${filename}/out`, '-png'])

  pdftoppm.on('close', (code) => {

    console.log('pdftoppm process closed')

    const files = fs.readdirSync('img/' + filename)

    // return file information used for download
    res.send(j2e({
      pageCount: files.length,
      path: filename,
      files
    }))

    console.log('files infortmation sent to client, cleaning up...')
    // remove uploaded file
    spawn('rm', [req.file.path])

    // remove converted files
    //spawn('rm', ['-r', filename])
  })
})

app.get('/clear', (req, res) => {
  const rm = spawn('rm', ['-r', './img/*'], {shell: true})
  rm.on('close', code => {
    res.send('img cleared')
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
