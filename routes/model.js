const stat_percent = [2, 4, 6, 9, 10, 11, 12];
const eff_max_table = [0, 0, 40, 0, 40, 0, 40, 0, 30, 30, 35, 40, 40];
const pri_max_table = {
    six: [0, 2448, 63, 160, 63, 160, 63, 0, 42, 58, 80, 64, 64],
    five: [0, 2088, 51, 135, 51, 135, 51, 0, 39, 47, 64, 51, 51]
};
const set_id_table = ['X', '활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', 'X', '절망', '흡혈', 'X', '폭주', '응보', '의지', '보호', '반격', '파괴', '투지', '결의', '고양', '명중', '근성'];
const eff_table = ['X', '깡체', '체력', '깡공', '공격력', '깡방', '방어력', 'X', '공속', '치확', '치피', '효저', '효적'];


exports.parseRunes = function(Data, filter) {
    let retData = [];
    Data.forEach(function(rune) {
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
            let input;
            input = eff_table[eff[0]] + ' + ' + eff[1];
            if (stat_percent.includes(eff[0])) input += '%';
            runeData.sec_eff.push(input);
        });
        runeData.upgrade_curr = '+' + rune.upgrade_curr;
        runeData.value = Math.round(rune.value * 100 * 100) / 100;
        runeData.max_value = Math.round(rune.max_value * 100 * 100) / 100;
        runeData.expected_value = Math.round(rune.expected_value * 100 * 100) / 100;
        runeData.grade = runeData.sec_eff.length;
        retData.push(runeData);
    });
    retData.sort(function(a, b) {
        if (filter.sort === 1) {
            return parseFloat(b.value) - parseFloat(a.value);
        } else if (filter.sort === 2) {
            return parseFloat(b.max_value) - parseFloat(a.max_value);
        } else if (filter.sort === 3) {
            return parseFloat(b.expected_value) - parseFloat(a.expected_value);
        }
    });
    return retData;
};

exports.evaluateRunes = function(Data, focus) {
    Data.forEach(function(rune) {
        rune.value = runeValue(rune, focus);
        rune.max_value = runeMaxValue(rune, focus);
        rune.expected_value = runeExpectedValue(rune, focus);
    });
    return Data;
};

function runeValue(Data, stat_focus) {
    let value = 0;
    let divisor = 0;
    if ((!stat_focus.includes(eff_table[Data.pri_eff[0]]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[Data.prefix_eff[0]])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[0]])) {
            value += eff[1] / eff_max_table[eff[0]];
        }
    });
    if (Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    if (stat_focus.length <= 1) {
        divisor = 1;
    } else {
        divisor = 1 + Math.min(4, stat_focus.length) * 0.2;
    }
    value /= divisor;
    return value;
}

function runeMaxValue(Data, stat_focus) {
    let value = 0;
    let prob = stat_focus.length;
    let flag = false;
    let divisor = 0;
    let multiplier = 0.2;
    if ((!stat_focus.includes(eff_table[Data.pri_eff[0]]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[Data.prefix_eff[0]])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
        prob--;
    }
    if (Data.class === 5) {
        multiplier *= 0.85;
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[0]])) {
            value += eff[1] / eff_max_table[eff[0]];
            prob--;
            flag = true;
        }
    });
    if (Data.slot_no === 1) {
        if (stat_focus.includes(7)) {
            prob--;
        }
    } else if (Data.slot_no === 3) {
        if (stat_focus.includes(5)) {
            prob--;
        }
    } else if (Data.slot_no !== 5) {
        if (stat_focus.includes(eff_table[Data.pri_eff[0]])) {
            prob--;
        }
    }
    if (flag && (Math.floor(Math.min(Data.upgrade_curr, 12) / 3) < Data.sec_eff.length)) {
        value += (Data.sec_eff.length - Math.floor(Math.min(Data.upgrade_curr, 12) / 3)) * multiplier;
    }
    value += Math.min(4 - Data.sec_eff.length, prob) * multiplier;
    if (Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    if (stat_focus.length <= 1) {
        divisor = 1;
    } else {
        divisor = 1 + Math.min(4, stat_focus.length) * 0.2;
    }
    value /= divisor;
    return value;
}

function runeExpectedValue(Data, stat_focus) {
    let value = 0;
    let prob = stat_focus.length;
    let total = 11;
    let upgrade = Math.floor(Math.min(Data.upgrade_curr, 12) / 3);
    let trap = 0;
    let effective = 0;
    let divisor = 0;
    let multiplier = 0.16;
    if ((!stat_focus.includes(eff_table[Data.pri_eff[0]]) && Data.slot_no % 2 === 0) || Data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[Data.prefix_eff[0]])) {
        value += Data.prefix_eff[1] / eff_max_table[Data.prefix_eff[0]];
        prob--;
        total--;
    } else if (Data.prefix_eff[0]) {
        total--;
    }
    Data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[0]])) {
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
        if (stat_focus.includes(eff_table[Data.pri_eff[0]])) {
            prob--;
            total--;
        }
    }
    if (upgrade < effective + trap) {
        value += effective / (effective + trap) * multiplier * (effective + trap - upgrade);
    }
    value += (4 - effective - trap) * multiplier * prob / total;
    if (Data.class === 5 && Data.slot_no % 2 === 0) {
        value -= (pri_max_table.six[Data.pri_eff[0]] - pri_max_table.five[Data.pri_eff[0]]) / eff_max_table[Data.pri_eff[0]];
    }
    if (stat_focus.length <= 1) {
        divisor = 1;
    } else {
        divisor = 1 + Math.min(4, stat_focus.length) * 0.2;
    }
    value /= divisor;
    return value;
}
