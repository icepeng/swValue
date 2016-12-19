const stat_percent = [2, 4, 6, 9, 10, 11, 12];
const eff_max_table = [0, 1875, 40, 100, 40, 100, 40, 0, 30, 30, 35, 40, 40];
const pri_max_table = [
    [],[],[],[],[],
    [0, 2088, 51, 135, 51, 135, 51, 0, 39, 47, 65, 51, 51],
    [0, 2448, 63, 160, 63, 160, 63, 0, 42, 58, 80, 64, 64]
];
const eff_upgrade_table = [
    [],[],[],[],[],
    [0, [90, 300], [4, 7], [8, 15], [4, 7], [8, 15], [3, 6], 0, [3, 5], [3, 5], [3, 5], [3, 7], [3, 7]],
    [0, [135, 375],[5, 8], [10, 20], [5, 8], [10, 20], [4, 8], 0, [4, 6], [4, 6], [4, 7], [4, 8], [4, 8]]
];
const set_id_table = ['X', '활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', 'X', '절망', '흡혈', 'X', '폭주', '응보', '의지', '보호', '반격', '파괴', '투지', '결의', '고양', '명중', '근성'];
const eff_table = ['X', '깡체', '체력', '깡공', '공격력', '깡방', '방어력', 'X', '공속', '치확', '치피', '효저', '효적'];


exports.parseRunes = function(data, filter) {
    let retData = [];
    data.forEach(function(rune) {
        let runeData = {
            set_id: 0,
            class: 0,
            slot_no: 0,
            pri_eff: '',
            prefix_eff: '',
            sec_eff: [],
            upgrade_curr: 0,
            value: 0
        };

        if (!filter.set.includes(set_id_table[rune.set_id])) return;
        if (!filter.slot.includes(rune.slot_no.toString())) return;
        if (!filter.pri.includes(eff_table[rune.pri_eff[0]]) && rune.slot_no % 2 !== 1) return;

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
            let str = '';
            str += eff[2] ? eff_table[eff[2]] + '*' : eff_table[eff[0]]; //옵션, 변환
            str += ' + ';
            str += eff[1]; //수치
            if (eff[3]) str += `(+${eff[3]})`;
            if (stat_percent.includes(eff[2] ? eff[2] : eff[0])) str += '%';
            runeData.sec_eff.push(str);
        });
        runeData.upgrade_curr = '+' + rune.upgrade_curr;
        runeData.value = Math.round(rune.value * 100 * 100) / 100 + '%';
        runeData.max_value = Math.round(rune.max_value * 100 * 100) / 100 + '%';
        runeData.expected_value = Math.round(rune.expected_value * 100 * 100) / 100 + '%';
        runeData.grade = runeData.sec_eff.length;
        if (typeof rune.occupied_name !== 'undefined') {
            runeData.occupied_name = rune.occupied_name;
        } else {
            runeData.occupied_name = '미장착';
        }
        retData.push(runeData);
    });
    retData.sort(function(a, b) {
        return parseFloat(b.max_value) - parseFloat(a.max_value);
    });
    return retData;
};

exports.evaluateRunes = function(data, focus) {
    data.forEach(function(rune) {
        rune.value = runeValue(rune, focus);
        rune.max_value = runeMaxValue(rune, focus);
        rune.expected_value = runeExpectedValue(rune, focus);
    });
    return data;
};

