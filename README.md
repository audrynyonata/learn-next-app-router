## Next Reviews

Node version: v18  
Next.js version: 14 (using app router)

Pages router: https://github.com/audrynyonata/learn-next-pages-router

## App vs Pages router

app (recommended):

- advanced features
- suitable for complex application
- more flexible
- steep learning curve

pages:

- basic features
- best for simple application
- less flexible
- easier to learn

### 1. Server vs Client Component

app:

- All components inside app folder is by default react server components, render only on server, without sending any JavaScript code to the browser.

  - Zero-Bundle-Size: components that add zero code to the JS bundle, more efficient.
  - Unlike Client Components, a Server Component can be async.
  - SSG in app router: pages are pre-rendered at build time, not re-rendered in server nor client at page load
  - SSR in app router: html does not get pre-rendered at build time

- To use client component, must mark with "use client" //also applies to all children (best to use at the leaf of the component tree), then render will behave like traditional pages router, render twice, in server + client.

  - Any prop we pass from a Server to a Client Component will end up being inserted as JavaScript into the page, the more props data, the larger increase of the page size.

pages: client components, render twice, in server + client

P.S. :

- import 'server-only'; will show build-time error if someone ever accidentally import server only modules into a Client Component.
- The corresponding package 'client-only' can be used to mark modules that contain client-only code – for example, code that accesses the window object.
- To fix hydration conflict for client-only code:
  1. use useEffect to run on the client only, set state isClient to avoid prerendering on server
  2. Disable SSR on specific components, set { ssr: false } on dynamic import module
  3. use suppressHydrationWarning

### 2. File-based router directory

app:

```
app
  layout.jsx -> root layout
  page.js -> homepage
  about -> `about` is a folder
    page.js -> must contain a file named page.js|ts
  api
    products
      route.js -> /api/products. route handlers name must be exactly the HTTP method ex: `GET()`, `POST()` etc.
  icon.ong -> special file
  posts
    [slug] -> folder. dynamic segment
      page.js
```

pages:

```
pages
  _app.js -> special page for root layout
  index.js -> homepage
  about.js -> `about` is a file
  api
    products.js -> /api/products. api routes contain multiple handler, use switch statements to differentiate HTTP methods
  posts
    [slug].js -> file. dynamic route
```

P.S. :

- each individual folder -> a route segment
  - app/ -> is root route segment
  - /about -> the last segment is called leaf segment
- (folderName) -> route group, folder name will be ommited
- [folderName] -> dynamic segment, or [fileName].js dynamic route.
  - [slug] -> the square brackets mean it will match any path segment in the URL, like a wildcard.
  - [...slug].js -> catch-all
  - [[...slug]].js -> optional catch-all (also match parent pattern)

### 3. Layout

app: layout.jsx -> support root layout and nested layout  
pages: \_app.jsx -> special page component, acts as root layout applies to all pages

### 4. Static Assets or Metadata Files

app: automatically recognized some special assets in app folder as Metadata Files, ex: icon.png, favicon.ico, robots.txt, sitemap.xml.
Others, can still be stored in public folder, ex: fonts, images.

pages: all static assets stored in public folder

### 5. Title

app:

- in layout.jsx (root layout):

  ```
  export const metadata = {
    title: {
      default: 'Indie Gamer',
      template: '%s | Indie Gamer',
    }
  }
  ```

- in page.jsx:

  ```
  export const metadata = { title: 'About' }

  // or

  export async function generateMetadata(props) {
    return { title: 'About' }
  } // result: About | Indie Gamer
  ```

pages:

```
import Head from 'next/head';

return (
  <Head>
    <title>About | Indie Gamer</title>
  </Head>
);
```

### 6. Router

app: import { useRouter, notFound, usePathname } from 'next/navigation';  
pages: import { useRouter } from 'next/router';

### 7. Custom Error

in app/not-found.jsx or pages/404.jsx:

```
export default function NotFoundPage() {
  return 'Not found.'
}
```

### 8. Dynamic Routes

To manage new pages or unconfigured slugs in statically generated params/paths.

app:

```
export const dynamicParams = true; // default: true: generate on demand. false: return 404

export async generateStaticParams() // render all possible pages statically at build time
  return [{slug: 'a'}, {slug: 'b'}]

function Page({params}) { // props
  const { slug } = params;
  ...
}
```

