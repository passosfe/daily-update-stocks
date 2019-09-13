'use strict'
const AWS = require('aws-sdk');

AWS.config.update({ region: "sa-east-1" })
const S3 = new AWS.S3();
const BUCKET_ATIVOS = '**********'
const KEY_DIARIO = 'DIARIO/COTACOES.json'
//process.env.BUCKET_ATIVOS

var obj = {}

exports.start = async function (event) {
    console.log('comparando cotacoes iniciais com arquivo do ultimo dia')
    obj = event;

    const fileS3 = await getS3Object()
    obj.nao_encontrados = fileS3.cotacoes;
    obj.variacao_ibov = (((obj.ibov / fileS3.ibov) - 1) * 100).toFixed(2)

    await compareFile()

    obj.cotacoes_faltando = obj.nao_encontrados.length
    if (obj.novos_ativos.length > 0) {
        obj.cotacoes_novas = true
    }

    return obj
}

function getS3Object() {
    return S3.getObject({
        Bucket: BUCKET_ATIVOS,
        Key: KEY_DIARIO,
        ResponseContentType: 'text/plain'
    })
        .promise()
        .then(resp => {
            const file = JSON.parse(resp.Body)
            return file;
        })
}

async function compareFile() {
    var novosqtd = obj.novos_ativos.length
    var naoencqtd = obj.nao_encontrados.length
    for (let i = 0; i < novosqtd; i++) {
        let ativo = obj.novos_ativos[i].ativo
        for (let k = 0; k < naoencqtd; k++) {
            let ativo_aux = obj.nao_encontrados[k].ativo

            if (ativo == ativo_aux) {

                obj.cotacoes.push({
                    ativo: obj.novos_ativos[i].ativo,
                    preco: obj.novos_ativos[i].preco,
                    tipo: obj.nao_encontrados[k].tipo,
                    variacao: (((obj.novos_ativos[i].preco / obj.nao_encontrados[k].preco) - 1) * 100).toFixed(2)
                })

                obj.novos_ativos.splice(i, 1)
                obj.nao_encontrados.splice(k, 1)

                novosqtd--;
                naoencqtd--;

                i--;
                k--;

                break
            }
        }
    }
}