// YouTube IFrame API loader. Approved videos only — see README "Spooky mode".
//   ambience : "Horror Ambience Music (Royalty Free) [Quiet]"
//   jumpScare: "Jumpscare Sound Effect | No Copyright"
export const VIDEOS = {
  ambience: 'paRR1vXGgck',
  jumpScare: 'AhIBoBnRm9U',
};

let apiPromise = null;

export function loadYouTubeAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    // Offline / blocked-network play must still work — the caller falls back to
    // the synthesised audio when this rejects.
    tag.onerror = () => reject(new Error('YouTube API unavailable'));
    document.head.appendChild(tag);
  });
  return apiPromise;
}
