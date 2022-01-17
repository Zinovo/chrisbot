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
        title: `${report.userName}`,
        text: report.text,
        fields: [
          {
            title: `What ${report.userName} crushed yesterday`,
            value: report.yesterday,
          },
          {
            title: `How ${report.userName} will use their superpowers today`,
            value: report.today || 'None provided',
          },
          {
            title: `Things standing in ${report.userName}'s way`,
            value: report.blockers
          },
        ],
      },
    ]),
  })).then((result) => {
    if(result.data){
      console.log(result.data);
      let { ok } = result.data; 
      if(ok === false){
        throw new Error(`Failed with error: ${result.data}`); 
      }
    }
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
    axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
      token: process.env.SLACK_ACCESS_TOKEN,
      channel: userIdForPost,
      as_user: true,
      text: `Uh oh! There was an error with your submission: ${err.message}`
    })).then((res) => {
      console.log('posted error message');
    }).catch((err) => {
      console.log(`Error posting to Slack: ${err.message}`);
    })
  })
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
