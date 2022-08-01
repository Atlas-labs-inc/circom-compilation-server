const util = require('util');
const exec = util.promisify(require('child_process').exec);

const crypto = require("crypto");
const fs = require('fs');

/// @param full_circuit all .circom code loaded into 1 object
async function compile(full_circuit) {
    // Save circuit to file
    const temp_file_name = `main_${crypto.randomBytes(16).toString("hex")}`;
    fs.writeFileSync(`${temp_file_name}.circom`, full_circuit);
    let args = [
        'circom',
        `${temp_file_name}.circom`,
        '--wasm',
        '--r1cs'
    ]
    
    const root_path = __dirname
        .split('/')
        .slice(0, -1)
        .join('/')
    
    const {stdout, stderr} = await exec(args.join(' '));
    const wasm_binary = fs.readFileSync(`${root_path}/${temp_file_name}_js/${temp_file_name}.wasm`, {encoding: 'binary'})
    //console.log(WebAssembly.validate(wasm_binary));
    // fs.writeFileSync('main.wasm', Buffer.from(wasm_binary, 'binary'));
    // Cleanup
    fs.rmSync(`./${temp_file_name}_js`, {recursive: true, force: true});
    fs.rmSync(`${temp_file_name}.circom`);
    return wasm_binary;
} 

module.exports = compile;