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

function converterData(strData) {
    var data = new Date(strData);
    var from = strData.split("/");

    data = new Date(from[2], from[1]-1, from[0]);
    return data;
}

function dataAtualFormatada(data) {
    dia = data.getDate().toString(),
    diaF = (dia.length == 1) ? '0' + dia : dia,
    mes = (data.getMonth() + 1).toString(),
    mesF = (mes.length == 1) ? '0' + mes : mes,
    anoF = data.getFullYear();

    return diaF + "/" + mesF + "/" + anoF;
}

function getSupply(data) {
    var suppliesFiltrados = supplies.filter(e => {
        return (converterData(e.date) <= data);
    });

    return suppliesFiltrados.sort(function (a, b) {
        if (converterData(a.date) > converterData(b.date)) {
            return 1;
        }
        if (converterData(a.date) < converterData(b.date)) {
            return -1;
        }
        return 0;
    })[suppliesFiltrados.length - 1];
}

function getLitros(data) {
    var supply = getSupply(data);
    var price = getPrice(data);

    return supply.value / price.value;
}

function getSpent(data) {
    var spentsFiltrados = spents.filter(e => {
        return (converterData(e.date) <= data);
    });

    return spentsFiltrados.sort(function (a, b) {
        if (converterData(a.date) > converterData(b.date)) {
            return 1;
        }
        if (converterData(a.date) < converterData(b.date)) {
            return -1;
        }
        return 0;
    })[spentsFiltrados.length - 1];
}

function getGasto(data) {
    var spentDoDia = getSpent(data);
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
    for (var d = converterData(spentsOrdenado[0].date); d <= converterData(spentsOrdenado[spentsOrdenado.length - 1].date); d.setDate(d.getDate() + 1)) {
        var supplyDoDia = getLitros(d);
        if (supplyDoDia) {
            saldo += supplyDoDia;
        }

        var gastoDoDia = getGasto(d);
        if (gastoDoDia) {
            saldo -= gastoDoDia;
        }

        saldos.push({ date: dataAtualFormatada(d), value: parseFloat(saldo.toFixed(2)) });
    }

    res.json(saldos);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});