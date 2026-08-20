import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './SetupSearch.module.css';
import { NavBar } from '../components/NavBar';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ChevronRightIcon } from '../components/Icon';
import { useSetup, type ProductSlot } from '../context/SetupContext';
import { api } from '../lib/api';
import type { Paginated, Product } from '../lib/types';

export function SetupSearch() {
  const navigate = useNavigate();
  const setup = useSetup();
  const [params] = useSearchParams();
  const slot = (params.get('slot') as ProductSlot) ?? 'test';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const path = query.trim()
        ? `/products/search?q=${encodeURIComponent(query.trim())}&limit=20`
        : '/products?limit=20&offset=0';
      api
        .get<Paginated<Product>>(path)
        .then((res) => setResults(res.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const choose = (product: Product) => {
    setup.setProduct(slot, product);
    navigate(-1);
  };

  return (
    <div>
      <NavBar title="제품 검색" />
      <div className={styles.body}>
        <TextInput placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <div className={styles.list}>
          {!loading && results.length === 0 && <div className={styles.empty}>검색 결과가 없습니다.</div>}
          {results.map((p) => (
            <div className={styles.row} key={p.id}>
              {p.imageUrl ? <img className={styles.thumb} src={p.imageUrl} alt={p.name} /> : <div className={styles.thumb} />}
              <div className={styles.info}>
                <span className={styles.name}>{p.name}</span>
                {p.brandName && <span className={styles.brand}>{p.brandName}</span>}
                <Button size="xs" rightIcon={<ChevronRightIcon size={14} color="#fff" />} onClick={() => choose(p)}>
                  제품 선택
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
