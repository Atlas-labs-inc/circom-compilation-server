# Atlas ZK Backend
Max constraints: `64k`

## API
**Endpoint: https://atlaszk.herokuapp.com/**
### `POST /compile`
*request*
```json
{
    "code": ""
}
```
*receive*
```json
{
    "circuit_wasm": "",
    "circuit_zkey": "",
    "verify_key": {},
    "stdout": "",
    "stderr": ""
}
```
### `POST /prove`
*request*
```json
{
    "circuit_wasm": "",
    "circuit_zkey": "",
    "verify_key": {},
    "input": {}
}
```
*receive*
```json
{
    "proof_data": {
        "proof": {},
        "publicSignals": []
    },
    "proof_status": true
}
```