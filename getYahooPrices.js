const cheerio = require('cheerio')
const request = require('request-promise')

var obj = {
}

exports.start = async function (event) {
    console.log('buscando cotacoes faltantes no yahoo')

    obj = event;
    await getCotacoes();
    obj.yahoo = true
    return obj
}

async function getCotacoes() {

    for (let i in obj.nao_encontrados) {
        let ativo = obj.nao_encontrados[i].ativo;
        let url = 'https://finance.yahoo.com/quote/' + ativo + '.SA/?p=' + ativo + '.SA'
        try {
            await request(url, function (err, resp, body) {
                if (err) { return err }
                let $ = cheerio.load(body);
                let preco = $("#quote-header-info div:nth-child(3) div div span").text()
                preco = preco.slice(0, (preco.indexOf('.') + 3)).replace(',', '')

                if (preco != '') {
                    obj.cotacoes.push({
                        ativo: ativo,
                        preco: preco,
                        tipo: obj.nao_encontrados[i].tipo,
                        variacao: ((((preco / 1) / obj.nao_encontrados[i].preco) - 1) * 100).toFixed(2)
                    })

                    obj.nao_encontrados.splice(i, 1)
                }

            });
        } catch (err) { console.log(err.options.uri, err.statusCode) }
    }
}
