'use client';

import type { SearchableReview } from '@/lib/reviews';
import { useRouter } from 'next/navigation';
import { Combobox } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useIsClient } from '@/hooks/client';

export default function SearchBox() {
  const router = useRouter();
  const isClient = useIsClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [reviews, setReviews] = useState<SearchableReview[]>([]);
  useEffect(() => {
    if (debouncedQuery.length > 1) {
      const controller = new AbortController();
      const url = '/api/search?query=' + encodeURIComponent(debouncedQuery);
      fetch(url, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((reviews) => setReviews(reviews));
    } else {
      setReviews([]);
    }
  }, [debouncedQuery]);

  const handleChange = (review: SearchableReview) => {
    router.push(`/reviews/${review.slug}`);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="relative w-48">
      <Combobox onChange={handleChange}>
        <Combobox.Input
          placeholder="Search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border px-2 py-1 rounded w-full"
        />
        <Combobox.Options className="absolute bg-white py-1 w-full">
          {reviews.map((review) => (
            <Combobox.Option key={review.slug} value={review}>
              {({ active }) => (
                <span
                  className={`block px-2 truncate w-full ${
                    active ? 'bg-orange-100' : ''
                  }`}
                >
                  {review.title}
                </span>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}
