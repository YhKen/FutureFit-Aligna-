import test from 'node:test';import assert from 'node:assert/strict';
import {withAuthPopupDeadline} from '../auth-popup.js';import {authIssue} from '../account-service.js';
test('blocked Google popup returns control rather than leaving the whole form busy',async()=>{await assert.rejects(withAuthPopupDeadline(()=>new Promise(()=>{}),5),e=>e.code==='auth/popup-timeout'&&authIssue(e)==='popup');});
test('popup deadline preserves success and provider error without masking or extending them',async()=>{assert.equal(await withAuthPopupDeadline(async()=>({ok:true}),30).then(v=>v.ok),true);const expected=Object.assign(Error('Provider denied'),{code:'auth/popup-closed-by-user'});await assert.rejects(withAuthPopupDeadline(async()=>{throw expected;},30),e=>e===expected);});
