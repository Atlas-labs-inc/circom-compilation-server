const server = require('../src/app.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);
// Required Client side:
const fs = require('fs');
const snarkjs = require('snarkjs');
const https = require('https');
// const Buffer

describe('Circom Compilation', () => {
    const input = {
        'a': 2,
        'b': 5
    }
    let compile_data = {};

    it('Get compile data from server', async () => {
        const res = await requestWithSupertest
            .post('/compile')
            .send({'code': "template IsSquare() {\n  signal input a;\n  signal input b;\n  b === a * a;\n}\ncomponent main {public [b]} = IsSquare();"});
        // Recreate the below code on the frontend
        compile_data['circuit_wasm'] = res.body.circuit_wasm;
        compile_data['circuit_zkey'] = res.body.circuit_zkey;
        compile_data['verify_key'] = res.body.verify_key;
    });

    it('Prove proof given an input and compile data', async () => {
      compile_data['input'] = input;
      const res = await requestWithSupertest
            .post('/prove')
            .send(compile_data);
        // Recreate the below code on the frontend
      console.log(res.body);
    });
});

afterAll(done => {
    server.close();
    done();
});