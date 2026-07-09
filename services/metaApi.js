const fetch = require('node-fetch');
const FormData = require('form-data');

class MetaApiService {
  constructor() {
    this.baseUrl = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}`;
    this.pageId = process.env.PAGE_ID;
    this.accessToken = process.env.PAGE_ACCESS_TOKEN;
  }

  // Helper for all API requests
  async _request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}access_token=${this.accessToken}`;
    
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(fullUrl, options);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message} (Code: ${data.error.code})`);
    }
    return data;
  }

  // Verify token validity
  async verifyToken() {
    try {
      const debugUrl = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/debug_token?input_token=${this.accessToken}&access_token=${process.env.APP_ID}|${process.env.APP_SECRET}`;
      const response = await fetch(debugUrl);
      const data = await response.json();
      return {
        valid: data.data?.is_valid || false,
        expiresAt: data.data?.expires_at ? (data.data.expires_at === 0 ? 'Không hết hạn' : new Date(data.data.expires_at * 1000).toISOString()) : 'N/A',
        scopes: data.data?.scopes || [],
        appId: data.data?.app_id
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get page information
  async getPageInfo() {
    return this._request(`/${this.pageId}?fields=id,name,category,fan_count,followers_count,picture{url},cover{source},about,description,link`);
  }

  // Publish a text/link post
  async publishPost(message, link = null) {
    const body = { message };
    if (link) body.link = link;
    return this._request(`/${this.pageId}/feed`, 'POST', body);
  }

  // Publish a photo with caption
  async publishPhoto(imageUrl, caption = '') {
    return this._request(`/${this.pageId}/photos`, 'POST', { url: imageUrl, caption });
  }

  // Publish an uploaded photo (multipart, no public URL needed).
  // Takes the raw buffer so it works on serverless runtimes with a
  // read-only filesystem (e.g. Vercel), not just local disk.
  async publishPhotoFile(fileBuffer, filename, mimetype, caption = '') {
    const form = new FormData();
    form.append('source', fileBuffer, { filename, contentType: mimetype });
    form.append('caption', caption);
    form.append('access_token', this.accessToken);

    const response = await fetch(`${this.baseUrl}/${this.pageId}/photos`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message} (Code: ${data.error.code})`);
    }
    return data;
  }

  // Schedule a post
  async schedulePost(message, scheduledTime, link = null) {
    const timestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
    const body = { message, published: false, scheduled_publish_time: timestamp };
    if (link) body.link = link;
    return this._request(`/${this.pageId}/feed`, 'POST', body);
  }

  // Get page posts with engagement
  async getPagePosts(limit = 25) {
    return this._request(`/${this.pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)&limit=${limit}`);
  }

  // Get post insights
  async getPostInsights(postId) {
    try {
      return this._request(`/${postId}/insights?metric=post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total`);
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get page insights
  async getPageInsights(period = 'day', since = null) {
    let endpoint = `/${this.pageId}/insights?metric=page_impressions,page_engaged_users,page_fans,page_views_total&period=${period}`;
    if (since) endpoint += `&since=${Math.floor(new Date(since).getTime() / 1000)}`;
    try {
      return this._request(endpoint);
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Delete a post
  async deletePost(postId) {
    return this._request(`/${postId}`, 'DELETE');
  }

  // Update a post
  async updatePost(postId, message) {
    return this._request(`/${postId}`, 'POST', { message });
  }

  // Get scheduled posts
  async getScheduledPosts() {
    return this._request(`/${this.pageId}/scheduled_posts?fields=id,message,scheduled_publish_time,created_time`);
  }
}

module.exports = MetaApiService;
