'use strict';

var express = require('express');
var multipart = require('connect-multiparty');
var fs = require('fs');
var multipartMiddleWare = multipart();
var router = express.Router();

const stat_percent = [2, 4, 6, 9, 10, 11, 12];
const eff_max_table = [0, 0, 40, 0, 40, 0, 40, 0, 30, 30, 35, 40, 40];
const pri_max_table = {
    six:    [0, 2448, 63, 160, 63, 160, 63, 0, 42, 58, 80, 64, 64],
    five:   [0, 2088, 51, 135, 51, 135, 51, 0, 39, 47, 64, 51, 51]
};
const set_id_table = ['', '활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', 'X', '절망', '흡혈', 'X', '폭주', '응보', '의지', '보호', '반격', '파괴', 'Fight', 'Determination', 'Enhance', 'Accuracy', 'Tolerance'];
const eff_table = ['', '깡체', '체력', '깡공', '공격력', '깡방', '방어력', 'X', '공속', '치확', '치피', '효저', '효적'];

/* GET home page. */
router.get('/', function(req, res) {
    var sData = {};
    if(typeof req.session.data !== 'undefined' && req.session.data.length) {
        sData = parseRunes(evaluateRunes(JSON.parse(req.session.data).runes));
    }
    res.render('index', {
        title: 'rune',
        data: sData
    });
});

router.get('/file_upload', function(req, res) {
    res.render('file_upload');
});

router.post('/file_upload', multipartMiddleWare, function(req, res) {
    fs.readFile(req.files.swarData.path, 'utf8', function(err, data) {
        fs.unlink(req.files.swarData.path, function(err) {
            if (err) throw err;
        });
        req.session.data = data;
        return res.redirect('/');
    });
});

function parseRunes(Data) {
    var retData = [];
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
        if (stat_percent.includes(rune.pri_eff[0])) runeData.pri_eff += '%';
        if (rune.prefix_eff[0]) {
            runeData.prefix_eff = eff_table[rune.prefix_eff[0]] + ' + ' + rune.prefix_eff[1];
            if (stat_percent.includes(rune.prefix_eff[0])) runeData.prefix_eff += '%';
        }
        rune.sec_eff.forEach(function(eff) {
            var input;
            input = eff_table[eff[0]] + ' + ' + eff[1];
            if (stat_percent.includes(eff[0])) input += '%';
            runeData.sec_eff.push(input);
        });
        runeData.upgrade_curr = '+' + rune.upgrade_curr;
        runeData.value = Math.round(rune.value * 100 * 100) / 100;
        runeData.max_value = Math.round(rune.max_value * 100 * 100) / 100;
        runeData.expected_value = Math.round(rune.expected_value * 100 * 100) / 100;
        retData.push(runeData);
    });
    retData.sort(function(a, b) {
        return parseFloat(b.expected_value) - parseFloat(a.expected_value);
    });
    return retData;
}

function runeValue(Data, stat_focus) {
    var value = 0;
    if ((!stat_focus.includes(Data.pri_eff[0]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(Data.prefix_eff[0])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff[0])) {
            value += eff[1] / eff_max_table[eff[0]];
        }
    });
    if(Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    value /= 1.8;
    return value;
}

function runeMaxValue(Data, stat_focus) {
    var value = 0;
    var flag = 0;
    if ((!stat_focus.includes(Data.pri_eff[0]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
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
    if(Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    value /= 1.8;
    return value;
}

function runeExpectedValue(Data, stat_focus) {
    var value = 0;
    var prob = stat_focus.length;
    var total = 11;
    var upgrade = Math.floor(Math.min(Data.upgrade_curr, 12) / 3);
    var trap = 0;
    var effective = 0;
    if ((!stat_focus.includes(Data.pri_eff[0]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(Data.prefix_eff[0])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
        prob--;
        total--;
    } else if (Data.prefix_eff[0]) {
        total--;
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff[0])) {
            value += eff[1] / eff_max_table[eff[0]];
            effective++;
            prob--;
            total--;
        } else {
            trap++;
            total--;
        }
    });
    if (Data.slot_no === 1) {
        if (stat_focus.includes(7)) {
            prob--;
            total--;
        }
    } else if (Data.slot_no === 3) {
        if (stat_focus.includes(5)) {
            prob--;
            total--;
        }
    } else if (Data.slot_no !== 5) {
        if (stat_focus.includes(Data.pri_eff[0])) {
            prob--;
            total--;
        }
    }
    if (upgrade < effective + trap) {
        value += effective / (effective + trap) * 0.16 * (effective + trap - upgrade);
    }
    value += (4 - effective - trap) * 0.16 * prob / total;
    if(Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    value /= 1.8;
    return value;
}


function evaluateRunes(Data, focus = [2, 4, 6, 8, 9, 10, 12]) {
    Data.forEach(function(rune) {
        rune.value = runeValue(rune, focus);
        rune.max_value = runeMaxValue(rune, focus);
        rune.expected_value = runeExpectedValue(rune, focus);
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
