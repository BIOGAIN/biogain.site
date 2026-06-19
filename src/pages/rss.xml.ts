import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getNewsUrl } from '@/lib/news';

export async function GET(context: import('astro').APIContext) {
  const site = context.site ?? new URL('https://biogain-project.eu');
  const siteOrigin = site.href.replace(/\/$/, '');

  const news = await getCollection('news');
  const sortedPosts = news.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  // Render each post's full body to an HTML string through Astro's real
  // render pipeline (image optimisation, figure captions, base paths), then
  // rewrite root-relative src/href URLs to absolute so feed readers resolve
  // images and internal links.
  const container = await AstroContainer.create();
  const items = await Promise.all(
    sortedPosts.map(async (post) => {
      const { Content } = await render(post);
      const rendered = await container.renderToString(Content);
      const content = rendered.replace(
        /(href|src)="\/(?!\/)/g,
        (_match, attr) => `${attr}="${siteOrigin}/`
      );

      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        author: post.data.author,
        link: `${getNewsUrl(post)}/`,
        content,
      };
    })
  );

  return rss({
    title: 'BIOGAIN News',
    description: 'News about the BIOGAIN project',
    site,
    items,
    customData: `<language>en-gb</language>`,
  });
}
