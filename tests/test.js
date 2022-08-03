const server = require('../src/app.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);
const fs = require('fs');
const snarkjs = require('snarkjs');
const https = require('https');

async function downloadFile (url, targetFile) {  
    return await new Promise((resolve, reject) => {
      https.get(url, response => {
        const code = response.statusCode ?? 0
  
        if (code >= 400) {
          return reject(new Error(response.statusMessage))
        }
  
        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
          return downloadFile(response.headers.location, targetFile)
        }
  
        // save the file to disk
        const fileWriter = fs
          .createWriteStream(targetFile)
          .on('finish', () => {
            resolve({})
          })
  
        response.pipe(fileWriter)
      }).on('error', error => {
        reject(error)
      })
    })
  }

function fetchPtau (nConstraints)  {
    pots = [
        {
        url: "https://cloudflare-ipfs.com/ipfs/bafybeierwc3pmc2id2zfpgb42njkzvvvj4s333dcq4gr5ri2ixa6vuxi6a",
        name: "powersOfTau28_hez_final_11.ptau",
        maxConstraints: 1 << 11,
        size: 2442392,
        },
        {
        url: "https://cloudflare-ipfs.com/ipfs/bafybeibyoizq4sfp7sfomoofgczak3lgispbvviljjgdpchsxjrb4p6qsi",
        name: "powersOfTau28_hez_final_12.ptau",
        maxConstraints: 1 << 12,
        size: 4801688,
        },
        {
        url: "https://cloudflare-ipfs.com/ipfs/bafybeiderqjodw2mc6m5fqnc7edsun5eu4niupyw3cdsiruospa66y5vam",
        name: "powersOfTau28_hez_final_13.ptau",
        maxConstraints: 1 << 13,
        size: 9520280,
        },
        {
        url: "https://cloudflare-ipfs.com/ipfs/bafybeihuh2cuustfaraum3txs2scrl5vaukkc6u5ztf27jlyx5xhtsz5ti",
        name: "powersOfTau28_hez_final_14.ptau",
        maxConstraints: 1 << 14,
        size: 18957464,
        },
        {
        url: "https://dweb.link/ipfs/bafybeihfv3pmjkfmefpwdxwmxxqtsax4ljshnhl3qai4v62q5r2wszix34",
        name: "powersOfTau28_hez_final_15.ptau",
        maxConstraints: 1 << 15,
        size: 37831832,
        },
        {
        url: "https://cloudflare-ipfs.com/ipfs/bafybeiajy6lpqym5fvszu4klbzoqzljwhv4ocxvqmwvlwrg6pd6rieggd4",
        name: "powersOfTau28_hez_final_16.ptau",
        maxConstraints: 1 << 16,
        size: 75580568,
        },
        {
        url: "https://dweb.link/ipfs/bafybeib6a55iwy4666wxcwo7vy756sn36cwyx7u2u5idqcjxopwa7wpb3m",
        name: "powersOfTau28_hez_final_17.ptau",
        maxConstraints: 1 << 17,
        size: 151078040,
        },
        {
        url: "https://dweb.link/ipfs/bafybeidmnn4gwlirvok6vllpu4b7hkgheyemmptmeqgmhk3ony6aanv77e",
        name: "powersOfTau28_hez_final_18.ptau",
        maxConstraints: 1 << 18,
        size: 302072984,
        },
    ];
    return pots.find(function (p) { return p.maxConstraints >= nConstraints; });
}

describe('Circom Compilation', () => {
    const r1cs_fname = 'main.r1cs';
    const wasm_fname = 'main.wasm';
    const ptau_fname = 'main.ptau';
    const zkey_fname = 'proving.zkey';
    const verification_key_fname = 'verification_key.json';

    const input = {
        'a': 2,
        'b': 4
    }

    it('Get WASM + R1CS from Server', async () => {
        const res = await requestWithSupertest
            .post('/compile')
            .send({'code': "template IsSquare() {\n  signal input a;\n  signal input b\n  b === a * a;\n}\ncomponent main {public [b]} = IsSquare();"});
        // Recreate the below code on the frontend
        console.log("Compiler Output:",res.body);
        const wasm_binary = new Buffer.from(res.body['circuit_wasm'], 'base64');
        const r1cs_binary = new Buffer.from(res.body['circuit_r1cs'], 'base64');
        //console.log(res.body['circuit_wasm']);
        fs.writeFileSync(wasm_fname, wasm_binary);
        fs.writeFileSync(r1cs_fname, r1cs_binary);
    });

    it('Fail to get WASM + R1CS due to invalid code', async () => {
      const res = await requestWithSupertest
            .post('/compile')
            .send({'code': "pragma circom 2.0.0\ntemplate IsSquare() {\n  signal input a;\n  signal input b;\n  b === a * a;\n}\ncomponent main {public [b]} = IsSquare();"});
      console.log("Compiler Output:",res.body);
      expect(Object.keys(res.body)).toEqual(['stderr']);
    });

    it('Collect a PTAU file based on circuit size', async () => {
        const circuit_info = await snarkjs.r1cs.info(r1cs_fname);
        const ptau_url = fetchPtau(circuit_info.nConstraints).url;
        await downloadFile(ptau_url, ptau_fname);
    });

    it('Setup PLONK keys', async () => {
        await snarkjs.plonk.setup(r1cs_fname, ptau_fname, zkey_fname);
        const verification_key = await snarkjs.zKey.exportVerificationKey(zkey_fname);
        fs.writeFileSync(verification_key_fname, JSON.stringify(verification_key));
    });
    
    it('Generate and Prove Proof', async () => {
        const proof = await snarkjs.plonk.fullProve(input, wasm_fname, zkey_fname);
        const verify_state = await snarkjs.plonk.verify(JSON.parse(fs.readFileSync(verification_key_fname)),proof.publicSignals,proof.proof);
        expect(verify_state).toEqual(true);
    });
});

afterAll(done => {
    server.close();
    done();
});