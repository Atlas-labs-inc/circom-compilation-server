const express = require('express');
const compile = require('./circom_compiler');
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/compile', async function (req, res) {
   const wasm_file = await compile(req.body.code);
   res.send(new Buffer.from(wasm_file, 'binary'));
})

const PORT = 8081;
const server = app.listen(PORT, function () {
   console.log("Example app listening at http://localhost:%s", PORT);
})

module.exports = server;