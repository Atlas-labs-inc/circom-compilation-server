const express = require('express');
const cors = require('cors');
const compiler = require('./circom_compiler');
const bodyParser = require("body-parser");
const snarkjs = require('snarkjs');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', async function (req, res) {
   res.status(200).send("Atlas ZK Compilation Server");
});

app.post('/compile', async function (req, res) {
   console.log("Request received:", req.body.code);
   try{
      const [ wasm, zkey, verify, stdout, stderr ] = await compiler.compile(req.body.code);
      const wasm_base64 = new Buffer.from(wasm, 'binary').toString('base64');
      const zkey_base64 = new Buffer.from(zkey, 'binary').toString('base64');

      res.status(200).json({
         'circuit_wasm': wasm_base64,
         'circuit_zkey': zkey_base64,
         'verify_key': verify,
         'stdout': stdout,
         'stderr': stderr
      });
   } catch (e) {
      res.status(400).json({
         'stderr': e.message
      });
   }
});

app.post('/prove', async function (req, res) {
   try{

      const [proof_data, proof_status] = await compiler.prove(
         req.body.circuit_wasm,
         req.body.circuit_zkey,
         req.body.verify_key,
         req.body.input
      );
      
      res.status(200).json({
         "proof_data": proof_data,
         "proof_status": proof_status
      });
   } catch (e) {
      console.log(e);
      res.status(400).json({
         'error': e.message
      });
   }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, function () {
   console.log("App listening at %s", server.address());
});

module.exports = server;