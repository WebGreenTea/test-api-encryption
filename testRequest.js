const axios = require('axios')
const crypto = require('crypto');
require('dotenv').config()

const URL = process.env.URL;
const API_KEY = process.env.API_KEY;
const TOKEN = process.env.TOKEN;
start();

async function start(){
    // const R1 = crypto.randomBytes(16/2).toString('hex')
    const R1 = generateRandomString(16);
    console.log('R1 -> ',R1);
    var R2 = await requestR2(R1);
    console.log('R2 -> ',R2);
    if(R2){
        let r3 = R1+R2
        console.log("R1+R2 -> ",r3)
        r3 = crypto.createHash('sha256').update(r3).digest('hex');
        console.log("SHA256 -> ",r3)

        const KEY = r3.substring(0,16)
        console.log('key -> ',KEY);
        const IV = r3.split("").reverse().join("").substring(0,12);
        console.log('IV  -> ',IV)


        console.log("\n-----TEST GET DATA FROM API----")

        await axios.get(URL+'/test/get-encrypt',{
            headers: {
                'Authorization':TOKEN,
                'X-API-Key': API_KEY,
                'r1': R1
            }
        }).then(res => {
            console.log('Raw data from API -> ',res.data.data.test_message);
            console.log('Decrypted data -> ',decrypt(res.data.data.test_message,KEY,IV));
        }).catch(err => console.log(err));


        console.log("\n-----TEST POST DATA TO API----")
        let enc_data = encrypt("this is test message",KEY,IV);
        let exampleList = [1,2,3,4];
        let enc_list = [];
        exampleList.forEach(ele => {
            enc_list.push(encrypt(ele,KEY,IV));
        });
        console.log('encrypted data to send -> ',enc_data);
        console.log('encrypted data in list to send -> ',enc_list);
        await axios.post(URL+'/test/post-encrypt',{
            "test_message":enc_data,
            "test_list":enc_list
        },{
            headers: {
                'Authorization':TOKEN,
                'X-API-Key': API_KEY,
                'r1': R1
            }
        }).then(res => {
            console.log('decrypted data from API -> ',res.data.data.decrypted_data);
            console.log('decrypted data list from API -> ',res.data.data.decrypted_data_list);
        }).catch(err => console.log(err.response.data));

    }
}
async function requestR2(R1){
    let r2 = null;
    await axios.post(URL+'/R2',{
    'r1':R1
    },{
    headers: {
        'Authorization':TOKEN,
        'X-API-Key': API_KEY,
    }
    }).then(res => {
        console.log(res.data)
        r2 = res.data.data.r2;
        
    }).catch(err => console.log(err.response.data));
    return r2;
}
function encrypt(data,key,iv){
    data = String(data)
    const cipher  = crypto.createCipheriv('aes-128-gcm', key, iv);
    let enc = cipher.update(data, 'utf8', 'base64');
    enc += cipher.final('base64');
    //console.log("AuthTag ",cipher.getAuthTag().toString('hex'))
    enc = bin2hex(enc)+cipher.getAuthTag().toString('hex')
    return enc
}
function decrypt(enc_data,key,iv){
    const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv);
    enc_data = hex2bin(enc_data)
    return decipher.update(enc_data, 'base64', 'utf8');
}
function bin2hex(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
}
function hex2bin(hex){
    var bytes = [];
    for(var i=0; i< hex.length-1; i+=2)
        bytes.push(parseInt(hex.substr(i, 2), 16));
    return String.fromCharCode.apply(String, bytes);    
}
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      randomString += chars[randomIndex];
    }
    return randomString;
}