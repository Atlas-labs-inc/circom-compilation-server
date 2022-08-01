const server = require('../src/app.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);
const fs = require('fs');
describe('Circom Compilation', () => {
    it('Get WASM', async () => {
        const res = await requestWithSupertest
            .post('/compile')
            .send({'code': `template IsSquare() {
                signal input a;
                signal input b;
                b === a * a;
            }
            component main {public [b]} = IsSquare();            
            `});
        console.log(res);
        fs.writeFileSync('main.wasm', Buffer.from(res.body, 'binary'));
    });
});

afterAll(done => {
    server.close();
    done();
});