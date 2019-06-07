/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

const expect = require('chai').expect;
const ObjectId = require('mongodb').ObjectID;

module.exports = function(app, db) {
  const issues = db.collection('issues'); //issues.deleteMany().then(res=>console.log(res.message.raw.toString(),res.message.data.toString()),console.log);
  app
    .route('/api/issues/:project')

    .get(function(req, res) {
      const project = req.params.project;
      const query = { project };
      const allowedKeys = [
        'issue_title',
        'issue_text',
        'created_by',
        'assigned_to',
        'status_text',
        'created_on',
        'updated_on',
      ];
      if ('_id' in req.query) {
        try {
          query._id = ObjectId(req.query._id);
        } catch (e) {
          return res.json('error');
        }
      }
      if (req.query.open === 'true') {
        query.open = true;
      } else if (req.query.open === 'false') {
        query.open = false;
      }

      for (let key in req.query) {
        if (allowedKeys.indexOf(key) !== -1) {
          query[key] = req.query[key];
        }
      }
      issues
        .find(query)
        .project({
          project: 0,
        })
        .toArray()
        .then(
          docs => {
            res.json(docs);
          },
          err => res.json('error')
        );
    })

    .post(function(req, res) {
      const project = req.params.project;
      let {
        issue_title,
        issue_text,
        created_by,
        assigned_to = '',
        status_text = '',
      } = req.body;
      if (!issue_title || !issue_text || !created_by) {
        return res
          .status(200)
          .type('text')
          .send('missing inputs');
      }
      const issue = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open: true,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
      };
      issues
        .insertOne({
          project: project,
          ...issue,
        })
        .then(result => res.json(result.ops[0]), err => res.json('error'));
    })

    .put(function(req, res) {
      const allowedKeys = [
        'issue_title',
        'issue_text',
        'created_by',
        'assigned_to',
        'status_text',
      ];
      const query = {};
      if (req.body.open === 'false' || req.body.open === false) {
        query.open = false;
      }
      for (let key in req.body) {
        if (allowedKeys.indexOf(key) !== -1) {
          query[key] = req.body[key];
        }
      }
      let _id = req.body._id;
      const isEmpty = !Object.keys(query).length;
      if (isEmpty) {
        return res
          .status(200)
          .type('text')
          .send('no updated field sent');
      }
      if (typeof _id !== 'string') {
        return res
          .status(200)
          .type('text')
          .send('could not update ' + _id);
      }
      try {
        _id = ObjectId(_id);
      } catch (e) {
        return res
          .status(200)
          .type('text')
          .send('could not update ' + _id);
      }
      query.updated_on = new Date().toISOString();
      issues
        .findOneAndUpdate(
          {
            _id,
          },
          {
            $set: query,
          }
        )
        .then(
          doc =>
            doc.value
              ? res
                  .status(200)
                  .type('text')
                  .send('successfully updated')
              : res
                  .status(200)
                  .type('text')
                  .send('could not update ' + _id),
          err =>
            res
              .status(200)
              .type('text')
              .send('could not update ' + _id)
        );
    })

    .delete(function(req, res) {
      let _id = req.body._id;
      if (typeof _id !== 'string') {
        return res
          .status(200)
          .type('text')
          .send('_id error');
      }
      try {
        _id = ObjectId(_id);
      } catch (e) {
        return res
          .status(200)
          .type('text')
          .send('_id error');
      }
      issues
        .findOneAndDelete({
          _id,
        })
        .then(
          doc =>
            doc.value
              ? res
                  .status(200)
                  .type('text')
                  .send('deleted ' + _id)
              : res
                  .status(200)
                  .type('text')
                  .send('could not delete ' + _id),
          err =>
            res
              .status(200)
              .type('text')
              .send('could not delete ' + _id)
        );
    });
};
