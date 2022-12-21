const express = require('express')
const app = express()
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const {spawn} = require('node:child_process')

const upload = multer({dest: 'uploads/'})

const port = 3000

app.get('/', (req, res) => {
  res.send('up!')
})

app.post('/upload', upload.single('pdf'), (req, res, next) => {
  const filename = req.file.filename

  // create working directory
  fs.mkdirSync(filename)

  // spawn pdftoppm process to convert pdf to png
  const pdftoppm = spawn('pdftoppm', [req.file.path, `${filename}/out`, '-png'])

  pdftoppm.on('close', (code) => {

    console.log('pdftoppm process closed')

    const files = fs.readdirSync(filename)

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
    spawn('rm', ['-r', filename])
  })
})

app.get('/download', (res, req) => {
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
