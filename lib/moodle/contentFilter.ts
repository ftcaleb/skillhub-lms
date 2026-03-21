const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<"'>]*)?/g
const VIMEO_REGEX = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)(?:[^\s<"'>]*)?/g

export function applyMoodleContentFilters(
  html: string,
  token: string,
  moodleBaseUrl: string,
): string {
  if (!html) return ''

  let processed = html

  // 1) Rewrite pluginfile URLs to webservice/pluginfile.php and append token.
  processed = processed.replace(
    /(src|href|poster|data)=(["'])(https?:\/\/(?:[^"']*?)pluginfile\.php(?:[^"']*?))(\2)/gi,
    (_, attr, quote, url) => {
      const wsUrl = url.replace('/pluginfile.php', '/webservice/pluginfile.php')
      const separator = wsUrl.includes('?') ? '&' : '?'
      const tokenUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`
      return `${attr}=${quote}${tokenUrl}${quote}`
    },
  )

  // 2) If the page already contains a real embedded video iframe, skip automatic link-to-iframe conversions.
  const hasEmbeddedVideoIframe = /<iframe[^>]+src=["']https?:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\/[^"']+["'][^>]*>/i.test(processed)
  if (!hasEmbeddedVideoIframe) {
    processed = processed.replace(YOUTUBE_REGEX, (match, videoId) => {
      if (!videoId) return match
      return `<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0;"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`
    })

    processed = processed.replace(VIMEO_REGEX, (match, videoId) => {
      if (!videoId) return match
      return `<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0;"><iframe src="https://player.vimeo.com/video/${videoId}" title="Vimeo video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`
    })
  }

  return processed
}
