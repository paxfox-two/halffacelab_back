import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Setup.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { SearchIcon, CameraIcon } from '../components/Icon';
import { useSetup, type ProductSlot } from '../context/SetupContext';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import type { Product, Trial } from '../lib/types';

const MAX_PHOTO_DIMENSION = 480;

// Downscales the attached product photo before turning it into a data: URI
// — this MVP has no object storage to upload to, so the image is stored
// inline in the DB, and keeping it under ~480px keeps that payload sane.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

function ProductSlotCard({
  slot,
  label,
  help,
}: {
  slot: ProductSlot;
  label: string;
  help: [string, string];
}) {
  const navigate = useNavigate();
  const setup = useSetup();
  const fileRef = useRef<HTMLInputElement>(null);
  const product = slot === 'test' ? setup.testProduct : setup.controlProduct;
  const photo = slot === 'test' ? setup.testPhoto : setup.controlPhoto;
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setup.setPhoto(slot, dataUrl);
  };

  const displayValue = product ? `${product.brandName ? product.brandName + ' · ' : ''}${product.name}` : '';

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.cardHeaderRow}>
          <span>{label}</span>
          <span className={styles.required}>*</span>
        </div>
        <div className={styles.cardHelp}>
          <div>{help[0]}</div>
          <div>{help[1]}</div>
        </div>
      </div>

      <TextInput placeholder={label} readOnly value={displayValue} />

      {photo && !product && (
        <div className={styles.photoPreview}>
          <img src={photo} alt="첨부한 제품 사진" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <TextInput
              placeholder="제품명을 입력하세요"
              value={manualName}
              onChange={(e) => {
                setManualName(e.target.value);
                if (slot === 'test') setup.setField('testManualName', e.target.value);
                else setup.setField('controlManualName', e.target.value);
              }}
            />
            <TextInput
              placeholder="브랜드명 (선택)"
              value={manualBrand}
              onChange={(e) => {
                setManualBrand(e.target.value);
                if (slot === 'test') setup.setField('testManualBrand', e.target.value);
                else setup.setField('controlManualBrand', e.target.value);
              }}
            />
          </div>
        </div>
      )}

      <div className={styles.buttonRow}>
        <Button variant="secondary" size="small" leftIcon={<SearchIcon size={16} />} onClick={() => navigate(`/setup/search?slot=${slot}`)}>
          검색하기
        </Button>
        <Button variant="primary" size="small" leftIcon={<CameraIcon size={16} color="#fff" />} onClick={() => fileRef.current?.click()}>
          촬영하기
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

async function resolveProduct(
  chosen: Product | null,
  photo: string | null,
  manualName: string,
  manualBrand: string,
): Promise<Product> {
  if (chosen) return chosen;
  if (!manualName.trim()) {
    throw new Error('제품명을 입력해 주세요.');
  }
  return api.post<Product>('/products', {
    name: manualName.trim(),
    brandName: manualBrand.trim() || undefined,
    imageUrl: photo ?? undefined,
  });
}

export function Setup() {
  const navigate = useNavigate();
  const setup = useSetup();
  const { metrics, refresh } = useTrial();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!setup.testProduct && !setup.testPhoto) {
      setError('측정할 제품을 검색하거나 사진을 첨부해 주세요.');
      return;
    }
    if (!setup.controlProduct && !setup.controlPhoto) {
      setError('기존 제품을 검색하거나 사진을 첨부해 주세요.');
      return;
    }
    const start = new Date(setup.startDate + 'T00:00:00');
    const end = new Date(setup.endDate + 'T00:00:00');
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (days < 28) {
      setError('측정 기간은 최소 한 달(28일) 이상이어야 합니다.');
      return;
    }
    const redness = metrics.find((m) => m.code === 'REDNESS');
    if (!redness) {
      setError('사용 가능한 측정 항목을 찾을 수 없습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const [testProduct, controlProduct] = await Promise.all([
        resolveProduct(setup.testProduct, setup.testPhoto, setup.testManualName, setup.testManualBrand),
        resolveProduct(setup.controlProduct, setup.controlPhoto, setup.controlManualName, setup.controlManualBrand),
      ]);

      const trial = await api.post<Trial>('/trials', {
        title: `${testProduct.name} 테스트`,
        primaryMetricId: redness.id,
        startDate: setup.startDate,
        endDate: setup.endDate,
        testProductId: testProduct.id,
        controlProductId: controlProduct.id,
        preferredCaptureTime:
          setup.hour && setup.minute ? `${setup.hour.padStart(2, '0')}:${setup.minute.padStart(2, '0')}` : undefined,
      });
      await api.post(`/trials/${trial.id}/lock`);
      await api.patch(`/trials/${trial.id}`, { status: 'RUNNING' });

      await refresh();
      setup.reset();
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '테스트를 시작하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className={styles.page}>
      <NavBar title="테스트 설계" />
      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`h3 ${styles.sectionTitle}`}>제품 등록</span>
            <span className={styles.sectionDesc}>효과를 측정할 제품 정보를 입력하세요.</span>
          </div>
          <div className={styles.cards}>
            <ProductSlotCard
              slot="test"
              label="측정할 제품"
              help={['측정할 제품을 입력하세요.', '해당 제품이 유의미한 효과가 있는지 분석합니다.']}
            />
            <ProductSlotCard
              slot="control"
              label="기존 제품"
              help={['기존에 사용하던 제품을 입력하세요.', '해당 제품과 비교 분석합니다.']}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`h3 ${styles.sectionTitle}`}>테스트 일정 설정</span>
            <span className={styles.sectionDesc}>측정 기간과 시간을 설정합니다.</span>
          </div>
          <div className={styles.card}>
            <div>
              <div className={styles.cardHeaderRow}>
                <span>기간 설정</span>
                <span className={styles.required}>*</span>
              </div>
              <div className={styles.cardHelp}>
                <div>테스트를 진행할 기간을 설정하세요.</div>
                <div>측정 기간은 최소 한 달입니다.</div>
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>시작일</div>
              <input
                type="date"
                className={styles.select}
                style={{ width: '100%', marginTop: 8 }}
                value={setup.startDate}
                onChange={(e) => setup.setField('startDate', e.target.value)}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>종료일</div>
              <input
                type="date"
                className={styles.select}
                style={{ width: '100%', marginTop: 8 }}
                value={setup.endDate}
                onChange={(e) => setup.setField('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div>
              <div className={styles.cardHeaderRow}>
                <span>시간 설정</span>
              </div>
              <div className={styles.cardHelp}>
                <div>측정 시간을 설정하시면</div>
                <div>정해진 시간마다 알림을 보내 드립니다.</div>
              </div>
            </div>
            <div className={styles.fieldLabel}>측정 시간</div>
            <div className={styles.timeRow}>
              <div className={styles.timeGroup}>
                <select
                  className={styles.select}
                  value={setup.hour}
                  onChange={(e) => setup.setField('hour', e.target.value)}
                >
                  <option value="">시</option>
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className={styles.unit}>시</span>
              </div>
              <div className={styles.timeGroup}>
                <select
                  className={styles.select}
                  value={setup.minute}
                  onChange={(e) => setup.setField('minute', e.target.value)}
                >
                  <option value="">분</option>
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className={styles.unit}>분</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.footer}>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '시작하는 중...' : '다음 단계로'}
        </Button>
      </div>
    </div>
  );
}
