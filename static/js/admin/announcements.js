const ACCOUNT = '79799078100 카카오뱅크, 이찬희';
const SITE_URL = 'https://chakki-the-potato.github.io/Reading-Community/';

export function settlementNotice({ label }) {
  return `${label} 벌금 정산입니다. 아래 계좌로 납입 부탁드립니다!

다들 페이지에서 본인 인증 현황 확인하시고 문제 있으면 알려주세요.

${ACCOUNT}`;
}

export function generalNotice() {
  return `몇 가지 공지드립니다.

1. 소모임 모임통장이 있습니다. 최대한 투명하게 운영하고자 현황을 공개하고 있으며, 가입을 희망하시면 이 글에 체크 부탁드립니다.

2. 감상문 작성 시 첫 문장에 반드시 '읽'이라는 글자가 들어가야 벌금 정산 시 오류가 없습니다. 제가 직접 검토하는 게 아닌 코드로 처리하고 있으니 꼭 지켜주세요.

3. 인증 기준은 매우 널널합니다. 읽기만 했다면 간단한 사진과 감상문을 올려주시면 웬만해서는 모두 인정합니다.
   (시간 기준: 새벽 5시까지, 전날 기록으로 처리 / 예: 23일 4am 인증 → 22일로 인정)

4. 소모임 취지는 '생각하기 위해 읽는 책'입니다. 책 선택은 자유이나, 만화책·전공책 등은 인정이 어렵습니다.

궁금한 점 있으시면 편하게 말씀해주세요!`;
}

export function recruitNotice() {
  return `뇌에 기름칠 할 사람 급구! 🧠 독서 소모임 <책책책 책을 읽읍시다> 활동멤버 모집!

"오늘도 스마트폰만 보셨나요? 당신의 뇌, 이대로 괜찮은가?"

하루 딱 10분! 부담 없이 함께 책을 읽고, 서로의 생각을 나누며 지식인이 되어봅시다.
꾸준한 독서 습관은 저희가 책임질게요.

자세한 활동 규칙과 내용은 아래 페이지에서 확인하세요! 👇

🔗 소모임 페이지: ${SITE_URL}`;
}

export function quarterEndNotice({ label, endDate, nextLabel, deadline }) {
  return `${label} 활동이 ${endDate}로 마무리됩니다.

다음 분기(${nextLabel})부터 활동을 중단하고 싶으신 분은 ${deadline}까지 저에게 개인적으로 연락 부탁드립니다.
별도 연락이 없으시면 다음 분기에도 자동으로 참여하는 것으로 처리됩니다.`;
}
