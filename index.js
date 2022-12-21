const express = require('express')
const app = express()
const multer = require('multer')
const path = require('path')
const {spawn} = require('node:child_process')

const upload = multer({dest: 'uploads/'})

const port = 3000

app.get('/', (req, res) => {
  res.send('nya')
})

app.post('/upload', upload.single('pdf'), (req, res, next) => {
  const pdftoppm = spawn('pdftoppm', [req.file.path, `out/out`, '-png'])

  pdftoppm.on('close', (code) => {

    console.log('pdftoppm process closed')
    res.sendFile('./out/out-01.png', {root: path.join(__dirname)})

    console.log('files sent to client, cleaning up...')
    //spawn('rm', ['-f', req.file.path, "./out/*"], {shell: true})
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
