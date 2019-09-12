const cheerio = require('cheerio');
const request = require('request-promise');

const links = ['A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9']

const url = 'https://br.advfn.com/bolsa-de-valores/bovespa/';

var ativos = [];

var obj = {
}

exports.start = async function (event) {
    console.log('buscando cotacoes faltantes na advfn')

    obj = event;
    await getAtivos();
    await getPrecos();
    obj.advfn = true
    return obj
}

async function getAtivos() {
    for (let i in links) {
        try {
            let reqPromise = {
                uri: url + links[i],
                timeout: 30000,
            }
            await request(reqPromise, function (err, resp, body) {
                if (err) { return err; }
                let $ = cheerio.load(body);
                $('table.atoz-link-bov tbody tr').each(function (i, elem) {
                    codigo = $(elem).children('td:nth-child(2)').text()
                    let is_missing = checkMissing(codigo, obj.nao_encontrados)
                    if (is_missing != -1) {
                        ativos.push({
                            ativo: codigo,
                            link: 'https:' + $(elem).children('td:first-child').children('a').attr('href'),
                            tipo: is_missing.tipo,
                            indice: is_missing.posicao,
                            precoAnterior: is_missing.precoAnterior
                        })
                    }
                });
            });
        } catch (err) {
            console.log(err)
        }
    }
}

async function getPrecos() {
    for (let i in ativos) {
        try {
            let reqPromise = {
                uri: ativos[i].link,
                timeout: 30000,
            }
            await request(reqPromise, function (err, resp, body) {
                if (err) { return err; }
                let $ = cheerio.load(body);

                let preco = $('#quoteElementPiece6').text().replace(',', '.');
                if (preco != '') {
                    obj.cotacoes.push({
                        ativo: ativos[i].ativo,
                        preco: preco,
                        tipo: ativos[i].tipo,
                        variacao: (((preco / ativos[i].precoAnterior) - 1) * 100).toFixed(2)
                    });

                    obj.nao_encontrados.splice(ativos[i].indice, 1)
                }
            })
        } catch (err) { console.log(err) }
    }
}

function checkMissing(codigo, arr) {
    for (let i in arr) {
        if (codigo == arr[i].ativo) {
            aux = {
                tipo: arr[i].tipo,
                posicao: i,
                precoAnterior: arr[i].preco
            }
            return aux;
        }
    }
    return -1;
}