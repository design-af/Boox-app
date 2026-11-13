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
assert.equal(req.tools[0].name, 'report_misheard');
assert.equal(req.tool_choice.type, 'auto', 'no forced tool (unsupported by some models)');
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

// Speakers.
const sp = K.newRecording();
K.addPhrase(sp, { text: 'so that is where the industry is heading' });
assert.equal(K.plain(sp), 'So that is where the industry is heading.', 'one speaker: no labels');
assert.equal(K.usesLabels(sp), false);
K.declareSpeaker(sp, 'B');
K.addPhrase(sp, { text: 'thanks my question is about training' }, { spk: 'B' });
assert.equal(K.plain(sp), 'Speaker A: So that is where the industry is heading.\nSpeaker B: Thanks my question is about training.');
assert.equal(K.currentSpeaker(sp), 'B');
K.addPhrase(sp, { text: 'great question we pair everyone with a mentor' }, { spk: 'A' });
K.renameSpeaker(sp, 'A', 'Moderator');
assert.match(K.plain(sp), /^Moderator: So that/);
assert.match(K.plain(sp), /\nModerator: Great question/);
// Split a sentence where a new voice took over mid-phrase.
const last = sp.phrases[2];
K.splitTurn(sp, last.id, 2, K.declareSpeaker(sp, K.newSpeakerId(sp)));
assert.match(K.plain(sp), /Moderator: Great question\.\nSpeaker C: We pair everyone with a mentor\.$/);
// Unknown turn from the bubble, answered in Prep.
K.addPhrase(sp, { text: 'can i follow up on that' }, { spk: '?' });
assert.match(K.plain(sp), /\nUnknown speaker: Can i follow up on that\.$/);
K.localCheck(sp);
const uq = sp.flags.find((f) => f.kind === 'spk' && f.unknown);
assert.ok(uq, 'unknown turn becomes a question');
K.resolveSpeakerFlag(sp, uq, 'B');
assert.match(K.plain(sp), /\nSpeaker B: Can i follow up on that\.$/);
// Claude finds an unmarked change and guesses an unknown turn.
K.addPhrase(sp, { text: 'yes absolutely next question please' }, { spk: '?' });
const claudeSp = { content: [{ type: 'tool_use', input: { changes: [
  { line: sp.phrases[sp.phrases.length - 1].id, quote: '', speaker: 'A', reason: 'host voice' },
  { line: sp.phrases[0].id, quote: 'is where the industry', speaker: 'new', reason: 'test' },
] } }] };
assert.equal(K.applySpeakers(sp, claudeSp), 2);
const guess = sp.flags.find((f) => f.kind === 'spk' && !f.unknown);
assert.equal(guess.ws, 2);
K.dismissSpeakerFlag(sp, guess);
const u2 = sp.flags.find((f) => f.kind === 'spk' && f.unknown);
assert.deepEqual(u2.sugg, ['A']);
K.dismissSpeakerFlag(sp, u2);
assert.match(K.plain(sp), /Speaker B: Can i follow up on that\. Yes absolutely next question please\.$/, 'not a change joins previous turn');
assert.equal(K.speakerRequest(sp, {}, '').tools[0].name, 'report_speakers');
// A model that answers in text instead of the tool still works.
const textSym = K.parseSymposium({ content: [{ type: 'text', text: 'Here you go:\n{"event":"Day","sessions":[{"time":"9:00","title":"Opening","speakers":["X"]}]}' }] });
assert.equal(textSym.sessions[0].title, 'Opening');

// Symposium from an agenda.
const symReq = K.symposiumRequest([{ media_type: 'image/jpeg', data: 'AAAA' }], 'Agenda text', 'https://example.org/agenda');
assert.equal(symReq.messages[0].content[0].type, 'image');
assert.match(symReq.messages[0].content[1].text, /Agenda text/);
const sym = K.parseSymposium({ content: [{ type: 'tool_use', input: { event: 'AEC Tech Day', date: '13 Nov', sessions: [
  { time: '9:00', title: 'Keynote: BIM at scale', speakers: ['Jane Doe (Perkins&Will)'] },
  { time: '10:30', title: 'Panel: computation', speakers: ['A. Lee', 'B. Kim'], room: 'Hall B' },
  { time: '', title: '', speakers: [] },
] } }] });
assert.equal(sym.sessions.length, 2);
const gdata = { groups: [] };
const made = K.makeSessionGroups(gdata, sym);
assert.equal(made.length, 2);
assert.equal(made[0].name, '9:00 · Keynote: BIM at scale');
assert.equal(made[1].event, 'AEC Tech Day · 13 Nov');
assert.equal(made[0].eventId, made[1].eventId);
assert.deepEqual(made[1].speakers, ['A. Lee', 'B. Kim']);

// Managing symposiums.
const md = { groups: [] };
const evMade = K.makeSessionGroups(md, sym);
assert.equal(md.events.length, 1);
const evId = md.events[0].id;
K.renameEvent(md, evId, 'AEC Tech Day 2026');
assert.ok(K.eventSessions(md, evId).every((g) => g.event === 'AEC Tech Day 2026'));
const added = K.addSession(md, evId, { time: '14:00', title: 'Closing', speakers: 'Jane Doe, A. Lee' });
assert.equal(added.name, '14:00 · Closing');
assert.deepEqual(added.speakers, ['Jane Doe', 'A. Lee']);
assert.equal(K.eventSessions(md, evId).pop().id, added.id, 'new session goes last');
K.updateSession(added, { title: 'Wrap-up' });
assert.equal(added.name, '14:00 · Wrap-up');
K.assignToGroup(md, added.id, ['r1']);
assert.deepEqual(K.unsortedIds(md, ['r1', 'r2']), ['r2']);
K.deleteGroup(md, added.id);
assert.deepEqual(K.unsortedIds(md, ['r1', 'r2']), ['r1', 'r2'], 'deleting a session unsorts its recordings');
const e2 = K.newEvent(md, 'Empty forum');
assert.equal(K.eventSessions(md, e2.id).length, 0);
K.deleteEvent(md, evId);
assert.equal(md.groups.length, 0);
assert.deepEqual(md.events.map((e) => e.name), ['Empty forum']);

console.log('Dictation: recording logic checks out.');
