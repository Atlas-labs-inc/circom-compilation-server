const putil = require('util');
const exec = putil.promisify(require('child_process').exec);
const crypto = require("crypto");
const fs = require('fs');
const os = require('os');
const snarkjs = require('snarkjs');

const util = require('./compilation_utility');

async function getKeys(r1cs_fname, zkey_fname) {
    const constraints = await snarkjs.r1cs.info(r1cs_fname);
    const ptau_fname = util.getPowersOfTau(constraints.nConstraints);

    await snarkjs.plonk.setup(r1cs_fname, ptau_fname, zkey_fname);
    const verification_key = await snarkjs.zKey.exportVerificationKey(zkey_fname);
    const zkey_binary = fs.readFileSync(zkey_fname);
    return [verification_key, zkey_binary];
}

function writeBinaryBase64(data_base64, fname) {
    const binary_data = new Buffer.from(data_base64, 'base64');
    fs.writeFileSync(fname, binary_data);
}

/// @param full_circuit all circom code loaded into one string object
async function compile(full_circuit) {
    // Save circuit to file
    const randomization_string = crypto.randomBytes(32).toString('hex');
    const temp_file_name = `main_${randomization_string}`;
    fs.writeFileSync(`${temp_file_name}.circom`, full_circuit);
    let args = [
        './circom',
        `${temp_file_name}.circom`,
        '--wasm',
        '--r1cs'
    ]
    const delimiter = util.fileDelimiter(os.platform());
    const root_path = __dirname
        .split(delimiter)
        .slice(0, -1)
        .join(delimiter);
    const {stdout, stderr} = await exec(args.join(' '));

    const client_stdout = util.outputNormalize(randomization_string, stdout);
    const client_stderr = util.removeExpectedObject(util.outputNormalize(randomization_string, stderr));

    if(stderr.includes('error[')){
        fs.rmSync(`${temp_file_name}.circom`);
        throw Error(client_stderr);
    }
    
    const wasm_binary = fs.readFileSync(`${root_path}/${temp_file_name}_js/${temp_file_name}.wasm`, {encoding: 'binary'});
    const r1cs_binary = fs.readFileSync(`${temp_file_name}.r1cs`);
    const zkey_fname = `${temp_file_name}.zkey`;

    const [verify_json, zkey_binary] = await getKeys(`${temp_file_name}.r1cs`, zkey_fname);

    // Cleanup (including getKeys)
    fs.rmSync(`./${temp_file_name}_js`, {recursive: true, force: true});
    fs.rmSync(`${temp_file_name}.circom`);
    fs.rmSync(`${temp_file_name}.r1cs`);
    fs.rmSync(zkey_fname);

    return [wasm_binary, zkey_binary, verify_json, client_stdout, client_stderr];
} 

async function prove(wasm_base64, zkey_base64, verify_json, input){
    const randomization_string = crypto.randomBytes(32).toString('hex');
    const temp_file_name = `main_${randomization_string}`;

    writeBinaryBase64(wasm_base64, `${temp_file_name}.wasm`);
    writeBinaryBase64(zkey_base64, `${temp_file_name}.zkey`);
    let proof;
    let verify_state;
    try {
        proof = await snarkjs.plonk.fullProve(input, `${temp_file_name}.wasm`, `${temp_file_name}.zkey`);
        verify_state = await snarkjs.plonk.verify(verify_json, proof.publicSignals, proof.proof);
    }
    catch (e) {
        // Remove data before passing assert error to frontend
        fs.rmSync(`${temp_file_name}.wasm`);
        fs.rmSync(`${temp_file_name}.zkey`);
        throw Error(e.message);
    }
    fs.rmSync(`${temp_file_name}.wasm`);
    fs.rmSync(`${temp_file_name}.zkey`);

    return [proof, verify_state]
}

module.exports = {
    compile,
    prove
};