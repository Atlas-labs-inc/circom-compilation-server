const express = require('express');
const cors = require('cors');
const compile = require('./circom_compiler');
const bodyParser = require("body-parser");
const snarkjs = require('snarkjs');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', async function (req, res) {
   res.status(200).send("Atlas ZK Compilation Server");
});

app.post('/compile', async function (req, res) {
   try{
      const [ wasm, r1cs, stdout, stderr ] = await compile(req.body.code);
      const wasm_base64 = new Buffer.from(wasm, 'binary').toString('base64');
      const r1cs_base64 = new Buffer.from(r1cs, 'binary').toString('base64');
      res.status(200).json({
         'circuit_wasm': wasm_base64,
         'circuit_r1cs': r1cs_base64,
         'stdout': stdout,
         'stderr': stderr
      });
   } catch (e) {
      res.status(400).json({
         'stderr': e.message
      });
   }
});

const PORT = process.env.PORT | 3000;
const server = app.listen(PORT, function () {
   console.log("App listening at %s", server.address());
});

module.exports = server;