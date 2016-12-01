'use strict';

const express = require('express');
const multipart = require('connect-multiparty');
const fs = require('fs');
const multipartMiddleWare = multipart();
const router = express.Router();
const runeModel = require('./model');

const default_filter_eff = ['체력', '공격력', '방어력', '공속', '치확', '치피', '효적'];
const default_filter_set = ['활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', '절망', '흡혈', '폭주', '응보', '의지', '보호', '반격', '파괴', '투지', '결의', '고양', '명중', '근성'];
const default_filter_slot = ['1', '2', '3', '4', '5', '6'];

const filter_list_eff = ['체력', '공격력', '방어력', '공속', '치확', '치피', '효적', '효저'];
const filter_list_set = ['활력', '수호', '신속', '칼날', '격노', '집중', '인내', '맹공', '절망', '흡혈', '폭주', '응보', '의지', '보호', '반격', '파괴', '투지', '결의', '고양', '명중', '근성'];
const filter_list_slot = ['1', '2', '3', '4', '5', '6'];

/* GET home page. */
router.get('/', function(req, res) {
    let sData = {
        runes: [],
        filter: {
            eff: [],
            set: [],
            slot: []
        },
        filter_list: {}
    };
    let arr = [];
    let filter = {
        eff: [],
        set: [],
        slot: []
    };

    try {
        arr = [];
        if (typeof req.query.filter_eff === 'undefined') throw 'no filter';
        if (req.query.filter_eff.length === 0) throw 'no element';
        for (let eff in req.query.filter_eff) {
            if (req.query.filter_eff.hasOwnProperty(eff)) {
                arr.push(eff);
            }
        }
    } catch (err) {
        arr = default_filter_eff;
    } finally {
        for (let e of filter_list_eff) {
            if (arr.includes(e)) {
                sData.filter.eff.push({
                    name: e,
                    active: true
                });
                filter.eff.push(e);
            } else {
                sData.filter.eff.push({
                    name: e,
                    active: false
                });
            }
        }
    }

    try {
        arr = [];
        if (typeof req.query.filter_set === 'undefined') throw 'no filter';
        if (req.query.filter_set.length === 0) throw 'no element';
        for (let set in req.query.filter_set) {
            if (req.query.filter_set.hasOwnProperty(set)) {
                arr.push(set);
            }
        }
    } catch (err) {
        arr = default_filter_set;
    } finally {
        for (let e of filter_list_set) {
            if (arr.includes(e)) {
                sData.filter.set.push({
                    name: e,
                    active: true
                });
                filter.set.push(e);
            } else {
                sData.filter.set.push({
                    name: e,
                    active: false
                });
            }
        }
    }

    try {
        arr = [];
        if (typeof req.query.filter_slot === 'undefined') throw 'no filter';
        if (req.query.filter_slot.length === 0) throw 'no element';
        for (var slot in req.query.filter_slot) {
            if (req.query.filter_slot.hasOwnProperty(slot)) {
                arr.push(slot.replace('s', ''));
            }
        }
    } catch (err) {
        arr = default_filter_slot;
    } finally {
        for (let e of filter_list_slot) {
            if (arr.includes(e)) {
                sData.filter.slot.push({
                    name: e,
                    active: true
                });
                filter.slot.push(e);
            } else {
                sData.filter.slot.push({
                    name: e,
                    active: false
                });
            }
        }
    }

    if (typeof req.query.filter_sort !== 'undefined') {
        sData.filter.sort = parseInt(req.query.filter_sort);
    } else {
        sData.filter.sort = 3;
    }
    filter.sort = sData.filter.sort;

    if (typeof req.session.data !== 'undefined' && req.session.data.length) {
        sData.runes = runeModel.parseRunes(runeModel.evaluateRunes(req.session.data, filter.eff), filter);
    }
    if (req.session.successMessage) {
        sData.successMessage = req.session.successMessage;
        req.session.successMessage = null;
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
        try {
            let dataObj = JSON.parse(data);
            req.session.data = dataObj.runes;
            if (dataObj.unit_list) {
                dataObj.unit_list.forEach(function(unit) {
                    for (let i in unit.runes) {
                        req.session.data.push(unit.runes[i]);
                    }
                });
            }
            req.session.successMessage = `Runes imported - ${req.session.data.length} runes`;
            return res.redirect('/');
        } catch (err) {
            return res.render('file_upload', {
                errorMessage: '파일이 올바르지 않습니다.'
            });
        }
    });
});

module.exports = router;
