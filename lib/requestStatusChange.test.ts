import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkStatusReason, reasonCheckErrorKey, reasonLength, statusErrorKey, STATUS_REASON_MAX,
} from './requestStatusChange.ts';

test('reason must be 5..1000 characters after trimming', () => {
  assert.equal(checkStatusReason(''), 'required');
  assert.equal(checkStatusReason(null), 'required');
  assert.equal(checkStatusReason('   abcd   '), 'required');
  assert.equal(checkStatusReason('abcde'), 'ok');
  assert.equal(checkStatusReason('ğüşıö'), 'ok');
  assert.equal(checkStatusReason('a'.repeat(STATUS_REASON_MAX)), 'ok');
  assert.equal(checkStatusReason('a'.repeat(STATUS_REASON_MAX + 1)), 'too_long');
});

test('reason length counts code points like char_length', () => {
  assert.equal(reasonLength('😀😀😀😀😀'), 5);
  assert.equal(checkStatusReason('😀😀😀😀😀'), 'ok');
});

test('every RPC error maps to its own message, others to the generic one', () => {
  assert.equal(statusErrorKey({ message: 'demand_status_use_rpc' }), 'statusErrUseRpc');
  assert.equal(statusErrorKey({ message: 'staff_role_not_allowed' }), 'statusErrRole');
  assert.equal(statusErrorKey({ message: 'status_reason_required' }), 'statusErrReasonRequired');
  assert.equal(statusErrorKey({ message: 'status_reason_too_long' }), 'statusErrReasonTooLong');
  assert.equal(statusErrorKey({ message: 'demand_status_transition' }), 'statusErrTransition');
  assert.equal(statusErrorKey({ message: 'invalid_status' }), 'statusErrInvalid');
  assert.equal(statusErrorKey('request_not_found'), 'statusErrNotFound');
  assert.equal(statusErrorKey({ message: 'network down' }), 'statusErrGeneric');
  assert.equal(statusErrorKey(null), 'statusErrGeneric');
});

test('reason check maps to the same messages', () => {
  assert.equal(reasonCheckErrorKey('required'), 'statusErrReasonRequired');
  assert.equal(reasonCheckErrorKey('too_long'), 'statusErrReasonTooLong');
  assert.equal(reasonCheckErrorKey('ok'), null);
});
