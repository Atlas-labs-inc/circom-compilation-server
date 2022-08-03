const util = require('util');
const exec = util.promisify(require('child_process').exec);
const circom2 = require('circom2');

const crypto = require("crypto");
const fs = require('fs');
const os = require('os');

/// Change how files are referenced based on server OS
const fileDelimiter = platform => {
    return platform === "win32" ? '\\' : '/';
}

/// Remove "expected" json key-value from stderr
const removeExpectedObject = (stderr) => {
    const init_str = ", expected: [";
    const expected_loc = stderr.indexOf(init_str);
    let expected_loc_end = 0;
    for (let x = expected_loc+init_str.length; x < stderr.length; x++) { 
        if(stderr.slice(x, x+3) === "] }"){
            expected_loc_end = x;
            break
        }
    }
    return (stderr.substr(0, expected_loc) + stderr.substr(expected_loc_end));
}

/// Remove server specific file names
const outputNormalize = (randomization_string, stdout) => {
    return stdout.replaceAll("_" + randomization_string, '');
}

/// @param full_circuit all circom code loaded into one string object
async function compile(full_circuit) {
    // Save circuit to file
    const randomization_string = crypto.randomBytes(32).toString('hex');
    const temp_file_name = `main_${randomization_string}`;
    fs.writeFileSync(`${temp_file_name}.circom`, full_circuit);
    let args = [
        'circom',
        `${temp_file_name}.circom`,
        '--wasm',
        '--r1cs'
    ]
    const delimiter = fileDelimiter(os.platform());
    const root_path = __dirname
        .split(delimiter)
        .slice(0, -1)
        .join(delimiter);
    const {stdout, stderr} = await exec(args.join(' '));

    const client_stdout = outputNormalize(randomization_string, stdout);
    const client_stderr = removeExpectedObject(outputNormalize(randomization_string, stderr));

    if(stderr.includes('error[')){
        fs.rmSync(`${temp_file_name}.circom`);
        throw Error(client_stderr);
    }
    
    const wasm_binary = fs.readFileSync(`${root_path}/${temp_file_name}_js/${temp_file_name}.wasm`, {encoding: 'binary'});
    const r1cs_binary = fs.readFileSync(`${temp_file_name}.r1cs`);
    
    // Cleanup
    fs.rmSync(`./${temp_file_name}_js`, {recursive: true, force: true});
    fs.rmSync(`${temp_file_name}.circom`);
    fs.rmSync(`${temp_file_name}.r1cs`);
    return [wasm_binary, r1cs_binary, client_stdout, client_stderr];
} 

module.exports = compile;