pages:

```
export async getStaticPaths()
  return {
    paths: [{params: { slug: 'a'}}],
    fallback: true/false/'blocking'
  }

export async getStaticProps({params}) { // context
  const { slug } = params;
  return { props: { product } }
}

function Page({product}) { } // props
```

### 9. Static vs Dynamic Rendering

To reflect changes/updated data in already-existing page.

app:

```
export const dynamic = 'force-dynamic'; // default: 'auto'. the page will cache as much as possible (prioritize static render but still allow dynamic render). 'force-dynamic': will re-render at every request, always show latest data

// or

const response = await fetch(url, {
  cache: 'no-store'
});
```

pages:

```
export async getServerSideProps() { ... }
```

## 10. Background Revalidation

#### Time-interval based revalidation

app:

```
export const revalidate = 30 //seconds

// or

const response = await fetch(url, {
   next: { revalidate: 30 }
})
```

pages:

```
export async getStaticProps({params}) {
   return { props: { product }, revalidate: 30 }
}
```

Result: First page request after revalidation will trigger re-render but does not wait and immediately send old version, instead, the next requests afterwards will receive new data. This is same behavior between app and pages.

#### On-demand revalidation (webhooks route handler)

app:

- in reviews > page.jsx:

  ```
  const response = await fetch(url, {
    next: { tags: ['reviews'] }
  });
  ```

- in webhooks > cms-event > route.js:

  ```
  export function POST(request) {
    revalidateTag('reviews); // mark cache as invalid, but does not trigger re-render on server
    return new Response(null, { status: 204 } );
  }
  ```

pages:

in pages > api > revalidate.js

```
async function handleRevalidate(req, res) {
  await res.revalidate('/');
  res.status(204).end();
}
```

Result:

- in app: webhook will trigger invalidate cache. First page request will trigger re-render but does not wait and immediately send old version, instead, the next requests afterwards will receive new data.
- in pages: webhook will trigger revalidate cache and re-render. First page request will immediately receive new data.

## Rendering and Fetch

The fetch options can affect how the page is rendered. Setting granular cache control via fetch is more recommended. Shorter interval will overwrite the page render configuration (on multiple fetch per page, on dynamic/cache no-store, on conflict settings).

| page.jsx                            |     | fetch                                    |                                                                   |
| ----------------------------------- | --- | ---------------------------------------- | ----------------------------------------------------------------- |
| force-dynamic                       | ->  | (cache: no-store)                        | will disable fetch cache                                          |
| revalidate: 30                      | ->  | (revalidate: 30)                         | will apply same setting to fetch requests made by that page       |
| (dynamic)                           | <-  | cache: no-store                          | will allow page to have dynamic behavior                          |
| (revalidate: 30)                    | <-  | revalidate: 30                           | will cause the page to be regenerated based on same time interval |
| Other scenario                      |     |                                          |                                                                   |
| (revalidate: 30)                    | <-  | 1. revalidate: 30 <br>2. revalidate: 60  | will choose shorter interval                                      |
| (dynamic)                           | <-  | 1. revalidate: 30 <br>2. cache: no-store | will choose shorter interval                                      |
| revalidate: 60 (overwritten to: 30) | <-  | revalidate: 30                           | will choose shorter interval                                      |

Default scenario: when we don't set any options on fetch and page.jsx
| page.jsx | | fetch | |
| ------------------------- | --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (auto: static or dynamic) | <- | (cache: default) | fetch: cache all responses by default. page: cache as much as possible without preventing dynamic behavior.|

Result:
Usually this results in the page to be static (in line with fetch behavior).

But, when 'dynamicParams = true' and 'generateStaticParams' is not defined, page will be rendered dynamically at every request but using cached fetch data.

## Rendering Strategy

