(function () {
  function readCode() {
    try {
      var q = new URLSearchParams(location.search).get("c");
      if (q) return q;
    } catch (e) {}
    var m = /\/a\/([^\/?#]+)/.exec(location.pathname);
    return m ? m[1] : null;
  }

  function decode(code) {
    if (!code || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    var b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    try {
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (e) { return null; }
  }

  function hostAllowed(h) {
    h = h.toLowerCase();
    if (h === "franime.fr" || h === "www.franime.fr") return true;
    if (h === "nakenime.tv" || h === "www.nakenime.tv") return true;
    return /^([a-z0-9-]+\.)*anime-sama\.[a-z]{2,}$/.test(h);
  }

  function target(raw) {
    if (!raw) return null;
    try {
      var u = new URL(raw);
      if (u.protocol !== "https:") return null;
      if (!hostAllowed(u.hostname)) return null;
      return u.href;
    } catch (e) { return null; }
  }

  var url = target(decode(readCode()));
  if (url) location.replace(url);
})();
