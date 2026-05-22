import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getNewsUrl } from '@/lib/news';

export async function GET(context: import('astro').APIContext) {
  const news = await getCollection('news');
  const sortedPosts = news.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'BIOGAIN News',
    description: 'News about the BIOGAIN project',
    site: context.site ?? 'https://biogain.site',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      author: post.data.author,
      link: `${getNewsUrl(post)}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
