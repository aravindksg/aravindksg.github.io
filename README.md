# aravindksg.github.io

Personal site. Plain Jekyll on GitHub Pages — no remote theme, no build step beyond `jekyll build`.

## Run it locally

```bash
bundle install          # once
bundle exec jekyll serve # http://localhost:4000, live reload
```

## Where things live

| Path | What it is |
|---|---|
| `_config.yml` | Identity, social links, and the whole hero block (headline, blurb, CTA buttons) |
| `_data/timeline.yml` | Career timeline — one entry per year, oldest first. Drives the year scrubber |
| `_data/work.yml` | Selected-work cards. `groups` must match names in `filters.yml` |
| `_data/filters.yml` | Filter chips above the work grid; `All` stays first |
| `_data/metrics.yml` | The counted-up numbers in the hero strip |
| `_data/publications.yml` | Peer-reviewed papers, newest first |
| `_layouts/default.html` | Page shell: head, SEO tags, JSON-LD, section order |
| `_includes/*.html` | One file per section — markup only, content comes from the data files |
| `assets/css/style.scss` | All styling. Colour and type tokens are the `:root` block at the top |
| `assets/js/site.js` | Timeline, work filter, theme toggle, metric count-up, hero canvas |
| `career-matrix/` | Password-gated page (staticrypt), independent of the layout above |

**To change content, edit the YAML.** The includes read from `site.data.*` and the JS reads the
timeline and work arrays from `window.SITE`, injected by the layout.

## The hero illustration

`assets/js/site.js` draws a silicon die as a yantra — interlocking triangles and a lotus ring around
a floorplanned package — with three ranks of cluster nodes wired back to it. Soft waves leave the
core every ~3.6s and light each rank as they pass. Colours are read from the CSS tokens, so the
theme toggle repaints it. Honours `prefers-reduced-motion` by rendering one still frame.
