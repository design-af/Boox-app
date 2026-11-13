// Checks the AFS Dictation recording logic (public/tools/dictation/kbcore.js).
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const K = require('../public/tools/dictation/kbcore.js');

const rec = K.newRecording(Date.UTC(2026, 10, 12, 19, 30));
K.addPhrase(rec, { text: 'welcome everyone to the session' });
K.addPhrase(rec, { text: 'today we look at rabbit families', alts: ['today we look at revit families', 'today we look at rabbit family'] });
K.addPhrase(rec, { text: 'Is that clear?' });
K.addPhrase(rec, { text: 'ok' }, { end: ',' });
K.addPhrase(rec, { text: 'next topic' }, { br: true });

// Period + space at every pause, sentence capitals, paragraph break, chosen punctuation.
assert.equal(
  K.plain(rec),
  'Welcome everyone to the session. Today we look at rabbit families. Is that clear? Ok,\nNext topic.'
);
assert.equal(K.plain(rec, { autoPeriod: false, cap: false }), 'welcome everyone to the session today we look at rabbit families Is that clear? ok,\nnext topic');
assert.equal(K.wordCount(rec), 17);

// Recogniser alternatives become flags.
assert.equal(K.localCheck(rec), 2);
const f = rec.flags.find((x) => x.sugg.includes('revit'));
assert.ok(f, 'rabbit -> revit flag');
K.applyFlag(rec, f, 'Revit');
assert.match(K.plain(rec), /look at Revit families\./);
assert.equal(rec.flags.length, 1, 'separate flag (families) survives, shifted');
assert.deepEqual(rec.flags[0].sugg, ['family']);

// Claude audit mapping by line number + quote.
const audit = { content: [{ type: 'tool_use', input: { flags: [
  { line: 1, quote: 'the session', suggestion: 'this session', reason: 'context' },
  { line: 99, quote: 'next topic', suggestion: 'text topic' },
  { line: 1, quote: 'not there', suggestion: 'x' },
] } }] };
assert.equal(K.applyAudit(rec, audit), 2);
K.keepFlag(rec, rec.flags[0]);
assert.equal(K.applyAudit(rec, audit), 0, 'kept words are not flagged again');

// Edits.
K.deleteLastWord(rec);
assert.match(K.plain(rec), /Ok,\nNext\.$|Ok,\nnext\.$/);
K.setEditedText(rec, 'Line one.\nLine two');
assert.equal(K.plain(rec), 'Line one.\nLine two');

// Summary parsing.
const r2 = K.newRecording();
K.applySummary(r2, { content: [{ type: 'text', text: 'Title: BIM at scale\n- **One** point\n* Two' }] });
assert.equal(r2.title, 'BIM at scale');
assert.equal(r2.summary, '- One point\n- Two');
assert.ok(K.keyPointsText(r2).startsWith('Key points — BIM at scale\n- One'));

// Requests are well-formed.
const req = K.auditRequest(rec, {}, 'AEC conference');
assert.equal(req.tool_choice.name, 'report_misheard');
assert.match(req.messages[0].content, /AEC conference/);
assert.ok(K.summaryRequest(rec, {}, '').messages[0].content.includes('Title:'));

// Groups.
const data = { groups: [K.newGroup('Day 1'), K.newGroup('Keynote')] };
K.assignToGroup(data, data.groups[0].id, ['a', 'b']);
K.assignToGroup(data, data.groups[1].id, ['b']);
assert.deepEqual(data.groups[0].ids, ['a']);
assert.equal(K.groupOf(data, 'b').name, 'Keynote');
K.removeFromGroups(data, ['a']);
assert.equal(K.groupOf(data, 'a'), null);
const gr = K.groupSummaryRequest('Day 1', [r2, rec], {}, 'AEC');
assert.match(gr.messages[0].content, /Segment 1: .*\n[\s\S]*Segment 2: /);
assert.match(gr.messages[0].content, /Day 1/);
const g = K.newGroup('Day 1');
K.applySummary(g, { content: [{ type: 'text', text: 'Title: Big day\n- one' }] });
assert.equal(g.summary, '- one');
assert.ok(K.groupKeyPointsText(g).startsWith('Key points \u2014 Day 1\n- one'));

console.log('Dictation: recording logic checks out.');
