'use strict'
const AWS = require('aws-sdk');

AWS.config.update({ region: "sa-east-1" })
var S3 = new AWS.S3();
const BUCKET_ATIVOS = '*************'
const KEY_TEMP_DIARIO = 'TMP/COTACOES.json'

var newFile = {
    cotacoes: []
}

exports.start = async function (event) {

    console.log('atualizando arquivo diario')

    await upNew(event)
        .catch(err => { console.log(err) })

}

async function upNew(obj) {

    makeNewCotacoesFile(obj.novos_ativos, true)
    makeNewCotacoesFile(obj.cotacoes)
    makeNewCotacoesFile(obj.nao_encontrados)

    newFile.date = obj.date

    newFile.ibov = obj.ibov

    const buffer = JSON.stringify(newFile)

    await putS3Object(buffer);

}

function makeNewCotacoesFile(arr, novo) {
    if (novo) {
        for (let i in arr) {
            newFile.cotacoes.push({
                ativo: arr[i].ativo,
                preco: arr[i].preco,
                tipo: 'NOVO'
            })
        }
    } else {
        for (let i in arr) {
            newFile.cotacoes.push({
                ativo: arr[i].ativo,
                preco: arr[i].preco,
                tipo: arr[i].tipo
            })
        }
    }

}

function putS3Object(body) {
    return S3.putObject({
        Body: body,
        Bucket: BUCKET_ATIVOS,
        ContentType: 'text/plain',
        Key: KEY_TEMP_DIARIO
    }).promise();
}