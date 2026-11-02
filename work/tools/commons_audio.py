"""Search Wikimedia Commons audio files and print license + duration.

Usage: python commons_audio.py "query 1" "query 2" ...
       python commons_audio.py --info "File:Name.ogg" ...
"""
import json, sys, time, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "jiashu-film/0.1 (personal short film research)"}


def call(params):
    params["format"] = "json"
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    for attempt in range(4):
        try:
            return json.loads(urllib.request.urlopen(req, timeout=30).read())
        except Exception:
            time.sleep(3 + attempt * 3)
    return {}


def info(titles):
    d = call({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
              "iiprop": "url|size|extmetadata|mediatype", "iiextmetadatafilter": "LicenseShortName|Artist|Credit"})
    for p in d.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = md.get("LicenseShortName", {}).get("value", "?")
        artist = md.get("Artist", {}).get("value", "")[:80]
        print(f"{p['title']}\n    license={lic} dur={ii.get('duration')} size={ii.get('size')} url={ii.get('url')}\n    artist={artist}")


if __name__ == "__main__":
    if sys.argv[1] == "--info":
        info(sys.argv[2:])
    else:
        for q in sys.argv[1:]:
            d = call({"action": "query", "list": "search", "srnamespace": 6, "srlimit": 10, "srsearch": q + " filetype:audio"})
            titles = [r["title"] for r in d.get("query", {}).get("search", [])]
            print(f"== {q}")
            if titles:
                info(titles)
            time.sleep(1.5)
