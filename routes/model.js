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
    [0, [135, 375], [5, 8], [10, 20], [5, 8], [10, 20], [4, 8], 0, [4, 6], [4, 6], [4, 7], [4, 8], [4, 8]]
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
            let input;
            input = eff_table[eff[0]] + ' + ' + eff[1];
            if (stat_percent.includes(eff[0])) input += '%';
            runeData.sec_eff.push(input);
        });
        runeData.upgrade_curr = rune.upgrade_curr;
        runeData.value = Math.round(rune.value * 100 * 100) / 100;
        runeData.max_value = Math.round(rune.max_value * 100 * 100) / 100;
        runeData.expected_value = Math.round(rune.expected_value * 100 * 100) / 100;
        runeData.grade = runeData.sec_eff.length;
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
    if (data.class <= 4) {
        return 0;
    }
    if (stat_focus.includes(eff_table[data.prefix_eff[0]])) {
        value += data.prefix_eff[1] / eff_max_table[data.prefix_eff[0]];
    }
    data.sec_eff.forEach(function(eff) {
        if (stat_focus.includes(eff_table[eff[0]])) {
            value += eff[1] / eff_max_table[eff[0]];
        }
    });
    if (data.class === 5 && data.slot_no % 2 === 0) {
        value -= (pri_max_table[6][data.pri_eff[0]] - pri_max_table[5][data.pri_eff[0]]) / eff_max_table[data.pri_eff[0]];
    }
    divisor = 0.8 + Math.min(5, stat_focus.length) * 0.2;
    value /= divisor;
    return value;
}

function runeMaxValue(data, stat_focus) {
    let value = 0;
    let possible_stat = ['', 1, 1, 1, 1, 1, 1, '', 1, 1, 1, 1, 1];
    let focus_stat = ['', 0, 0, 0, 0, 0, 0, '', 0, 0, 0, 0, 0];
    let upgrades = 0;                           //how many second stat upgrade
    let empty_slot = 4;                         //how many slot of second stat empty
    let sec_max = 0;                            //maximum value of current second stat per upgrade
    let pos_max_eff = 0;
    let divisor = 0;
    //check grade
    if (data.class <= 4) {
        return 0;
    }
    //set focus stat flag
    stat_focus.forEach(function(eff) {
        focus_stat[eff_table.indexOf(eff)]=1;
    });
    //check valid stat by slot
    if (data.slot_no === 1) {
        possible_stat[5]=possible_stat[6]=0;
    } else if (data.slot_no === 3) {
        possible_stat[3]=possible_stat[4]=0;
    } else if (data.slot_no !== 5) {
        possible_stat[data.pri_eff[0]]=0;
    }
    //calculate g5 2,4,6 slot
    if (data.class === 5 && !(data.slot_no%2))
        value -= (pri_max_table[6][data.pri_eff[0]] - pri_max_table[5][data.pri_eff[0]]) / eff_max_table[data.pri_eff[0]];
    //check valid stat by prefix eff
    if (data.prefix_eff[0])
        possible_stat[data.prefix_eff[0]]=0;
    //cacluate value by prefix eff
    if (focus_stat[data.prefix_eff[0]])
        value += data.prefix_eff[1]/eff_max_table[data.prefix_eff[0]];
    //calculate upgrade remain number
    upgrades = Math.floor(Math.min(data.upgrade_curr, 12) / 3);
    //calculate current value,check max value of sec stat, check vaild stat by sec_eff & empty second stat
    data.sec_eff.forEach(function(eff) {
        if (focus_stat[eff[0]]) {
            value += eff[1] / eff_max_table[eff[0]];
            possible_stat[eff[0]]=0;
            sec_max = Math.max(eff_upgrade_table[data.class][eff[0]][1] / eff_max_table[eff[0]], sec_max);
        }
        empty_slot--;
    });
    //calculate maximum value if current second stat upgrade
    if(empty_slot < 4 - upgrades)                       //if empty stat slot is smaller than remain upgrades
        value += sec_max*(4 - empty_slot - upgrades);
    //calculate by possible
    for(let e = 0; e < empty_slot; e++){ 
        let pos_max = 0;
        possible_stat.forEach(function(eff,i) {
            let pVal=0;                                 
            if(eff&&focus_stat[i]){                     //if possible stat & focus
                pVal=eff_upgrade_table[data.class][i][1] / eff_max_table[i];     //pVal is value of possible stat
                if(pos_max < pVal){
                    pos_max = pVal;     //maximum of possible value
                    pos_max_eff = i;  //maximum possible value
                }
            }
        });
        value+=pos_max;
        possible_stat[pos_max_eff]=0;
    }
    //calculate by divisor
    value /= (0.8 + Math.min(5, stat_focus.length) * 0.2);
    return value;
}

function runeExpectedValue(data, stat_focus) {
    let value = 0;
    let prob = stat_focus.length;
    let total = 11;
    let upgrade = Math.floor(Math.min(data.upgrade_curr, 12) / 3);
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
    data.sec_eff.forEach(function(eff) {
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
    if (data.slot_no === 1) {
        if (stat_focus.includes(7)) {
            prob--;
            total--;
        }
    } else if (data.slot_no === 3) {
        if (stat_focus.includes(5)) {
            prob--;
            total--;
        }
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
    divisor = 0.8 + Math.min(5, stat_focus.length) * 0.2;
    value /= divisor;
    return value;
}
