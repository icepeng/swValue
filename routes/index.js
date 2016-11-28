var express = require('express');
var multipart = require('connect-multiparty');
var fs = require('fs');
var multipartMiddleWare = multipart();
var router = express.Router();
const stat_percent = [2, 4, 6, 9, 10, 12];

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', {
        title: 'rune'
    });
});

router.post('/', multipartMiddleWare, function(req, res) {
    fs.readFile(req.files.swarData.path, 'utf8', function(err, data) {
        var sData;
        sData = JSON.parse(data).runes;
        sData = evaluateRunes(sData);
        fs.unlink(req.files.swarData.path, function(err) {
            if (err) console.log(err);
        });
        res.render('index', {
            title: 'Express',
            Data: parseRunes(sData)
        });
    });
});

function parseRunes(Data) {
    var retData = [];
    var set_id_table = ['', '활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', 'X', '절멍', '흡혈', 'X', '폭주', '응보', '의지', '보호', '반격', '파괴', 'Fight', 'Determination', 'Enhance', 'Accuracy', 'Tolerance'];
    var eff_table = ['', '깡체', '체력', '깡공', '공격력', '깡방', '방어력', 'X', '공속', '치확', '치피', '효저', '효적'];
    Data.forEach(function(rune) {
        var runeData = {
            set_id: 0,
            class: 0,
            slot_no: 0,
            pri_eff: '',
            prefix_eff: '',
            sec_eff: [],
            upgrade_curr: 0,
            value: 0
        };
        runeData.set_id = set_id_table[rune.set_id];
        runeData.class = rune.class;
        runeData.slot_no = rune.slot_no;
        runeData.pri_eff = eff_table[rune.pri_eff[0]] + ' + ' + rune.pri_eff[1];
        if(stat_percent.includes(rune.pri_eff[0])) runeData.pri_eff += '%';
        if (rune.prefix_eff[0]) {
            runeData.prefix_eff = eff_table[rune.prefix_eff[0]] + ' + ' + rune.prefix_eff[1];
            if(stat_percent.includes(rune.prefix_eff[0])) runeData.prefix_eff += '%';
        }
        rune.sec_eff.forEach(function(eff) {
            var sec_eff = eff_table[eff[0]] + ' + ' + eff[1];
            if(stat_percent.includes(eff[0])) sec_eff += '%';
            runeData.sec_eff.push(sec_eff);
        });
        runeData.upgrade_curr = '+' + rune.upgrade_curr;
        runeData.value = Math.floor(rune.value * 100 * 100) / 100;
        runeData.max_value = Math.floor(rune.max_value * 100 * 100) / 100;
        retData.push(runeData);
    });
    retData.sort(function(a, b) {
        return parseFloat(b.max_value) - parseFloat(a.max_value);
    });
    return retData;
}

function runeValue(Data) {
    var value = 0;
    var eff_max_table = [0, 0, 40, 0, 40, 0, 40, 0, 30, 30, 35, 40, 40];
    var stat_focus = [2, 4, 6, 8, 9, 10, 12];
    if (stat_focus.includes(Data.prefix_eff[0])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff[0])) {
            value += eff[1] / eff_max_table[eff[0]];
        }
    });
    value /= 1.8;
    return value;
}

function runeMaxValue(Data) {
    var value = 0;
    var flag = 0;
    var eff_max_table = [0, 0, 40, 0, 40, 0, 40, 0, 30, 30, 35, 40, 40];
    var stat_focus = [2, 4, 6, 8, 9, 10, 12];
    if (stat_focus.includes(Data.prefix_eff[0])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff[0])) {
            value += eff[1] / eff_max_table[eff[0]];
            flag = 1;
        }
    });
    if (flag || Data.sec_eff.length <= Math.floor(Math.min(Data.upgrade_curr, 12) / 3)) {
        value += Math.floor((12 - Math.min(Data.upgrade_curr, 12)) / 3) * 0.2;
    } else {
        value += (4 + Math.floor(Math.min(Data.upgrade_curr, 12) / 3) - Data.sec_eff.length) * 0.2;
    }
    value /= 1.8;
    return value;
}

function runeProbilaty(Data) {
    var value = 0;
    var flag = 0;
    var eff_max_table = [0, 0, 40, 0, 40, 0, 40, 0, 30, 30, 35, 40, 40];
    var stat_focus = [2, 4, 6, 8, 9, 10, 12];
    if (stat_focus.includes(Data.prefix_eff[0])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff[0])) {
            value += eff[1] / eff_max_table[eff[0]];
            flag = 1;
        }
    });
    if (flag || Data.sec_eff.length <= Math.floor(Math.min(Data.upgrade_curr, 12) / 3)) {
        value += Math.floor((12 - Math.min(Data.upgrade_curr, 12)) / 3) * 0.2;
    } else {
        value += (4 + Math.floor(Math.min(Data.upgrade_curr, 12) / 3) - Data.sec_eff.length) * 0.2;
    }
    value /= 1.8;
    return value;
}


function evaluateRunes(Data) {
    Data.forEach(function(rune) {
        rune.value = runeValue(rune);
        rune.max_value = runeMaxValue(rune);
    });
    return Data;
}

module.exports = router;

/*{"occupied_type": 1,
"sell_value": 12920,
"slot_no": 1,
"rank": 0,
"sec_eff": [[12, 6, 0, 0], [11, 3, 0, 0], [2, 7, 0, 0]],
"upgrade_curr": 0,
"rune_id": 3610492681,
"pri_eff": [3, 15],
"class": 5,
"prefix_eff": [0, 0],
"occupied_id": 0,
"upgrade_limit": 15,
"set_id": 16}*/
