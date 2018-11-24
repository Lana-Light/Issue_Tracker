/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var ObjectId = require('mongodb').ObjectID;

module.exports = function(app, db) {
    var issues = db.collection('issues');
    app.route('/api/issues/:project')

        .get(function(req, res) {
            var project = req.params.project;
            var query = {};
            var allowedKeys = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text',
                'created_on', 'updated_on', 'open', '_id'];
                for (var key in req.query) {
                    if (allowedKeys.indexOf(key) !== -1) {
                        if (key === '_id') {
                            query._id = ObjectId(req.query[key])
                        } else if (key === 'open') {
                            if (req.query.open === 'true') {
                                req.body.open = true;
                            } else if (req.body.open === 'false') {
                                req.query.open = false;
                            }
                        } else {
                            query[key] = req.query[key];
                        }
                    }
                }
            query.project = project;
            issues.find(query).project({
                project: 0
            }).toArray((err, docs) => {
                if (err) {
                    console.log(err);
                    res.json('error');
                } else if (docs.length === 0) {
                    res.json([]);
                } else {
                    res.json(docs);
                }
            });
        })

        .post(function(req, res) {
            var project = req.params.project;
            if (req.body.issue_title === '' || req.body.issue_title === undefined || req.body.issue_text === '' ||
                req.body.issue_text === undefined || req.body.created_by === '' || req.body.created_by === undefined) {
                res.status(200).type('text').send('missing inputs');
            } else {
                if (req.body.assigned_to === undefined) {
                    req.body.assigned_to = '';
                }
                if (req.body.status_text === undefined) {
                    req.body.status_text = '';
                }
                var issue = { ...req.body,
                    open: true,
                    created_on: (new Date()).toISOString(),
                    updated_on: (new Date()).toISOString()
                };
                issues.insertOne({
                    project: project,
                    ...issue
                }, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.json('error');
                    } else {
                        res.json(result.ops[0]);
                    }
                });
            }
        })

        .put(function(req, res) {
            var values = Object.values(req.body);
            var isEmpty = values.every(function(v) {
                return v === '' || v === undefined;
            });
            var _id = req.body._id;
            if (isEmpty) {
                res.status(200).type('text').send('no updated field sent');
            } else if (_id === '' || _id === undefined) {
                res.status(200).type('text').send('could not update ' + _id);
            } else {
                delete req.body._id;
                if (req.body.open === 'true') {
                    req.body.open = true;
                } else if (req.body.open === 'false') {
                    req.body.open = false;
                }
                req.body.updated_on = (new Date()).toISOString();
                issues.findOneAndUpdate({
                    _id: ObjectId(_id)
                }, {
                    $set: req.body
                }, {
                    returnOriginal: false
                }, (err, doc) => {
                    if (err) {
                        console.log(err);
                        res.status(200).type('text').send('could not update ' + _id);
                    } else if (!doc) {
                        res.status(200).type('text').send('could not update ' + _id);
                    } else {
                        res.status(200).type('text').send('successfully updated');
                    }
                });
            }
        })

        .delete(function(req, res) {
            var _id = req.body._id;
            if (_id === '' || _id === undefined) {
                res.status(200).type('text').send('_id error');
            } else {
                issues.findOneAndDelete({
                    _id: ObjectId(_id)
                }, (err, doc) => {
                    if (err) {
                        console.log(err);
                        res.status(200).type('text').send('could not delete ' + _id);
                    } else if (!doc.value) {
                        res.status(200).type('text').send('could not delete ' + _id);
                    } else {
                        res.status(200).type('text').send('deleted ' + _id);
                    }
                });
            }
        });
};
