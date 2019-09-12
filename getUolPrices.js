const request = require("request-promise");

const urlAtivos = 'http://cotacoes.economia.uol.com.br/ws/asset/stock/list?size=10000'
const urlPrecos = 'http://cotacoes.economia.uol.com.br/ws/asset/'

var ativos = [];

var obj = {}

exports.start = async function (event) {
    console.log('buscando cotacoes no uol')

    obj = event

    function CustomError(message) {
        this.name = 'CustomError';
        this.message = message;
    }
    CustomError.prototype = new Error();

    var err = await scrapeUOLAtivos();
    if (err == undefined) {
        err = await scrapeUOLPrecos();
    }

    if (err != undefined) {
        const error = new CustomError(JSON.stringify(obj));
        obj.error = error
    }

    return obj
}


async function scrapeUOLAtivos() {
    try {
        await request(urlAtivos, function (err, resp, body) {
            if (err) { return err }
            const dados = JSON.parse(body)

            for (var i = 0; i < dados.data.length; i++) {
                ativos.push({ id: dados.data[i].idt, codigo: dados.data[i].code })
            }
        })

    } catch (err) {
        console.log(err)
        return err
    }
}

async function scrapeUOLPrecos() {
    for (let i = 0; i < ativos.length; i++) {
        var urlAux = urlPrecos + ativos[i].id + '/intraday?size=400';
        try {
            await request(urlAux, function (err, resp, body) {
                if (err) { return err }
                const dados = JSON.parse(body);

                if (dados.data != undefined) {
                    let dataUOL = new Date(dados.data[0].date)
                    dataUOL.setHours(0, 0, 0, 0)

                    if (dataUOL.valueOf() == obj.date) {
                        obj.novos_ativos.push({
                            ativo: ativos[i].codigo.slice(0, -3),
                            preco: dados.data[0].price
                        })
                    }
                }
            })
        } catch (err) { console.log(err) }
    }
}