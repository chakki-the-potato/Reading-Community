import { hasPenalty, parseRecord } from './record-csv.js';
import { $, h } from './ui.js';

function metric(label, value, tone = '') {
  return h('div', { class: `metric ${tone}` }, [h('span', { text: label }), h('strong', { text: value })]);
}

function averageRate(rows) {
  const rates = rows.map(r => parseInt(r.rate, 10)).filter(n => !Number.isNaN(n));
  return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
}

function resultTable(rows) {
  const head = h('tr', {}, ['이름', '인증률', '벌금'].map(t => h('th', { text: t })));
  const body = rows.map(r => h('tr', {}, [r.name, r.rate, r.penalty].map(t => h('td', { text: t }))));
  return h('div', { class: 'table-scroll' }, [
    h('table', { class: 'result-table' }, [h('thead', {}, [head]), h('tbody', {}, body)]),
  ]);
}

export function renderVerifyResult({ record, review }, quarter) {
  const { rows } = parseRecord(record);
  const pending = review.candidates.length;
  $('verifyResult').replaceChildren(h('div', { class: 'panel' }, [
    h('h2', { text: `${quarter.label} 결과` }),
    h('div', { class: 'metrics' }, [
      metric('평균 인증률', `${averageRate(rows)}%`),
      metric('벌금 대상', `${rows.filter(hasPenalty).length}명`),
      metric('확인 필요', `${pending}건`, pending ? 'warn' : ''),
    ]),
    review.unmatched.length
      ? h('p', { class: 'warn-text', text: `멤버 명단에 없는 채팅 이름: ${review.unmatched.join(', ')}. 별명이면 멤버 이름과 같은지 확인하세요.` })
      : '',
    pending ? h('p', { class: 'hint', text: '확인이 필요한 건은 "인증 수정" 탭에서 O/X를 고를 수 있어요.' }) : '',
    resultTable(rows),
  ]));
}
