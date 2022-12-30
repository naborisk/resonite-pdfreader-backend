const express = require('express')
const crypto = require('crypto')
const app = express()
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const {spawn} = require('node:child_process')
const Downloader = require('nodejs-file-downloader')

const upload = multer({dest: 'uploads/'})

const port = 3000

app.use('/img', express.static('img'))

app.get('/', (req, res) => {
  res.send('up!')
})

app.get('/pdf/:file', (req, res) => {

  res.send(req.params.file)
})

// load PDF from URL
app.get('/load', (req, res) => {
  if(!req.query.url) res.send('no url provided')

  const url = req.query.url
  const fileName = crypto.randomBytes(16).toString('hex')

  const downloader = new Downloader({
    url,
    directory: './downloads',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    fileName,
  })

  //download the file then process
  console.log('downloading to downloads/' + fileName)
  downloader.download().then(file => {
    console.log('downloaded')
    console.log(file)

    fs.mkdirSync('img/' + fileName)

    const pdftoppm = spawn('pdftoppm', [`./downloads/${fileName}`, `./img/${fileName}/out`, '-png'])
    pdftoppm.on('close', (code) => {

      console.log('pdftoppm process closed')

      const files = fs.readdirSync('img/' + fileName)

      // return file information used for download
      res.json({
        pageCount: files.length,
        path: fileName,
        files
      })

      console.log('files infortmation sent to client, cleaning up...')

      // remove uploaded file
      spawn('rm', [`./downloads/${fileName}`])

      // remove converted files
      //spawn('rm', ['-r', filename])
    })
  })
  
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
    res.json({
      pageCount: files.length,
      path: filename,
      files
    })

    console.log('files infortmation sent to client, cleaning up...')
    // remove uploaded file
    spawn('rm', [req.file.path])

    // remove converted files
    //spawn('rm', ['-r', filename])
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
