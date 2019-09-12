'use strict'
const AWS = require('aws-sdk');
AWS.config.update({ region: "sa-east-1" })

const TABLE_NAME = "infoAtivos"


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.start = async function (event) {
    console.log('salvando cotacoes diarias na dynamodb')
    console.log('qtd novos: ' + event.novos_ativos.length)
    console.log('qtd cotacoes: ' + event.cotacoes.length)


    if (event.novos_ativos.length > 0) {
        await putNovos(event.novos_ativos, new Date(event.date))
    }

    await updateExistentes(event.cotacoes, new Date(event.date))

    await updateIbov(event.ibov, event.variacao_ibov, new Date(event.date))

    return event

}

async function putNovos(ativos, date) {
    const dynamoDB = new AWS.DynamoDB()
    for (let i in ativos) {
        const params = {
            Item: {
                "codigo": {
                    S: ativos[i].ativo.toString()
                },
                "preco": {
                    N: ativos[i].preco.toString()
                },
                "ultima_atualizacao": {
                    N: date.valueOf().toString()
                },
                "inicio": {
                    N: date.getFullYear().toString()
                }
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: TABLE_NAME
        };

        dynamoDB.putItem(params, function (err, data) {
            if (err) console.log("Erro: " + ativos[i].ativo, err, err.stack);
            else console.log("Inserido: " + ativos[i].ativo, data);
        });

        await sleep(120)
    }
}

async function updateExistentes(ativos, date) {
    const dynamoDB = new AWS.DynamoDB()

    var k = 0
    for (let i in ativos) {
        const params = {
            ExpressionAttributeNames: {
                '#A': 'preco',
                '#B': 'ultima_atualizacao',
                '#C': 'variacao'
            },
            ExpressionAttributeValues: {
                ":r": {
                    N: ativos[i].preco.toString()
                },
                ":p": {
                    N: date.valueOf().toString()
                },
                ":q": {
                    N: ativos[i].variacao.toString()
                }
            },
            Key: {
                "codigo": {
                    S: ativos[i].ativo
                }
            },
            ReturnValues: "ALL_NEW",
            TableName: TABLE_NAME,
            UpdateExpression: "SET #A = :r, #B = :p, #C = :q"
        };

        dynamoDB.updateItem(params, function (err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON: IBOV", JSON.stringify(err, null, 2));
            } else {
                console.log("UpdateItem succeeded: " + ativos[i].ativo, data);
                k++
            }
        })

        await sleep(120)
    }
    console.log('total up: ' + k)
}
async function updateIbov(indice, variacao, date) {
    const dynamoDB = new AWS.DynamoDB()
    const ativo = "IBOV"
    const params = {
        ExpressionAttributeNames: {
            '#A': 'preco',
            '#B': 'ultima_atualizacao',
            '#C': 'variacao'
        },
        ExpressionAttributeValues: {
            ":r": {
                N: indice.toString()
            },
            ":p": {
                N: date.valueOf().toString()
            },
            ":q": {
                N: variacao.toString()
            }
        },
        Key: {
            "codigo": {
                S: ativo
            }
        },
        ReturnValues: "ALL_NEW",
        TableName: TABLE_NAME,
        UpdateExpression: "SET #A = :r, #B = :p, #C = :q"
    };

    dynamoDB.updateItem(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON: IBOV", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    })
}