var express = require('express');
var app = express();

const prices = require('./data/prices.json');
const spents = require('./data/spents.json');
const supplies = require('./data/supplies.json');

const kmPorL = 12;

function getPrice(data) {
    var pricesFiltrados = prices.filter(e => {
        return (converterData(e.date) <= data);
    });

    return pricesFiltrados.sort(function (a, b) {
        if (converterData(a.date) > converterData(b.date)) {
            return 1;
        }
        if (converterData(a.date) < converterData(b.date)) {
            return -1;
        }
        return 0;
    })[pricesFiltrados.length - 1];
}

function isDate(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
        if (isNaN(d.getTime())) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function converterData(strData) {
    var data = new Date(strData);
    var from = strData.split("/");

    data = new Date(from[2], from[1] - 1, from[0]);

    return data;
}

function dataAtualFormatada(data) {
    dia = data.getDate().toString(),
        diaF = (dia.length == 1) ? '0' + dia : dia,
        mes = (data.getMonth() + 1).toString(), //+1 pois no getMonth Janeiro começa com zero.
        mesF = (mes.length == 1) ? '0' + mes : mes,
        anoF = data.getFullYear();
    return diaF + "/" + mesF + "/" + anoF;
}

function getLitros(data) {
    var supply = supplies.filter(e => {
        return datasIguais(converterData(e.date), data);
    })[0];

    var price = getPrice(data);

    if (!price) {
        return null;
    }
    //console.log(supply.value);
    //console.log(dataAtualFormatada(data));

    return supply.value / price.value;
}

function datasIguais(a, b) {
    return a.day == b.day && a.month == b.month && a.year == b.year;
}

function getGasto(data) {
    var spentDoDia = spents.filter(e => {
        return datasIguais(converterData(e.date), data);
    })[0];

    if (!spentDoDia) {
        return null;
    }

    return spentDoDia.value / kmPorL;
}

app.get('/get-price', function (req, res) {
    var dataRecebida = converterData(req.query.data);
    var retorno = getPrice(dataRecebida);
    res.json(retorno);
});

app.get('/get-litros', function (req, res) {
    var dataRecebida = converterData(req.query.data);
    var retorno = getLitros(dataRecebida);
    res.json(retorno);
});

app.get('/get-saldos', function (req, res) {
    var spentsOrdenado = spents.sort(function (a, b) {
        if (converterData(a.date) > converterData(b.date)) {
            return 1;
        }
        if (converterData(a.date) < converterData(b.date)) {
            return -1;
        }
        return 0;
    });

    var saldos = [];
    var saldo = 0;
    var count = 0;
    for (var d = converterData(spentsOrdenado[0].date); d <= converterData(spentsOrdenado[spentsOrdenado.length - 1].date); d.setDate(d.getDate() + 1)) {
        var supplyDoDia = getLitros(d);
        if (supplyDoDia) {
            saldo += supplyDoDia;
        }

        var gastoDoDia = getGasto(d);
        if (gastoDoDia) {
            saldo -= gastoDoDia;
        }

        if (count < 20) {
            console.log(dataAtualFormatada(new Date(d)));
            console.log(supplyDoDia);
            console.log(gastoDoDia);
            console.log(saldo);
            count++;
        }

        saldos.push({ date: dataAtualFormatada(new Date(d)), value: saldo.toFixed(2) });
    }

    res.json(saldos);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});