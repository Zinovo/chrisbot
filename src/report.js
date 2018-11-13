const axios = require('axios');
const debug = require('debug')('slash-command-template:report');
const qs = require('querystring');
const users = require('./users');


let userIdForPost = '';
/*
 *  Send standup creation confirmation via
 *  chat.postMessage to the user who created it
 */
const sendConfirmation = (report) => {
  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: 'CDUSHK5NH',
    as_user: true,
    text: 'Standup submitted!',
    attachments: JSON.stringify([
      {
        title: `Standup submitted for ${report.userName}`,
        text: report.text,
        fields: [
          {
            title: 'What you did yesterday',
            value: report.yesterday,
          },
          {
            title: 'What you did today',
            value: report.today || 'None provided',
          },
          {
            title: 'Blockers',
            value: report.blockers
          },
        ],
      },
    ]),
  })).then((result) => {
    axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
      token: process.env.SLACK_ACCESS_TOKEN,
      channel: userIdForPost,
      as_user: true,
      text: 'Thanks for submitting!'
    })).then((res) => {
      console.log('posted personal message')
      debug('sendConfirmation: %o', result.data);
    })
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
  });
};

const create = (userId, submission) => {
  const report = {};
  const fetchUserName = new Promise((resolve, reject) => {
    users.find(userId).then((result) => {
      debug(`Find user: ${userId}`);
      resolve(result.data.user.profile.real_name);
    }).catch((err) => { reject(err); });
  });
  userIdForPost = userId;
  fetchUserName.then((result) => {
    report.userId = userId;
    report.userName = result;
    report.today = submission.today;
    report.yesterday = submission.yesterday;
    report.blockers = submission.blockers;
    sendConfirmation(report);
  
    return report;
  }).catch((err) => { console.error(err); });
};

module.exports = { create, sendConfirmation };
