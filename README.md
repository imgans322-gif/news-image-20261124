# The World Today — Tuesday 24 November 2026

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/imgans322-gif/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/imgans322-gif/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

An entry for [make.fun's news-image-20261124 bounty](https://make.fun/bounty/news-image-20261124): one image that sums up the world news of Tuesday 24 November 2026.

A newspaper front page summing up 24 November 2026's world news in one image, drawn by `main.ts` (Node 22, standard library only) with a small software rasteriser and a 5x7 bitmap font. No network, no clock, no randomness: two runs write the same bytes.

## Stories (all reported on 24 November 2026)

- **Lead — COP31 climate talks collapse** (Antalya, Turkiye): the summit ends with no agreement, the first COP to close without a consensus deal since 2009.
- **Jensen Huang returns as Nvidia CEO**: the board reinstates him; shares surge about 31% in a day, close to $1 trillion of value.
- **Indonesia factory fire kills 24**: a candy factory in Banten; rescuers search for around 30 workers still missing.
- **Russian cargo ship Sparta II ablaze** after a drone strike in the Gulf of Finland.
- **Max Verstappen wins the Las Vegas Grand Prix.**
- **India–Nepal rail link opens**: the Saryu-Kamala Express, Ayodhya to Janakpur Dham, plus eight pacts.

Ticker: Alcaraz wins his first ATP Finals title; Gukesh defends the World Chess crown in Geneva; FIFA picks a US-led bid for the 2031 Women's World Cup; thousands march in Lisbon over living costs; Delta flights recover for Thanksgiving.

## Run

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1024x1024, PNG, ~22 KB).

## Sources

NBC News most-read (24 Nov 2026), Times of India world news (24 Nov 2026), Jagran Josh / Education Times school-assembly headlines for 24 November 2026, Observer Voice headlines for 24 November 2026, 24HourWire.
