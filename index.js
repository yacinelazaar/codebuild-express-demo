const express = require('express')
const app = express()
const port = 3000

require('custom-env').env(true)

app.get('/', (req, res) => res.send('Hello World! This is the ' + process.env.APP_ENV + ' env.'))

app.listen(port,() => console.log(`Example app listening on port ${port}!`))

module.exports = app