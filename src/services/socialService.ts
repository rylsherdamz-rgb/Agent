import { v4 as uuid } from 'uuid';
import { SocialDB } from './database';
import type { SocialPost } from '../types';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
}

async function parseRSSFeed(xmlText: string): Promise<RSSItem[]> {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const content = match[1];
    const title = extractTag(content, 'title');
    const link = extractTag(content, 'link');
    const description = extractTag(content, 'description');
    const pubDate = extractTag(content, 'pubDate');
    const author = extractTag(content, 'author') || extractTag(content, 'dc:creator');

    if (title && link) {
      items.push({ title, link, description: stripHtml(description), pubDate, author });
    }
  }

  return items;
}

function extractTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

const REDDIT_RSS_BASE = 'https://www.reddit.com';

export async function fetchRedditFeed(subreddit: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(`${REDDIT_RSS_BASE}/r/${subreddit}/.rss`, {
      headers: { 'User-Agent': 'Agent/1.0' },
    });
    const xmlText = await response.text();
    const items = await parseRSSFeed(xmlText);

    return items.map(item => ({
      id: uuid(),
      platform: 'reddit' as const,
      author: item.author || `r/${subreddit}`,
      authorAvatar: '',
      content: `${item.title}\n\n${item.description}`,
      url: item.link,
      date: new Date(item.pubDate).getTime(),
      isRead: false,
      isSaved: false,
      mediaUrls: [],
      sourceTaskId: null,
    }));
  } catch {
    return [];
  }
}

export async function fetchRSSFeed(url: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const items = await parseRSSFeed(xmlText);

    return items.map(item => ({
      id: uuid(),
      platform: 'rss' as const,
      author: item.author || '',
      authorAvatar: '',
      content: `${item.title}\n\n${item.description}`,
      url: item.link,
      date: new Date(item.pubDate).getTime(),
      isRead: false,
      isSaved: false,
      mediaUrls: [],
      sourceTaskId: null,
    }));
  } catch {
    return [];
  }
}

export async function syncSocialFeed(platform: string, config?: string): Promise<{ synced: number; error: string | null }> {
  try {
    let posts: SocialPost[] = [];

    switch (platform) {
      case 'reddit': {
        const subreddits = config ? config.split(',') : ['all'];
        for (const sub of subreddits) {
          const redditPosts = await fetchRedditFeed(sub.trim());
          posts.push(...redditPosts);
        }
        break;
      }
      case 'rss': {
        if (config) {
          const urls = config.split(',');
          for (const url of urls) {
            const rssPosts = await fetchRSSFeed(url.trim());
            posts.push(...rssPosts);
          }
        }
        break;
      }
      default:
        return { synced: 0, error: `Unknown platform: ${platform}` };
    }

    let synced = 0;
    for (const post of posts) {
      await SocialDB.create(post);
      synced++;
    }

    return { synced, error: null };
  } catch (err) {
    return { synced: 0, error: (err as Error).message };
  }
}

export function getPlatformSuggestions(): { name: string; url: string }[] {
  return [
    { name: 'Reddit Front Page', url: 'https://www.reddit.com/.rss' },
    { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  ];
}