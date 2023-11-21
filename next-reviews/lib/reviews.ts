import 'server-only';
// import { readdir, readFile } from 'node:fs/promises';
// import matter from 'gray-matter';
import qs from 'qs';
import { marked } from 'marked';

export const CACHE_TAG_REVIEWS = 'reviews';

const CMS_URL = process.env.CMS_URL;

interface CmsItem {
  id: number;
  attributes: any;
}

export interface Review {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  image: string;
}

export interface FullReview extends Review {
  body: string;
}

export interface PaginatedReviews {
  pageCount: number;
  reviews: Review[];
}

export type SearchableReview = Pick<Review, 'slug' | 'title'>;

/*
export async function getReview(slug: string): Promise<Review> {
  const text = await readFile(`./content/reviews/${slug}.md`, 'utf8');
  const {
    content,
    data: { title, date, image },
  } = matter(text);
  const body = marked(content);
  return { slug, title, date, image, body };
}
*/

/*
export async function getReviews(): Promise<Review[]> {
  const slugs = await getSlugs();
  const reviews: Review[] = [];
  for (const slug of slugs) {
    const review = await getReview(slug);
    reviews.push(review);
  }
  reviews.sort((a, b) => b.date.localeCompare(a.date));
  return reviews;
}
*/

/*
export async function getSlugs(): Promise<string[]> {
  const files = await readdir('./content/reviews');
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.slice(0, -'.md'.length));
}
*/

export async function getReview(slug: string): Promise<FullReview | null> {
  const { data } = await fetchReviews({
    filters: { slug: { $eq: slug } },
    fields: ['slug', 'title', 'subtitle', 'publishedAt', 'body'],
    populate: { image: { fields: ['url'] } },
    pagination: { pageSize: 1, withCount: false },
  });
  if (data.length === 0) {
    return null;
  }
  const item = data[0];
  return {
    ...toReview(item),
    body: marked(item.attributes.body),
  };
}

export async function getReviews(
  pageSize: number,
  page?: number
): Promise<PaginatedReviews> {
  const { data, meta } = await fetchReviews({
    fields: ['slug', 'title', 'subtitle', 'publishedAt'],
    populate: { image: { fields: ['url'] } },
    sort: ['publishedAt:desc'],
    pagination: { pageSize, page },
  });
  return {
    pageCount: meta.pagination.pageCount,
    reviews: data.map((item: CmsItem) => toReview(item)),
  };
}

async function fetchReviews(parameters: any) {
  const url =
    `${CMS_URL}/api/reviews?` +
    qs.stringify(parameters, { encodeValuesOnly: true });
  const response = await fetch(url, {
    next: {
      //  revalidate: 30, // seconds
      tags: [CACHE_TAG_REVIEWS],
    },
  });
  if (!response.ok) {
    throw new Error(`CMS returned ${response.status} for ${url}`);
  }
  return await response.json();
}

function toReview(item: CmsItem): Review {
  const { attributes } = item;
  return {
    slug: attributes.slug,
    title: attributes.title,
    subtitle: attributes.subtitle,
    date: attributes.publishedAt.slice(0, 'yyyy-mm-dd'.length),
    image: new URL(attributes.image.data.attributes.url, CMS_URL).href,
  };
}

export async function getSlugs(): Promise<string[]> {
  const { data } = await fetchReviews({
    fields: ['slug'],
    sort: ['publishedAt:desc'],
    pagination: { pageSize: 100 },
  });
  return data.map((item: CmsItem) => item.attributes.slug);
}

export async function searchReviews(
  query: string | null
): Promise<SearchableReview[]> {
  const { data } = await fetchReviews({
    filters: { title: { $containsi: query } },
    fields: ['slug', 'title'],
    sort: ['title'],
    pagination: { pageSize: 5 },
  });
  return data.map(({ attributes }: CmsItem) => ({
    slug: attributes.slug,
    title: attributes.title,
  }));
}
