const ibov = require('./getIbovDate')
const uol = require('./getUolPrices')
const advfn = require('./getADVFNPrices')
const compareFileS3 = require('./compareFileS3')
const updateDynamoDB = require('./updateDynamoDB')
const getYahooPrices = require('./getYahooPrices')
const upDailyFile = require('./upDailyFile')

module.exports.func = async function () {
    console.log('Comecando a buscar cotacoes')

    await ibov.start()
        .then(obj => uol.start(obj))
        .then(obj => compareFileS3.start(obj))
        .then(obj => isMissingPrices(obj))
        .then(obj => upDailyFile.start(obj))
        .catch((err) => { console.log(err) })


    console.log('Busca de cotacoes concluida')

}

async function isMissingPrices(obj) {

    var complete = false
    do {
        console.log('iniciando verificacao de faltantes')
        if ((obj.nao_encontrados.length == 0) || (obj.yahoo == true && obj.advfn == true)) {
            obj = await updateDynamoDB.start(obj)
            complete = true
        } else if (obj.nao_encontrados.length > 0 && obj.advfn == false) {
            obj = await advfn.start(obj)
            console.log('fim advfn')
        } else if (obj.nao_encontrados.length > 0 && obj.yahoo == false) {
            obj = await getYahooPrices.start(obj)
            console.log('fim yahoo')
        }
    } while (complete == false)

    return obj
}