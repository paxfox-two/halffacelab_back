export type TutorialCategory = 'test' | 'use' | 'camera';

export type TutorialSlideSegment = { text: string; bold?: boolean };

export type TutorialSlide = { segments: TutorialSlideSegment[] };

export type TutorialSection = {
  category: TutorialCategory;
  title: string; // nav bar title, e.g. "테스트 튜토리얼"
  listTitle: string; // list-card title, e.g. "테스트"
  listDesc: string;
  twoButtons: boolean; // some sections show a secondary "다음/홈으로" + primary CTA row, others just one button
  ctaLabel: string; // primary CTA label shown once on the last slide (only used when twoButtons)
  ctaTarget: 'setup' | 'camera';
  slides: TutorialSlide[];
};

export const TUTORIAL_SECTIONS: Record<TutorialCategory, TutorialSection> = {
  test: {
    category: 'test',
    title: '테스트 튜토리얼',
    listTitle: '테스트',
    listDesc: '테스트 과정 전반을 학습합니다.',
    twoButtons: true,
    ctaLabel: '테스트 시작하기',
    ctaTarget: 'setup',
    slides: [
      { segments: [{ text: '하프페이스랩은 얼굴 좌우를 비교하여 제품의 효과를 확인합니다.' }] },
      { segments: [{ text: '효과를 측정하고 싶은 제품을 등록하면 나만의 테스트가 설계됩니다.' }] },
      { segments: [{ text: '매일 30초, 같은 곳에서 얼굴을 기록해 주세요.' }] },
      { segments: [{ text: '측정 후 일일 리포트를 통해 매일의 변화를 추적해 보세요.' }] },
      { segments: [{ text: '테스트가 완료되면 최종 분석 결과지가 제공됩니다!' }] },
    ],
  },
  use: {
    category: 'use',
    title: '제품 사용 튜토리얼',
    listTitle: '제품 사용',
    listDesc: '제품 사용 시 주의할 점을 학습합니다.',
    twoButtons: false,
    ctaLabel: '홈으로',
    ctaTarget: 'setup',
    slides: [
      {
        segments: [
          { text: '측정 기간 동안 비교 제품 외에는 얼굴 좌우 조건을 ' },
          { text: '동일하게', bold: true },
          { text: ' 유지해야 합니다.' },
        ],
      },
      {
        segments: [
          { text: '사용자 기준으로 언제나 ' },
          { text: '기존 제품을 왼쪽, 신규 제품을 오른쪽에', bold: true },
          { text: ' 사용합니다.' },
        ],
      },
      {
        segments: [
          { text: '등록한 제품 외 제품을 사용하는 경우 가급적 ' },
          { text: '얼굴 좌우 모두에', bold: true },
          { text: ' 사용해 주세요.' },
        ],
      },
    ],
  },
  camera: {
    category: 'camera',
    title: '측정 튜토리얼',
    listTitle: '측정',
    listDesc: '측정 과정 전반을 학습합니다.',
    twoButtons: true,
    ctaLabel: '측정 시작하기',
    ctaTarget: 'camera',
    slides: [
      {
        segments: [
          { text: '촬영은 ' },
          { text: '같은 장소', bold: true },
          { text: '에서 진행하며 동일한 시간대 촬영을 권장합니다.' },
        ],
      },
      {
        segments: [
          { text: '밝고 균일한 실내 조명 아래에서 카메라를 ' },
          { text: '정면으로', bold: true },
          { text: ' 눈높이에 맞추세요.' },
        ],
      },
      { segments: [{ text: '화면 속 가이드에 얼굴을 맞추면 자동으로 촬영합니다.' }] },
    ],
  },
};
