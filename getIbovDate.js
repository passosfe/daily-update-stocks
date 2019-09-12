const request = require("request-promise");
const cheerio = require('cheerio')

const url = 'https://quotes.wsj.com/index/BR/BVSP'

var obj = {
    novos_ativos: [],
    cotacoes: [],
    nao_encontrados: [],
    cotacoes_novas: true,
    advfn: false,
    yahoo: false
}

exports.start = async function () {
    console.log('buscando data e valor do ibov')

    await getIbovDate()

    return obj

}

async function getIbovDate() {
    var today = new Date()
    today.setHours(0, 0, 0, 0)

    var erro;

    try {
        await request(url, function (err, resp, body) {
            if (err) { console.log(err); return err }
            const $ = cheerio.load(body)

            var data = $('#quote_dateTime').text().split(' ')
            data = data[3].split('/')
            var mes = data[0] - 1
            var dia = data[1] / 1
            var ano = ('20' + data[2]) / 1
            var ibov = $('#quote_val').text()

            var ibovDate = new Date(ano, mes, dia, 0, 0, 0, 0)

            console.log(dia + '/' + mes + '/' + ano)

            console.log('today: ' + today);
            console.log('ibovDate: ' + ibovDate)

            obj.date = today.valueOf()
            obj.ibov = ibov / 1;
        })
    } catch (err) { console.log(err) }


    return erro;
}