const ellipticcurve = require("starkbank-ecdsa");
const Base58 = require("base-58")
const crypto = require("crypto");
const Ecdsa = ellipticcurve.Ecdsa;
const PrivateKey = ellipticcurve.PrivateKey;
const config = require("../../config.json")
let network = config.network
let network_prefix = config[network].network_prefix

let pem2coin = (pem) => {
    let pemB58 = pem.replace('-----BEGIN EC PRIVATE KEY-----','')
    pemB58 = pemB58.replace('-----END EC PRIVATE KEY-----','')
    pemB58 = pemB58.replace('-----BEGIN PUBLIC KEY-----','')
    pemB58 = pemB58.replace('-----END PUBLIC KEY-----','')
    pemB58 = pemB58.replace(/\n/g,'')
    pemB58 = Buffer.from(pemB58, 'base64')
    pemB58 = Base58.encode(pemB58)
    return pemB58
}

let getAddress = (pubkey) => {
    let hash1 = crypto.createHash('sha256').update(pubkey).digest('hex');
    let hash2 = crypto.createHash('ripemd160').update(hash1).digest('hex');
    let baseAddress = network_prefix + hash2
    let checksumCalc1 = crypto.createHash('sha256').update(baseAddress).digest('hex')
    let checksumCalc2 = crypto.createHash('sha256').update(checksumCalc1).digest('hex')
    let checksumCalc3 = crypto.createHash('sha256').update(checksumCalc2).digest('hex')
    let checksum = checksumCalc3.substr(0, 8)
    let addreessHex = baseAddress + checksum
    let address = Buffer.from(addreessHex, 'hex')
    let addressB58 = Base58.encode(address)
    return addressB58
}

let verifyAddress = (address) => {
    let addressBin = Base58.decode(address)
    let addressHex = Buffer.from(addressBin).toString('hex')
    let addressChecksum = addressHex.substr(addressHex.length - 8, addressHex.length)
    let baseAddress = addressHex.substr(0, addressHex.length-8)
    if(baseAddress.substr(0,2)!==network_prefix) {
        return false
    }
    let checksumCalc1 = crypto.createHash('sha256').update(baseAddress).digest('hex')
    let checksumCalc2 = crypto.createHash('sha256').update(checksumCalc1).digest('hex')
    let checksumCalc3 = crypto.createHash('sha256').update(checksumCalc2).digest('hex')
    let checksum = checksumCalc3.substr(0, 8)
    let valid = addressChecksum === checksum
    return valid
}

function str_split (string, splitLength) { // eslint-disable-line camelcase
    //  discuss at: https://locutus.io/php/str_split/
    // original by: Martijn Wieringa
    // improved by: Brett Zamir (https://brett-zamir.me)
    // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
    //  revised by: Theriault (https://github.com/Theriault)
    //  revised by: Rafał Kukawski (https://blog.kukawski.pl)
    //    input by: Bjorn Roesbeke (https://www.bjornroesbeke.be/)
    //   example 1: str_split('Hello Friend', 3)
    //   returns 1: ['Hel', 'lo ', 'Fri', 'end']
    if (splitLength === null) {
        splitLength = 1
    }
    if (string === null || splitLength < 1) {
        return false
    }
    string += ''
    const chunks = []
    let pos = 0
    const len = string.length
    while (pos < len) {
        chunks.push(string.slice(pos, pos += splitLength))
    }
    return chunks
}


module.exports = {
    generateKeys() {
        let privateKey = new PrivateKey();
        // console.log('privateKey', privateKey)
        let privateKeyPem = privateKey.toPem()
        // console.log('privateKeyPem', privateKeyPem)
        let privateKeyB58 = pem2coin(privateKeyPem)
        // console.log('privateKeyB58', privateKeyB58)
        let publicKey = privateKey.publicKey();
        // console.log('publicKey', publicKey)
        let publicKeyPem = publicKey.toPem()
        // console.log('publicKeyPem', publicKeyPem)
        let publicKeyB58 = pem2coin(publicKeyPem)
        // console.log('publicKeyB58', publicKeyB58)
        return {
            privateKey: privateKeyB58,
            publicKey: publicKeyB58
        }
    },
    getAddress,
    pem2coin,
    sign(data, privateKey) {
        // console.log(`Sign ${data} with ${privateKey}`)
        let signature = Ecdsa.sign(data, privateKey);
        // console.log('signature',signature)
        let signature_b64 = signature.toBase64()
        // console.log('signature_b64',signature_b64)
        let signature_bin = Buffer.from(signature_b64, 'base64')
        // console.log('signature_bin',signature_bin)
        let signature_b58 = Base58.encode(signature_bin)
        // console.log('signature_b58',signature_b58)
        return signature_b58
    },
    privateKeyToPem(privateKeyBase58) {
        let private_key_bin = Base58.decode(privateKeyBase58)
        // console.log('private_key_bin',private_key_bin)
        let private_key_base64 = Buffer.from(private_key_bin).toString('base64');
        // console.log('private_key_base64', private_key_base64)
        let private_key_pem = '-----BEGIN EC PRIVATE KEY-----\n'
            + str_split(private_key_base64, 64)
                .join('\n')
            + '\n-----END EC PRIVATE KEY-----\n'
        // console.log('private_key_pem',private_key_pem)
        let privateKey = PrivateKey.fromPem(private_key_pem)
        // console.log('privateKey',privateKey)
        return privateKey
    },
    encryptWallet(wallet, pass) {
        let passphrase = crypto.createHash('sha256').update(pass).digest().toString('hex').substr(0, 32)
        let iv = crypto.randomBytes(16).toString('hex').substr(0, 16)
        // console.log(passphrase, iv)
        let cipher = crypto.createCipheriv('aes-256-cbc', passphrase, iv)
        let enc = cipher.update(wallet, 'utf8', 'base64')
        enc += cipher.final('base64')
        // console.log("enc", enc)
        let enc2 = iv + enc
        // console.log("enc2", enc2)
        let enc3 = Buffer.from(enc2).toString('base64')
        return enc3
    },
    decryptWallet(encrypted, pass) {
        let passphrase = crypto.createHash('sha256').update(pass).digest().toString('hex').substr(0, 32)
        let enc2 = Buffer.from(encrypted, 'base64').toString()
        let iv = enc2.substr(0, 16)
        let enc = enc2.substr(16)
        let decipher = crypto.createDecipheriv('aes-256-cbc', passphrase, iv)
        let decrypted = decipher.update(enc, 'base64', 'utf8')
        let wallet = (decrypted + decipher.final('utf8'))
        return wallet
    },
    importPrivateKey(privateKey) {
        try {
            let privateKeyPem = this.privateKeyToPem(privateKey)
            let publicKeyDer = privateKeyPem.publicKey()
            let publicKeyPem = publicKeyDer.toPem()
            let publicKey = pem2coin(publicKeyPem)
            let address = getAddress(publicKey)
            if(!verifyAddress(address)) {
                return false
            }
            return {
                privateKey,publicKey,address
            }
        } catch (e) {
            return false
        }
    }
}
