import { $, h, runWithButton } from './ui.js';

const shortDate = iso => iso.slice(5).replace('-', '/');

function reviewItem(candidate, onPick) {
  const err = h('p', { class: 'error', role: 'alert' });
  const buttons = ['O', 'X'].map(value => {
    const btn = h('button', { class: 'btn small', type: 'button', text: value });
    btn.addEventListener('click', () => runWithButton(btn, err, async () => {
      await onPick(candidate, value);
      buttons.forEach(b => b.classList.toggle('selected', b === btn));
    }));
    return btn;
  });
  return h('div', { class: 'review-item' }, [
    h('div', { class: 'review-main' }, [
      h('strong', { text: `${candidate.name} · ${shortDate(candidate.date)}` }),
      h('span', { class: 'hint', text: candidate.reason }),
      h('ul', { class: 'messages' }, candidate.messages.map(m => h('li', { text: `${m.time}  ${m.text}` }))),
      err,
    ]),
    h('div', { class: 'review-actions' }, buttons),
  ]);
}

export function renderReviewList(candidates, onPick) {
  const list = $('reviewList');
  if (candidates.length === 0) {
    list.replaceChildren(h('p', { class: 'hint', text: '확인이 필요한 인증이 없어요.' }));
    return;
  }
  list.replaceChildren(...candidates.map(c => reviewItem(c, onPick)));
}
