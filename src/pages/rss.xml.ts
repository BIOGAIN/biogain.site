import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getNewsUrl } from '@/lib/news';

export async function GET(context: import('astro').APIContext) {
  const news = await getCollection('news');
  const sortedPosts = news.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'AstroDeck News',
    description: 'Articles, tutorials, and updates from the AstroDeck project',
    site: context.site ?? 'https://astrodeck.dev',
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