function runeValue(data, stat_focus) {
    let value = 0;
    let divisor = 0;
    let flag = false;
    let len = stat_focus.length;
    if (data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[data.prefix_eff[0]])) {
        value += data.prefix_eff[1] / eff_max_table[data.prefix_eff[0]];
    }
    data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[4]])) {
            value += eff[5] / eff_max_table[eff[4]];
        }
    });
    if (data.class === 5 && data.slot_no % 2 === 0) {
        value -= (pri_max_table[6][data.pri_eff[0]] - pri_max_table[5][data.pri_eff[0]]) / eff_max_table[data.pri_eff[0]];
    }
    flag = false;
    if (data.slot_no === 2) {
        for (let i of stat_focus) {
            if (['치확', '치피', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 4) {
        for (let i of stat_focus) {
            if (['공속', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 6) {
        for (let i of stat_focus) {
            if (['치확', '치피', '공속'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    }
    if (flag && !stat_focus.includes(eff_table[data.pri_eff[0]])) {
        value -= pri_max_table[data.class][data.pri_eff[0]] / eff_max_table[data.pri_eff[0]];
    }
    divisor = 0.8 + Math.min(5, len) * 0.2;
    value /= divisor;
    return value;
}

function runeMaxValue(data, stat_focus) {
    let value = 0;
    let len = stat_focus.length;
    let prob = len;
    let flag = false;
    let divisor = 0;
    let multiplier = 0.2;
    if (data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[data.prefix_eff[0]])) {
        value += data.prefix_eff[1] / eff_max_table[data.prefix_eff[0]];
        prob--;
    }
    if (data.class === 5) {
        multiplier *= 0.85;
    }
    data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[4]])) {
            value += eff[5] / eff_max_table[eff[4]];
            prob--;
            flag = true;
        }
    });
    if (data.slot_no === 1) {
        if (stat_focus.includes(eff_table[6])) {
            prob--;
        }
    } else if (data.slot_no === 3) {
        if (stat_focus.includes(eff_table[4])) {
            prob--;
        }
    } else if (data.slot_no !== 5) {
        if (stat_focus.includes(eff_table[data.pri_eff[0]])) {
            prob--;
        }
    }
    if (flag && (Math.floor(Math.min(data.upgrade_curr, 12) / 3) < data.sec_eff.length)) {
        value += (data.sec_eff.length - Math.floor(Math.min(data.upgrade_curr, 12) / 3)) * multiplier;
    }
    value += Math.min(4 - data.sec_eff.length, prob) * multiplier;
    if (data.class === 5 && data.slot_no % 2 === 0) {
        value -= (pri_max_table[6][data.pri_eff[0]] - pri_max_table[5][data.pri_eff[0]]) / eff_max_table[data.pri_eff[0]];
    }
    flag = false;
    if (data.slot_no === 2) {
        for (let i of stat_focus) {
            if (['치확', '치피', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 4) {
        for (let i of stat_focus) {
            if (['공속', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 6) {
        for (let i of stat_focus) {
            if (['치확', '치피', '공속'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    }
    if (flag && !stat_focus.includes(eff_table[data.pri_eff[0]])) {
        value -= pri_max_table[data.class][data.pri_eff[0]] / eff_max_table[data.pri_eff[0]];
    }
    divisor = 0.8 + Math.min(5, len) * 0.2;
    value /= divisor;
    return value;
}

function runeExpectedValue(data, stat_focus) {
    let value = 0;
    let len = stat_focus.length;
    let prob = len;
    let total = 11;
    let upgrade = Math.floor(Math.min(data.upgrade_curr, 12) / 3);
    let flag = false;
    let trap = 0;
    let effective = 0;
    let divisor = 0;
    let multiplier = 0.16;
    if (data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[data.prefix_eff[0]])) {
        value += data.prefix_eff[1] / eff_max_table[data.prefix_eff[0]];
        prob--;
        total--;
    } else if (data.prefix_eff[0]) {
        total--;
    }
    if (data.class === 5) {
        multiplier *= 0.85;
    }
    data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[4]])) {
            value += eff[5] / eff_max_table[eff[4]];
            effective++;
            prob--;
            total--;
        } else {
            trap++;
            total--;
        }
    });
    if (data.slot_no === 1) {
        if (stat_focus.includes(eff_table[6])) {
            prob--;
        }
        total -= 2;
    } else if (data.slot_no === 3) {
        if (stat_focus.includes(eff_table[4])) {
            prob--;
        }
        total -= 2;
    } else if (data.slot_no !== 5) {
        if (stat_focus.includes(eff_table[data.pri_eff[0]])) {
            prob--;
            total--;
        }
    }
    if (upgrade < effective + trap) {
        value += effective / (effective + trap) * multiplier * (effective + trap - upgrade);
    }
    value += (4 - effective - trap) * multiplier * prob / total;
    if (data.class === 5 && data.slot_no % 2 === 0) {
        value -= (pri_max_table[6][data.pri_eff[0]] - pri_max_table[5][data.pri_eff[0]]) / eff_max_table[data.pri_eff[0]];
    }
    flag = false;
    if (data.slot_no === 2) {
        for (let i of stat_focus) {
            if (['치확', '치피', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 4) {
        for (let i of stat_focus) {
            if (['공속', '효적', '효저'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    } else if (data.slot_no === 6) {
        for (let i of stat_focus) {
            if (['치확', '치피', '공속'].includes(i) === false) {
                flag = true;
                break;
            }
        }
    }
    if (flag && !stat_focus.includes(eff_table[data.pri_eff[0]])) {
        value -= pri_max_table[data.class][data.pri_eff[0]] / eff_max_table[data.pri_eff[0]];
    }
    divisor = 0.8 + Math.min(5, len) * 0.2;
    value /= divisor;
    return value;
}