| No  | Rendering Strategy               |                                                    |                                                                                                                                                                                              |
| --- | -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Static                           | Generated at build time                            | -Can be exported as a static website <br> -Faster response <br> -Lower server usage (CPU load, etc.)                                                                                         |
| 2   | Static + dynamicParams           | Generated at build time + run time for new path    | All pages are static, but can still add new pages without redeploying our application.                                                                                                       |
| 3   | Static + On-demand Revalidation  | Generated at build time + run time on-demand       | Re-render pages as soon as the data changes, and only when the data changes. Need CMS that supports webhook notifications, or have some other way to know exactly when the data is modified. |
| 4   | Static + Time-based Revalidation | Generated at build time + run time every N seconds | Generated static pages will expire after a certain number of seconds, causing them to be regenerated periodically, so not always immediately after data updates.                             |
| 5   | Dynamic                          | Generated at run time at every request             | -Latest data<br>-Slower response<br>-Higher server usage (CPU load, etc.)                                                                                                                    |

Server (pre-rendering): no. 1-5, generated at server-side.  
Client: using browser fetch, generated at client-side.

#### How To Choose?

1. Data never changes -> **Static**
2. Data can change, but is same for all users:
   - If only need new pages: **Static + dynamicParams**
   - If also need modify existing content: **Static + On-demand revalidation** (if can receive notifications for data changes) or **Time-interval revalidation**
3. Must show latest data, or page is user-specific -> **Dynamic** (or **Client-side**)

## Prefetching

Next.js prefetches links in the page to make navigation faster. It fetches only the data used by React Server Components, not requesting the HTML document.

Content-Type: text/x-component

dev: on mouse hover (no longer enabled in next 13+).  
prod: when visible in viewport on initial load or scrolling.

To opt-out, set prefetch=false:

```

<Link href="/about" prefetch={false}>About</Link>
```

## Environment Variables

in .env (or .env.local):

```
# only accessible in server components
# will return undefined in a client component
CMS_URL=http://localhost:1337 # process.env.CMS_URL

# add NEXT_PUBLIC_ to make variables accessible in client components
NEXT_PUBLIC_CMS_URL=http://localhost:1337 # process.env.NEXT_PUBLIC_CMS_URL
```

## Import alias

in jsconfig.json or tsconfig.json:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Before**:
import Heading from '../../components/Heading';  
**After**: import Heading from '@/components/Heading';

## Images

Strapi
dev: relative img path to local strapi instance  
prod: absolute img path to remote strapi media instance

```js
const src = new URL(pathToFile, 'http://localhost:1337').href;
```

in next.config.js:

```js
module.exports = {
  images: {
    loader: 'custom' /* alternative image loader (optional) */,
    loaderFile: './custom-loader.js',
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost' /* strapi img url */,
        port: '1337',
        pathname:
          '/uploads/**' /* restrict accessing to other strapi endpoint, ex: /api, etc. */,
      },
    ],
    unoptimized: true /* img src will fetch directly from strapi instead of node.js server. this allow output: 'export' */,
  },
};
```

**LCP (largest contentful paint):** For images located near the top of the page, set `priority={true}`.
This will update the HTML img element from loading='lazy' into fetchpriority='high'.

Recommended in production: for high performance image processing

```
npm install sharp
```

## Typography

in globals.css:

```
@tailwind base
@tailwind components
@tailwind utility
```

in tailwind.config.js:

```
plugins: [
  require('@tailwindcss/typography')
]
```

in page.jsx:

```
<article dangerouslySetInnerHTML={{ __html: html }} className="prose" />
```

## Custom Fonts

Traditional (not recommended): this rely on google server, add complication to privacy policy.

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=CrimsonPro" >
```

Recommended: Host fonts on our website.  
Upon build, Next.js will download font and include them as static assets in static/media.

in app > fonts.js:

```js
import { Orbitron } from 'next/font/google';
export const orbitron = Orbitron({
  subsets: ['latin'], // greek, cyrillic
  variable: '--font-orbitron', // assign a variable to refer this font and later add it into classes of html element
});
```

in tailwind.config.js:

```js
const config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-exo2)', 'sans-serif'], // override default sans
        orbitron: ['var(--font-orbitron)', 'sans-serif'], // allow `font-obitron` to be used in classnames
      },
    },
  },
};
```

in layout.jsx (root layout):

```
import {orbitron} from '@/app/fonts';

<html lang="en" className={`${exo2.variable} ${orbitron.variable}`}>
```

or:

```
<html lang="en" className='font-obitron'>
```

## Navigator

The "navigator" global object as a "clipboard" property, that we can use to access the system clipboard.

```javascript
navigator.clipboard.writeText('Hello world!');
```
