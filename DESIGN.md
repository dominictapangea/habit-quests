---
name: Habit Quests
description: A day scored like a 1970s electromechanical pinball table, on white enamel.
colors:
  ground: "#fafaf7"
  ink: "#141414"
  ink-soft: "#3a3a36"
  mute: "#62615b"
  hairline: "#d8d4c8"
  surface: "#ffffff"
  surface-press: "#f0ede4"
  red: "#d7261e"
  red-dark: "#a91b15"
  lamp-spent: "#f2c9c6"
  cobalt: "#1f4fb4"
  cobalt-deep: "#163c8c"
  cobalt-lamp-off: "#18418f"
  on-cobalt: "#ffffff"
  on-cobalt-soft: "#c9d6f2"
  yellow: "#f5b700"
  yellow-on-cobalt: "#ffd34d"
  reel: "#141414"
  reel-digit: "#f4f1ea"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum' 1"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 62"
  small:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum' 1"
rounded:
  none: "0px"
  reel: "5px"
  track: "12px"
  round: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  inset: "18px"
  side: "28px"
  column: "40px"
  gutter: "56px"
  gutter-compact: "16px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.red-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-press}"
  button-compact:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "0 14px"
    height: "44px"
  segment-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  area-tab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    padding: "6px 14px"
  score-reel:
    backgroundColor: "{colors.reel}"
    textColor: "{colors.reel-digit}"
    typography: "{typography.headline}"
    rounded: "{rounded.reel}"
    width: "44px"
    height: "62px"
  level-badge:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "92px"
  xp-track:
    backgroundColor: "{colors.cobalt-deep}"
    rounded: "{rounded.track}"
    height: "22px"
  xp-fill:
    backgroundColor: "{colors.yellow}"
  bonus-insert:
    backgroundColor: "{colors.cobalt-lamp-off}"
    textColor: "{colors.on-cobalt-soft}"
    rounded: "{rounded.round}"
    size: "44px"
  bonus-insert-lit:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
  day-lamp:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.round}"
    size: "34px"
  day-lamp-lit:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
  day-lamp-spent:
    backgroundColor: "{colors.lamp-spent}"
    textColor: "{colors.red-dark}"
  level-up-band:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    padding: "14px 0"
    width: "100%"
---

# Design System: Habit Quests

## Overview

**Creative North Star: "The Playfield Scoring Unit"**

The page is a 1970s electromechanical pinball table seen in daylight. A white enamel playfield (the ground) carries black-framed work areas; a cobalt scoring unit across the top holds the numbers that matter: black digit reels for XP and streak, a yellow level badge, a yellow XP bar, and a ladder of round bonus inserts that light red. History is a month of round day lamps. Numbers own the screen; everything else is ink, hairline and narrow uppercase labels.

Density is tight and tabular, like a scorecard. Rank comes from weight, case and width, not from many sizes: three type sizes run the whole page, and only the level-up band is allowed to shout. Depth is flat print, with one exception that belongs to the world: lit lamps glow. Motion is mechanical: reels roll, inserts and lamps switch on, the level-up band opens from its centre line, chases its lamps for about 1.5 s, and never blocks the page. Reduced motion swaps values instantly.

The world rejects the habit-app category default (a violet progress ring, a flame emoji, soft rounded cards) and the gamer default (neon on black).

**Key Characteristics:**
- White enamel ground, ink frames, screened red, cobalt scoring unit, sunflower yellow for level.
- Archivo Variable with its width axis: narrow (62%) uppercase for labels and actions, normal width for content.
- Tabular numerals everywhere; XP right-aligned in its own column.
- Square corners on everything except round inserts, lamps, dots and the badge.
- Done things retire to grayscale; lit things are red.
- Nothing on screen is a made-up number: the scoring unit stays dark until the server answers.

## Colors

A five-ink print palette: white enamel and ink carry the page, red, cobalt and yellow each own one job.

### Primary
- **Screened Red** (red): the action and "lit" colour. Primary buttons (Add quest, Complete), the lit bonus insert, lit day lamps on the current chain, the hard-difficulty dot, the level-up chase lamps.
- **Deep Red** (red-dark): red's pressed/hover state, and red text on white (overdue line, form error, failure notice) where full red would be too light for small text.

### Secondary
- **Scoreboard Cobalt** (cobalt): the field of the scoring unit, full width at the top. Also the medium-difficulty dot. It is not used as a surface anywhere else.
- **Cobalt Deep** (cobalt-deep): the empty XP track inside the scoring unit.
- **Unlit Insert Cobalt** (cobalt-lamp-off): bonus inserts that are not lit.
- **On-Cobalt White** (on-cobalt) and **Pale Cobalt** (on-cobalt-soft): primary and secondary text on cobalt.

### Tertiary
- **Sunflower Yellow** (yellow): the level badge, the XP fill, the level-up band, today's ring in the calendar, the easy-difficulty dot, the XP number in a selected difficulty segment, text selection.
- **Light Sunflower** (yellow-on-cobalt): yellow used as text on cobalt (the brand line). Sunflower itself is only 4.1:1 on cobalt; this lighter step is 5.2:1.

