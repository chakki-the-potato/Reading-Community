import { latestMembersPath, parseMembers } from './member-list.js';
import { read } from './staged-changes.js';
import { $, errorText, h } from './ui.js';

let members = [];

export const currentMembers = () => members;

function setMembers(next) {
  members = [...next].sort();
  $('memberCount').textContent = `${members.length}명`;
  $('memberChips').replaceChildren(...members.map(chip));
}

function chip(name) {
  const remove = h('button', { type: 'button', class: 'chip-x', 'aria-label': `${name} 빼기`, text: '×' });
  remove.addEventListener('click', () => setMembers(members.filter(m => m !== name)));
  return h('span', { class: 'chip' }, [name, remove]);
}

function addMember() {
  const input = $('memberInput');
  const name = input.value.trim();
  const error = $('quarterError');
  error.textContent = '';
  if (!name) { error.textContent = '추가할 이름을 입력하세요.'; return; }
  if (members.includes(name)) { error.textContent = `${name}은(는) 이미 있어요.`; return; }
  setMembers([...members, name]);
  input.value = '';
}

async function loadLatestMembers() {
  const source = $('memberSource');
  try {
    const path = await latestMembersPath();
    if (!path) { source.textContent = '이전 멤버 파일이 없어요. 이름을 하나씩 추가하세요.'; return; }
    setMembers(parseMembers(await read(path)));
    source.textContent = `지난 멤버(${path.split('/').pop()})를 불러왔어요. 나간 사람은 ×, 새로 온 사람은 추가하세요.`;
  } catch (err) {
    console.error(err);
    source.textContent = errorText(err);
  }
}

export function initMemberEditor() {
  $('memberAdd').addEventListener('click', addMember);
  $('memberInput').addEventListener('keydown', e => { if (e.key === 'Enter') addMember(); });
  loadLatestMembers();
}
