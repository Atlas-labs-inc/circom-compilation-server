
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

/// Return file name of stored ptau file based on circuit constraint size
const getPowersOfTau = (nConstraints) => {
    const pots = [
        {
            name: "powersOfTau28_hez_final_11.ptau",
            maxConstraints: 1 << 11,
            size: 2442392,
        },
        {
            name: "powersOfTau28_hez_final_12.ptau",
            maxConstraints: 1 << 12,
            size: 4801688,
        },
        {
            name: "powersOfTau28_hez_final_13.ptau",
            maxConstraints: 1 << 13,
            size: 9520280,
        },
        {
            name: "powersOfTau28_hez_final_14.ptau",
            maxConstraints: 1 << 14,
            size: 18957464,
        },
        {
            name: "powersOfTau28_hez_final_15.ptau",
            maxConstraints: 1 << 15,
            size: 37831832,
        },
        {
            name: "powersOfTau28_hez_final_16.ptau",
            maxConstraints: 1 << 16,
            size: 75580568,
        }
    ];
    return `ptau_files/${pots.find(function (p) { return p.maxConstraints >= nConstraints; }).name}`;
}

module.exports = {
    fileDelimiter,
    removeExpectedObject,
    outputNormalize,
    getPowersOfTau
}