### Neutral
- **White Enamel** (ground): the page ground.
- **Ink** (ink): text, every frame, area tabs, the scoring unit's bottom edge, focus rings, selected segments, the chain bar between calendar lamps.
- **Reel Black** (reel) and **Ivory Digit** (reel-digit): score reel drums and their digits.
- **Soft Ink** (ink-soft): unlit day-lamp numbers, scrollbar thumb.
- **Muted Graphite** (mute): secondary lines, placeholders, weekday heads, done rows, the empty-state text.
- **Warm Hairline** (hairline): 1px dividers between rows, the calendar legend rule, unlit lamp rims.
- **Card White** (surface): the inside of work areas, buttons, fields and segments.
- **Press Paper** (surface-press): hover on white buttons and calendar arrows.
- **Spent Lamp Pink** (lamp-spent): a day that was lit but is no longer part of the current streak.

### Named Rules
**The One Job Rule.** Red means act or lit; cobalt means score; yellow means level. A new surface does not borrow a colour for a different job.

**The Cobalt Owns the Score Rule.** Cobalt is a field only in the scoring unit. Work areas stay white on white enamel.

**The Readable Yellow Rule.** Yellow text on cobalt uses Light Sunflower, never Sunflower. Red text on white uses Deep Red.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui, sans-serif)
**Body Font:** Archivo Variable (same family)

**Character:** One grotesque used at two widths. Narrow uppercase (width 62%) is the stencilled voice of a playfield's printed labels; normal width carries quest titles and dates. All numerals are tabular, so XP, dates and reels never jitter.

### Hierarchy
- **Display** (800, 88px, line-height 1, width 62%, uppercase, 0.04em): the level-up band only ("Level N"). Scales to 0.6x below 480px.
- **Headline** (700, 38px, line-height 1): digits on the score reels; the level number in the badge (800).
- **Title** (600, 15px): quest and completion titles; XP values (700); month name (700).
- **Body** (400, 15px, line-height 1.45): the page default, segment text, inputs, secondary buttons (700).
- **Label** (700, 13px, width 62%, 0.08em, uppercase): area tabs, form legends, weekday heads, scoring-unit captions, the "Done" tag. Primary buttons use the label voice at 15px.
- **Small** (400, 13px): difficulty/recurrence lines, dates, the "XP" unit after values, calendar legend.

### Named Rules
**The Three Sizes Rule.** The page uses 13px, 15px and 38px. Rank comes from weight, case and width. The level-up band at 88px is the single sanctioned exception.

**The Tabular Rule.** Every number is set in tabular figures, and XP sits in a right-aligned column.

## Layout

Desktop: the scoring unit spans the full width (three columns: brand + XP reels | level badge + XP bar | streak reels + bonus ladder; 48px gaps; 28px 56px padding; 4px ink bottom edge). Below it, a two-column grid: a fluid Quests area and a fixed 420px side column (Streak calendar above Recent completions, 28px apart), 40px column gap, 56px side gutters.

Quest rows are a fixed five-column grid: difficulty dot (14px), title block, when-line (190px), XP (64px), action (132px), 16px gaps, 14px 18px padding. Open quests list before done ones. Work areas use an 18px inset.

At 1180px and below everything stacks into one column with 16px gutters, and the scoring unit stacks with the ladder left-aligned and wrapping. At 720px and below quest rows restack (dot, title, XP on top; when-line; a full-width action) and the create form folds behind a full-width "New quest" button. At 480px and below inserts shrink to 38px and the badge to 76px.

## Elevation & Depth

Flat print. Frames, rules and colour fields make structure; nothing lifts off the playfield at rest. The only light in the world comes from lamps: a lit bonus insert and a lit calendar lamp on the current chain glow red. The level-up band is the only element that sits above the page, with a soft drop under it and a light ink dim over the page.

### Shadow Vocabulary
- **Insert glow** (`box-shadow: 0 2px 10px rgb(215 38 30 / 0.55)`): lit bonus insert.
- **Lamp glow** (`box-shadow: 0 2px 8px rgb(215 38 30 / 0.45)`): calendar lamps in the current chain.
- **Band lift** (`box-shadow: 0 12px 40px rgb(20 20 20 / 0.35)`): the level-up band, over a `rgb(20 20 20 / 0.18)` dim.
- **Reel drum shading** (a top and bottom inner gradient to `rgb(0 0 0 / 0.7)`): curvature of the digit drums, not elevation.

### Named Rules
**The Only Lamps Glow Rule.** Glow is light from a lit lamp, never elevation. Frames, buttons and rows have no shadow.

## Shapes

Square by default: frames, buttons, fields, segments and tabs have 0 radius. Round is reserved for lamp-like things: bonus inserts (44px, 3px ink rim), day lamps (34px, 2px rim), difficulty dots (14px, 2px ink rim), the level badge (92px, 4px ink rim), the level-up chase lamps. Two physical exceptions: reel windows (5px) and the XP track (12px, 3px ink border), which reads as a slot in the cabinet.

