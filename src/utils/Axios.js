import {net} from "electron";

function getResponse(response, data) {
    let r = data.toString('utf-8')
    let contentType = response.headers['content-type']
    // console.log("contentType", contentType, response)
    if(contentType.startsWith('application/json')) {
        try {
            r = JSON.parse(r)
        } catch (e) {
            console.error(e)
            r = null
        }
    }
    return r
}

function get(url) {
    // console.log("call axios get ", url)
    return new Promise(resolve => {
        const request = net.request(url)
        let out = ''
        request.on('response', (response) => {
            response.on('data', (data) => {
                out += data
            })
            response.on('end', () => {
                // console.log('request ended')
                resolve(getResponse(response, out))
            })
        })
        request.end()
    })
}

function post(url, postData) {
    return new Promise(resolve => {
        postData = new URLSearchParams(postData).toString()
        console.log("Calling post", postData)
        let request = net.request({
            method: 'POST',
            url
        })
        request.setHeader('Content-Type','application/x-www-form-urlencoded')
        request.on('response', (response) => {
            response.on('data', (data) => {
                resolve(getResponse(response, data))
            })
            response.on('end', () => {

            })
        })
        request.write(postData)
        request.end()
    })
}

export {
    get, post
}