Border weights form one system: 1px warm hairline between rows; 2px ink for every area frame and control; 3px ink for insert rims, the XP track and the fill's leading edge; 4px ink for the scoring unit's bottom edge, the badge rim and the level-up band's edges. Areas are headed by a black tab label that sits on the frame's top-left corner.

## Components

### Buttons
Blunt and printed, like a cabinet's push-buttons.
- **Shape:** square (0), 44px tall, 2px ink border.
- **Primary:** Screened Red with white narrow uppercase label, 0 20px padding. One per row (Complete) and one in the form (Add quest).
- **Secondary:** white with ink text at 700 (New quest toggle on phones, Undo at a compact 36px with 0 14px padding).
- **Hover / Active:** primary darkens to Deep Red, white buttons to Press Paper (150ms); press nudges down 1px (80ms). Disabled at 55% opacity.
- **Focus:** 3px ink outline, 3px offset (the global focus ring).

### Segmented controls
- **Style:** a 2px ink frame divided by 2px ink rules, 44px tall; each segment white with 0 14px padding. Difficulty segments carry their XP in Muted Graphite.
- **Selected:** ink fill with white text; the XP number turns Sunflower.
- **Focus:** an inset ring (3px white inside 3px ink) on the segment face, since the radio itself is invisible.

### Work areas
- **Corner Style:** square.
- **Background:** Card White on White Enamel.
- **Border:** 2px ink, headed by a black label tab (6px 14px).
- **Internal Padding:** 18px; rows divided by 1px hairlines.

### Inputs / Fields
- **Style:** 2px ink border, white, square, 44px tall, 0 12px padding; placeholder in Muted Graphite.
- **Focus:** the global 3px ink ring.
- **Error:** border turns Screened Red; the message below in Deep Red at 600.

### Quest row
Difficulty dot, title (600) over a small difficulty/recurrence line, when-line, right-aligned XP with a small "XP" unit, and the Complete button. Overdue when-lines are Deep Red 700. Done rows retire: title and XP go Muted Graphite, the dot goes grayscale at 50%, the when-line reads "Done <date>" (plus "· late"), and the action becomes a "Done" label.

### Score reels (signature)
Black 44 x 62px drums, 4px apart, ivory 38px digits, curved-drum shading; a unit label (XP, day/days) follows. On change the drums roll to the new value over 900ms. Until the server answers the drums stay dark with no digits. Used twice: five reels for XP, two for the streak.

### Level badge and XP bar
A 92px Sunflower disc with a 4px ink rim holding "Level" and the number. Beside it a 22px cobalt-deep slot; the yellow fill's width is the progress through the level (900ms), with a 3px ink leading edge so even a thin fill reads. Captions above ("Level 3 → 4", "47 / 300 XP") and below ("253 XP to level 4") in the cobalt text colours.

### Bonus ladder
Seven round inserts, 2 to 14, 8px apart, 3px ink rims, unlit in Unlit Insert Cobalt. Inserts up to today's daily bonus light red with the insert glow (300ms).

### Lamp calendar
A Monday-first month of 34px day lamps in a seven-column grid. Unlit days: white with a hairline rim. Lit days on the current chain: red with ink rim and lamp glow, joined to the previous day by a 6px ink bar. Lit days outside the chain: Spent Lamp Pink with a red rim. Today: a 3px Sunflower ring at 2px offset. Future days: dashed rim. Square 36px arrow buttons with inline SVG chevrons; a hairline-ruled legend below.

### Level-up band
A full-width Sunflower band with 4px ink edges, a row of 18 chasing red lamps above and below, and one "Level N" headline at display size. It opens from the centre line (450ms), holds, and fades with the dim over 1.5s; pointer events pass through. Reduced motion shows it without animation.

## Do's and Don'ts

### Do:
- **Do** keep red for actions and lit lamps, cobalt for the scoring unit, yellow for level.
- **Do** set every number in tabular figures and right-align XP in its column.
- **Do** head every work area with a black tab label on a 2px ink frame.
- **Do** use the narrow (62%) uppercase voice for captions, tabs, primary actions and the level-up band, and normal width for content.
- **Do** retire done items to Muted Graphite and grayscale rather than hiding them.
- **Do** keep the scoring unit blank (dark reels, no digits) until real data arrives.
- **Do** use the 3px ink focus ring with 3px offset; on invisible-input controls, draw an inset white+ink ring on the visible face.
- **Do** make every motion end on the server's value, and swap values instantly under reduced motion.

### Don't:
- **Don't** add a fourth type size; the level-up band is the only exception.
- **Don't** round frames, buttons, fields or rows; round is for inserts, lamps, dots and the badge.
- **Don't** put shadows on frames, buttons or rows; only lit lamps glow.
- **Don't** use Sunflower as text on cobalt or full red as small text on white.
- **Don't** use a violet progress ring, a flame emoji, soft rounded cards, or neon on black.
- **Don't** use emoji or font glyphs as icons; icons are inline SVG drawn with a stroke in currentColor.
